import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import type {
  IMessageResponse,
  IPaginatedResponse,
  IStaff,
  IStaffPayment,
  IStaffSlip,
  TCreateStaffData,
  TCreateStaffPaymentData,
  TGetQuery,
  TStaffListQuery,
  TStaffSlipQuery,
  TUpdateStaffData,
  TUpdateStaffPaymentData,
} from "@moon-tailors/contracts";
import {
  EResource,
  EStaffPayType,
  filtersFromListSchema,
  staffListQuerySchema,
} from "@moon-tailors/contracts";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { PermissionsService } from "../../common/base";
import { RequestContext } from "../../common/context";
import { EntityService, type IBoundEntityService } from "../../common/database";
import { DomainEventRegistry } from "../../common/events";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { StaffPaymentEntity } from "./entities/staff-payment.entity";
import { StaffEntity } from "./entities/staff.entity";

export const STAFF_QUERY: EntityQueryConfig = {
  alias: "staff",
  searchable: ["name", "phone", "role"],
  sortable: ["createdAt", "updatedAt", "name"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(staffListQuerySchema),
};

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

  async create(input: TCreateStaffData): Promise<IMessageResponse> {
    await this.assertPhoneAvailable(input.phone.trim());
    await this.entity.create(this.toRow(input));
    return { message: "Staff member created successfully" };
  }

  async list(query: TStaffListQuery): Promise<IPaginatedResponse<IStaff>> {
    const page = await this.entity.list(query);
    const totals = await this.totalsByStaff(page.data.map((row) => row.id));
    return {
      ...page,
      data: page.data.map((row) => toPayload(row, totals.get(row.id))),
    };
  }

  /** Detail adds every payment, newest first. */
  async get(key: EntityKey, query: TGetQuery = {}): Promise<IStaff> {
    const row = await this.entity.require(key, {
      _relations: query._relations,
      _select: query._select,
    });
    const [totals, payments] = await Promise.all([
      this.totalsByStaff([row.id]),
      this.paymentsFor(row.id),
    ]);
    const payType = payTypeOf(row);
    return {
      ...toPayload(row, totals.get(row.id)),
      payments: payments.map((payment) => toPaymentPayload(payment, payType)),
    };
  }

  async update(
    key: EntityKey,
    input: TUpdateStaffData,
  ): Promise<IMessageResponse> {
    const existing = await this.entity.require(key);
    if (input.phone !== undefined) {
      await this.assertPhoneAvailable(input.phone.trim(), existing.id);
    }
    const patch = this.toRow(input);
    if (Object.keys(patch).length > 0) {
      await this.entity.update(key, patch);
    }
    return { message: "Staff member updated successfully" };
  }

  /**
   * Record money handed to the staff member. Deliberately uncapped — the
   * amount is informational and nothing is derived from it.
   */
  async addPayment(
    key: EntityKey,
    input: TCreateStaffPaymentData,
  ): Promise<IMessageResponse> {
    const staff = await this.entity.require(key);
    const onDemand = payTypeOf(staff) === EStaffPayType.ON_DEMAND;
    // Fixed staff take their total from the salary, so any total sent is dropped.
    if (onDemand && input.totalAmount === undefined) {
      throw new BadRequestException(
        "Total amount is required for on-demand staff",
      );
    }

    const manager = this.entity.getManager();
    await manager.save(
      manager.getRepository(StaffPaymentEntity).create({
        staffId: staff.id,
        tenantId: RequestContext.get("tenantId") ?? null,
        paymentDate: input.paymentDate,
        totalAmount: onDemand ? String(input.totalAmount) : null,
        amount: String(input.amount),
        notes: emptyToNull(input.notes),
      }),
    );
    return { message: "Payment added successfully" };
  }

  /** Correct a recorded payment. Same rules as adding one. */
  async updatePayment(
    key: EntityKey,
    paymentId: string,
    input: TUpdateStaffPaymentData,
  ): Promise<IMessageResponse> {
    const staff = await this.entity.require(key);
    const manager = this.entity.getManager();
    const repo = manager.getRepository(StaffPaymentEntity);
    const payment = await repo.findOne({
      where: { id: paymentId, staffId: staff.id },
    });
    if (!payment || payment.deletedAt) {
      throw new NotFoundException("Payment not found");
    }

    const onDemand = payTypeOf(staff) === EStaffPayType.ON_DEMAND;
    if (input.paymentDate !== undefined) {
      payment.paymentDate = input.paymentDate;
    }
    if (input.amount !== undefined) payment.amount = String(input.amount);
    if (input.notes !== undefined) payment.notes = emptyToNull(input.notes);
    // A fixed-salary member has no per-payment total, whatever was sent.
    if (!onDemand) {
      payment.totalAmount = null;
    } else if (input.totalAmount !== undefined) {
      payment.totalAmount = String(input.totalAmount);
    }

    await manager.save(payment);
    return { message: "Payment updated successfully" };
  }

  /**
   * One month of pay: what it was worth, what was handed over, what is left.
   * The total is the monthly salary for fixed staff and the month’s recorded
   * totals for on-demand staff. None of it caps `addPayment` — it is a
   * read-out, not a rule.
   */
  async slip(key: EntityKey, query: TStaffSlipQuery): Promise<IStaffSlip> {
    const staff = await this.entity.require(key);
    const { month } = query;
    const payType = payTypeOf(staff);
    const payments = await this.paymentsFor(staff.id, {
      start: `${month}-01`,
      end: monthEnd(month),
    });

    const paid = money(
      payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    );
    const salary = Number(staff.salary ?? 0);
    const total =
      payType === EStaffPayType.ON_DEMAND
        ? money(
            payments.reduce(
              (sum, payment) => sum + Number(payment.totalAmount ?? 0),
              0,
            ),
          )
        : salary;
    const totals = await this.totalsByStaff([staff.id]);

    return {
      month,
      staff: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role ?? undefined,
        payType,
        salary,
      },
      total,
      paid,
      remaining: money(total - paid),
      totalPaid: totals.get(staff.id)?.paid ?? 0,
    };
  }

  /** Headcount split by pay type, plus everything ever paid, for the dashboard. */
  async summary(): Promise<{
    count: number;
    fixed: number;
    onDemand: number;
    paid: number;
  }> {
    const rows = await this.entity
      .getRepository()
      .createQueryBuilder("staff")
      .select("staff.payType", "payType")
      .addSelect("COUNT(staff.id)", "count")
      .where("staff.deletedAt IS NULL")
      .groupBy("staff.payType")
      .getRawMany<{ payType: EStaffPayType; count: string }>();
    const byType = (type: EStaffPayType) =>
      Number(rows.find((row) => row.payType === type)?.count ?? 0);
    const fixed = byType(EStaffPayType.FIXED);
    const onDemand = byType(EStaffPayType.ON_DEMAND);

    const totals = await this.totalsByStaff();
    let total = 0;
    for (const value of totals.values()) total += value.paid;

    return { count: fixed + onDemand, fixed, onDemand, paid: money(total) };
  }

  /** Payments for one staff member, newest first, optionally within a date range. */
  private paymentsFor(
    staffId: string,
    range?: { start: string; end: string },
  ): Promise<StaffPaymentEntity[]> {
    const qb = this.entity
      .getManager()
      .getRepository(StaffPaymentEntity)
      .createQueryBuilder("payment")
      .where("payment.staffId = :staffId", { staffId })
      .andWhere("payment.deletedAt IS NULL")
      .orderBy("payment.paymentDate", "DESC")
      .addOrderBy("payment.createdAt", "DESC");
    if (range) {
      qb.andWhere("payment.paymentDate BETWEEN :start AND :end", range);
    }
    return qb.getMany();
  }

  /**
   * Lifetime paid and recorded totals per staff member, in one grouped query.
   * Pass no ids for everyone (dashboard). `total` stays null when no payment
   * carried one, which is always the case for fixed-salary staff.
   */
  private async totalsByStaff(
    staffIds?: string[],
  ): Promise<Map<string, StaffTotals>> {
    const result = new Map<string, StaffTotals>();
    if (staffIds && staffIds.length === 0) return result;

    const qb = this.entity
      .getManager()
      .getRepository(StaffPaymentEntity)
      .createQueryBuilder("payment")
      .innerJoin("payment.staff", "staff")
      .select("payment.staffId", "staffId")
      .addSelect("COALESCE(SUM(payment.amount), 0)", "paid")
      .addSelect("SUM(payment.totalAmount)", "total")
      .where("payment.deletedAt IS NULL")
      .andWhere("staff.deletedAt IS NULL")
      .groupBy("payment.staffId");
    if (staffIds) {
      qb.andWhere("payment.staffId IN (:...staffIds)", { staffIds });
    }

    const rows = await qb.getRawMany<{
      staffId: string;
      paid: string;
      total: string | null;
    }>();
    for (const row of rows) {
      const paid = money(Number(row.paid));
      const total = row.total === null ? null : money(Number(row.total));
      result.set(row.staffId, {
        paid,
        total,
        remaining: total === null ? null : money(total - paid),
      });
    }
    return result;
  }

  /** Trimmed columns for create / update — only the keys actually supplied. */
  private toRow(input: TUpdateStaffData): Partial<StaffEntity> {
    const patch: Partial<StaffEntity> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.phone !== undefined) patch.phone = input.phone.trim();
    if (input.role !== undefined) patch.role = emptyToNull(input.role);
    if (input.payType !== undefined) patch.payType = input.payType;
    if (input.salary !== undefined) patch.salary = String(input.salary);
    if (input.address !== undefined) patch.address = emptyToNull(input.address);
    if (input.notes !== undefined) patch.notes = emptyToNull(input.notes);
    return patch;
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
}

/** Lifetime figures for one staff member. `total` is on-demand only. */
type StaffTotals = {
  paid: number;
  total: number | null;
  remaining: number | null;
};

const NO_TOTALS: StaffTotals = { paid: 0, total: null, remaining: null };

function toPayload(row: StaffEntity, totals: StaffTotals = NO_TOTALS): IStaff {
  // A fixed salary has no lifetime total, even if older payments still carry
  // one from a spell on demand — their totals come from the salary instead.
  const lifetime =
    payTypeOf(row) === EStaffPayType.ON_DEMAND ? totals : NO_TOTALS;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role ?? undefined,
    payType: payTypeOf(row),
    salary: Number(row.salary ?? 0),
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    totalPaid: totals.paid,
    totalAmount: lifetime.total,
    totalRemaining: lifetime.remaining,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

/** `payType` is the member's current one — fixed staff report no total. */
function toPaymentPayload(
  row: StaffPaymentEntity,
  payType: EStaffPayType,
): IStaffPayment {
  const total =
    payType === EStaffPayType.ON_DEMAND ? row.totalAmount : null;
  return {
    id: row.id,
    paymentDate: dateOnly(row.paymentDate),
    totalAmount: total === null ? null : Number(total),
    amount: Number(row.amount),
    notes: row.notes ?? undefined,
  };
}

/** Anything not explicitly on-demand is a fixed salary. */
function payTypeOf(row: StaffEntity): EStaffPayType {
  return row.payType === EStaffPayType.ON_DEMAND
    ? EStaffPayType.ON_DEMAND
    : EStaffPayType.FIXED;
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Last calendar day of a `YYYY-MM` month, as `YYYY-MM-DD`. */
function monthEnd(month: string): string {
  const [year, index] = month.split("-").map(Number);
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, index, 0)).toISOString().slice(0, 10);
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
