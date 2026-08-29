import { randomUUID } from "node:crypto";
import {
  ConflictException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import type {
  ICustomer,
  IMessageResponse,
  IPaginatedResponse,
  TCreateCustomerData,
  TCustomerListQuery,
  TGetQuery,
  TUpdateCustomerData,
} from "@moon-tailors/contracts";
import {
  customerListQuerySchema,
  EGender,
  EResource,
  filtersFromListSchema,
} from "@moon-tailors/contracts";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import { DomainEventRegistry } from "../../common/events";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { MeasurementsService } from "../measurements/measurements.service";
import { CustomerEntity } from "./entities/customer.entity";

export const CUSTOMER_QUERY: EntityQueryConfig = {
  alias: "customer",
  searchable: ["name", "phone", "alternative", "email"],
  sortable: ["createdAt", "updatedAt", "name", "phone"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(customerListQuerySchema),
};

@Injectable()
export class CustomersService implements OnModuleInit {
  private readonly entity: IBoundEntityService<CustomerEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
    private readonly measurements: MeasurementsService,
  ) {
    this.entity = this.entityService.bind(CustomerEntity, CUSTOMER_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.CUSTOMERS);
    ActivityLogRegistry.register({
      module: "customers",
      endpoints: ["/api/customers"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "customers",
      events: { endpoint: "/api/customers" },
    });
  }

  async create(input: TCreateCustomerData): Promise<IMessageResponse> {
    const phone = input.phone.trim();
    await this.assertPhoneAvailable(phone);

    await this.entity.create(
      {
        name: input.name.trim(),
        gender: input.gender,
        phone,
        alternative: emptyToNull(input.alternative),
        email: uniqueCustomerEmail(),
        address: emptyToNull(input.address),
        notes: emptyToNull(input.notes),
        measurementId: null,
      },
      {
        afterCreate: async (customer, manager) => {
          const measurement = await this.measurements.createForCustomer(
            customer.id,
            input.measurement,
            manager,
          );
          customer.measurementId = measurement.id;
          await manager.save(customer);
        },
      },
    );

    return { message: "Customer created successfully" };
  }

  async list(
    query: TCustomerListQuery,
  ): Promise<IPaginatedResponse<ICustomer>> {
    const page = await this.entity.list(query);
    return { ...page, data: page.data.map((row) => this.toPayload(row)) };
  }

  async get(key: EntityKey, query: TGetQuery = {}): Promise<ICustomer> {
    const row = await this.entity.require(key, {
      _relations: query._relations,
      _select: query._select,
    });
    return this.toPayload(row);
  }

  async update(
    key: EntityKey,
    input: TUpdateCustomerData,
  ): Promise<IMessageResponse> {
    const existing = await this.entity.require(key);
    const patch: Partial<CustomerEntity> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.gender !== undefined) patch.gender = input.gender;
    if (input.phone !== undefined) {
      const phone = input.phone.trim();
      await this.assertPhoneAvailable(phone, existing.id);
      patch.phone = phone;
    }
    if (input.alternative !== undefined) {
      patch.alternative = emptyToNull(input.alternative);
    }
    if (input.address !== undefined) patch.address = emptyToNull(input.address);
    if (input.notes !== undefined) patch.notes = emptyToNull(input.notes);
    if (Object.keys(patch).length > 0) {
      await this.entity.update(key, patch);
    }
    return { message: "Customer updated successfully" };
  }

  count(): Promise<number> {
    return this.entity
      .getRepository()
      .createQueryBuilder("customer")
      .where("customer.deletedAt IS NULL")
      .getCount();
  }

  private async assertPhoneAvailable(phone: string, excludeId?: string) {
    const qb = this.entity
      .getRepository()
      .createQueryBuilder("customer")
      .where("customer.deletedAt IS NULL")
      .andWhere("customer.phone = :phone", { phone });
    if (excludeId) {
      qb.andWhere("customer.id != :excludeId", { excludeId });
    }
    const taken = await qb.getOne();
    if (taken) {
      throw new ConflictException("A customer with this phone already exists");
    }
  }

  private toPayload(row: CustomerEntity): ICustomer {
    return {
      id: row.id,
      name: row.name,
      gender: row.gender === EGender.FEMALE ? EGender.FEMALE : EGender.MALE,
      phone: row.phone,
      alternative: row.alternative ?? undefined,
      email: row.email ?? undefined,
      address: row.address ?? undefined,
      notes: row.notes ?? undefined,
      measurement: row.measurement
        ? this.measurements.toPayload(row.measurement)
        : null,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }
}

function uniqueCustomerEmail() {
  return `c-${randomUUID()}@customers.internal`;
}

function emptyToNull(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
}

function toIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
