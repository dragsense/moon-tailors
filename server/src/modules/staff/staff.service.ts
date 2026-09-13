import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import type { EntityManager } from "typeorm";
import type {
  IMessageResponse,
  IPaginatedResponse,
  IStaff,
  IStaffEmployment,
  TCreateStaffData,
  TGetQuery,
  TStaffLeaveData,
  TStaffListQuery,
  TStaffRejoinData,
  TStaffSalaryData,
  TUpdateStaffData,
} from "@moon-tailors/contracts";
import {
  EResource,
  EStaffPayType,
  EStaffStatus,
  filtersFromListSchema,
  staffListQuerySchema,
} from "@moon-tailors/contracts";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { PermissionsService } from "../../common/base";
import { RequestContext } from "../../common/context";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import { DomainEventRegistry } from "../../common/events";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { StaffEmploymentEntity } from "./entities/staff-employment.entity";
import { StaffEntity } from "./entities/staff.entity";

export const STAFF_QUERY: EntityQueryConfig = {
  alias: "staff",
  searchable: ["name", "phone", "role"],
  sortable: ["createdAt", "updatedAt", "name"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(staffListQuerySchema),
};

const EMPLOYMENTS = "employments";

@Injectable()
export class StaffService implements OnModuleInit {
  private readonly entity: IBoundEntityService<StaffEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(StaffEntity, STAFF_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.STAFF);
    ActivityLogRegistry.register({
      module: "staff",
      endpoints: ["/api/staff"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "staff",
      events: { endpoint: "/api/staff" },
    });
  }

  /** Profile + first work period in one transaction. */
  async create(input: TCreateStaffData): Promise<IMessageResponse> {
    const phone = input.phone.trim();
    await this.assertPhoneAvailable(phone);

    await this.entity.create(
      {
        name: input.name.trim(),
        phone,
        role: emptyToNull(input.role),
        status: EStaffStatus.ACTIVE,
        address: emptyToNull(input.address),
        notes: emptyToNull(input.notes),
      },
      {
        afterCreate: async (staff, manager) => {
          await this.openEmployment(manager, staff.id, {
            joinDate: input.joinDate,
            payType: input.payType,
            salary: input.salary,
          });
        },
      },
    );

    return { message: "Staff member created successfully" };
  }

  async list(query: TStaffListQuery): Promise<IPaginatedResponse<IStaff>> {
    const page = await this.entity.list(query, { _relations: [EMPLOYMENTS] });
    return { ...page, data: page.data.map((row) => this.toPayload(row)) };
  }

  async get(key: EntityKey, query: TGetQuery = {}): Promise<IStaff> {
    const relations = new Set([...(query._relations ?? []), EMPLOYMENTS]);
    const row = await this.entity.require(key, {
      _relations: [...relations],
      _select: query._select,
    });
    return this.toPayload(row);
  }

  /** Profile only — work periods change through leave / rejoin. */
  async update(
    key: EntityKey,
    input: TUpdateStaffData,
  ): Promise<IMessageResponse> {
    const existing = await this.entity.require(key);
    const patch: Partial<StaffEntity> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.phone !== undefined) {
      const phone = input.phone.trim();
      await this.assertPhoneAvailable(phone, existing.id);
      patch.phone = phone;
    }
    if (input.role !== undefined) patch.role = emptyToNull(input.role);
    if (input.address !== undefined) patch.address = emptyToNull(input.address);
    if (input.notes !== undefined) patch.notes = emptyToNull(input.notes);
    if (Object.keys(patch).length > 0) {
      await this.entity.update(key, patch);
    }
    return { message: "Staff member updated successfully" };
  }

  /** Change salary / rate on the open work period (active staff only). */
  async changeSalary(
    key: EntityKey,
    input: TStaffSalaryData,
  ): Promise<IMessageResponse> {
    const staff = await this.entity.require(key);
    if (staff.status === EStaffStatus.LEFT) {
      throw new BadRequestException(
        "This staff member has left — rejoin them to set a new salary",
      );
    }
    const manager = this.entity.getManager();
    const open = await this.openPeriod(manager, staff.id);
    if (!open) {
      throw new BadRequestException("No open work period to update");
    }
    open.salary = String(input.salary ?? 0);
    await manager.save(open);
    return { message: "Salary updated successfully" };
  }

  /** Close the open work period and mark the staff member as left. */
  async leave(
    key: EntityKey,
    input: TStaffLeaveData,
  ): Promise<IMessageResponse> {
    const existing = await this.entity.require(key);
    if (existing.status === EStaffStatus.LEFT) {
      throw new BadRequestException("This staff member has already left");
    }

    await this.entity.update(
      key,
      { status: EStaffStatus.LEFT },
      {
        afterUpdate: async (staff, manager) => {
          const open = await this.openPeriod(manager, staff.id);
          if (!open) {
            throw new BadRequestException("No open work period to close");
          }
          if (input.leaveDate < dateOnly(open.joinDate)) {
            throw new BadRequestException(
              "Leave date must be on or after join date",
            );
          }
          open.leaveDate = input.leaveDate;
          open.leaveReason = emptyToNull(input.reason);
          await manager.save(open);
        },
      },
    );
    return { message: "Staff member marked as left" };
  }

  /** Start a new work period — pay type and salary may differ from before. */
  async rejoin(
    key: EntityKey,
    input: TStaffRejoinData,
  ): Promise<IMessageResponse> {
    const existing = await this.entity.require(key);
    if (existing.status === EStaffStatus.ACTIVE) {
      throw new BadRequestException("This staff member is already active");
    }

    await this.entity.update(
      key,
      { status: EStaffStatus.ACTIVE },
      {
        afterUpdate: async (staff, manager) => {
          const lastDate = await this.lastHistoryDate(manager, staff.id);
          if (lastDate && input.joinDate <= lastDate) {
            throw new BadRequestException(
              `Rejoin date must be after ${lastDate} (end of their previous work period)`,
            );
          }
          await this.openEmployment(manager, staff.id, {
            joinDate: input.joinDate,
            payType: input.payType,
            salary: input.salary,
            notes: input.notes,
          });
        },
      },
    );
    return { message: "Staff member rejoined" };
  }

  /** Active headcount split by the pay type of their open period. */
  async counts(): Promise<{ active: number; fixed: number; onDemand: number }> {
    const rows = await this.entity
      .getManager()
      .getRepository(StaffEmploymentEntity)
      .createQueryBuilder("employment")
      .innerJoin("employment.staff", "staff")
      .select("employment.payType", "payType")
      .addSelect("COUNT(DISTINCT staff.id)", "count")
      .where("staff.deletedAt IS NULL")
      .andWhere("staff.status = :status", { status: EStaffStatus.ACTIVE })
      .andWhere("employment.deletedAt IS NULL")
      .andWhere("employment.leaveDate IS NULL")
      .groupBy("employment.payType")
      .getRawMany<{ payType: EStaffPayType; count: string }>();
    const byType = (type: EStaffPayType) =>
      Number(rows.find((row) => row.payType === type)?.count ?? 0);
    const fixed = byType(EStaffPayType.FIXED);
    const onDemand = byType(EStaffPayType.ON_DEMAND);
    return { active: fixed + onDemand, fixed, onDemand };
  }

  private openEmployment(
    manager: EntityManager,
    staffId: string,
    input: {
      joinDate: string;
      payType: EStaffPayType;
      salary?: number;
      notes?: string;
    },
  ): Promise<StaffEmploymentEntity> {
    const repo = manager.getRepository(StaffEmploymentEntity);
    return manager.save(
      repo.create({
        staffId,
        tenantId: RequestContext.get("tenantId") ?? null,
        joinDate: input.joinDate,
        leaveDate: null,
        payType: input.payType,
        salary: String(input.salary ?? 0),
        leaveReason: null,
        notes: emptyToNull(input.notes),
      }),
    );
  }

  private openPeriod(manager: EntityManager, staffId: string) {
    return manager
      .getRepository(StaffEmploymentEntity)
      .createQueryBuilder("employment")
      .where("employment.staffId = :staffId", { staffId })
      .andWhere("employment.deletedAt IS NULL")
      .andWhere("employment.leaveDate IS NULL")
      .orderBy("employment.joinDate", "DESC")
      .getOne();
  }

  /** Latest join or leave date across every period — new periods start after it. */
  private async lastHistoryDate(
    manager: EntityManager,
    staffId: string,
  ): Promise<string | null> {
    const periods = await manager
      .getRepository(StaffEmploymentEntity)
      .createQueryBuilder("employment")
      .where("employment.staffId = :staffId", { staffId })
      .andWhere("employment.deletedAt IS NULL")
      .getMany();
    const dates = periods.flatMap((period) =>
      period.leaveDate
        ? [dateOnly(period.joinDate), dateOnly(period.leaveDate)]
        : [dateOnly(period.joinDate)],
    );
    return dates.length ? dates.sort().at(-1)! : null;
  }

  private async assertPhoneAvailable(phone: string, excludeId?: string) {
    const qb = this.entity
      .getRepository()
      .createQueryBuilder("staff")
      .where("staff.deletedAt IS NULL")
      .andWhere("staff.phone = :phone", { phone });
    if (excludeId) {
      qb.andWhere("staff.id != :excludeId", { excludeId });
    }
    const taken = await qb.getOne();
    if (taken) {
      throw new ConflictException(
        "A staff member with this phone already exists",
      );
    }
  }

  private toPayload(row: StaffEntity): IStaff {
    const employments = (row.employments ?? [])
      .filter((employment) => !employment.deletedAt)
      .map(toEmploymentPayload)
      .sort((a, b) => b.joinDate.localeCompare(a.joinDate));
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      role: row.role ?? undefined,
      status:
        row.status === EStaffStatus.LEFT
          ? EStaffStatus.LEFT
          : EStaffStatus.ACTIVE,
      address: row.address ?? undefined,
      notes: row.notes ?? undefined,
      currentEmployment: employments[0] ?? null,
      employments,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }
}

function toEmploymentPayload(row: StaffEmploymentEntity): IStaffEmployment {
  return {
    id: row.id,
    joinDate: dateOnly(row.joinDate),
    leaveDate: row.leaveDate ? dateOnly(row.leaveDate) : null,
    payType:
      row.payType === EStaffPayType.ON_DEMAND
        ? EStaffPayType.ON_DEMAND
        : EStaffPayType.FIXED,
    salary: Number(row.salary ?? 0),
    leaveReason: row.leaveReason ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function emptyToNull(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
}

function dateOnly(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);
}

function toIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
