import { Injectable, OnModuleInit } from "@nestjs/common";
import type {
  ICustomer,
  IPaginatedResponse,
  TCreateCustomerData,
  TCustomerListQuery,
  TMeasurementValues,
  TUpdateCustomerData,
} from "@moon-tailors/contracts";
import {
  customerListQuerySchema,
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
  searchable: ["name", "phone", "whatsapp", "email", "id"],
  sortable: ["createdAt", "updatedAt", "name", "phone"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(customerListQuerySchema),
};

const RELATIONS = ["defaultMeasurement"] as const;

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

  async create(input: TCreateCustomerData): Promise<ICustomer> {
    const customer = await this.entity.create({
      name: input.name.trim(),
      phone: input.phone.trim(),
      whatsapp: emptyToNull(input.whatsapp),
      email: emptyToNull(input.email),
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
    });

    const defaultMeasurement = await this.measurements.createDefault(
      customer.id,
      input.defaultMeasurement,
    );
    await this.entity.update(customer.id, {
      defaultMeasurementId: defaultMeasurement.id,
    });

    return this.get(customer.id);
  }

  async list(
    query: TCustomerListQuery,
  ): Promise<IPaginatedResponse<ICustomer>> {
    const page = await this.entity.list(query, { _relations: [...RELATIONS] });
    return { ...page, data: page.data.map((row) => this.toPayload(row)) };
  }

  async get(key: EntityKey): Promise<ICustomer> {
    const row = await this.entity.require(key, { _relations: [...RELATIONS] });
    return this.toPayload(row);
  }

  async update(
    key: EntityKey,
    input: TUpdateCustomerData,
  ): Promise<ICustomer> {
    const patch: Partial<CustomerEntity> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.phone !== undefined) patch.phone = input.phone.trim();
    if (input.whatsapp !== undefined) patch.whatsapp = emptyToNull(input.whatsapp);
    if (input.email !== undefined) patch.email = emptyToNull(input.email);
    if (input.address !== undefined) patch.address = emptyToNull(input.address);
    if (input.notes !== undefined) patch.notes = emptyToNull(input.notes);
    await this.entity.update(key, patch);
    return this.get(key);
  }

  async updateDefaultMeasurements(
    customerId: string,
    input: TMeasurementValues,
  ): Promise<ICustomer> {
    const customer = await this.entity.require(customerId);
    if (!customer.defaultMeasurementId) {
      const created = await this.measurements.createDefault(customer.id);
      await this.entity.update(customer.id, {
        defaultMeasurementId: created.id,
      });
      await this.measurements.updateValues(created.id, input);
      return this.get(customer.id);
    }
    await this.measurements.updateValues(
      customer.defaultMeasurementId,
      input,
    );
    return this.get(customerId);
  }

  count(): Promise<number> {
    return this.entity
      .getRepository()
      .createQueryBuilder("customer")
      .where("customer.deletedAt IS NULL")
      .getCount();
  }

  private toPayload(row: CustomerEntity): ICustomer {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      whatsapp: row.whatsapp ?? undefined,
      email: row.email ?? undefined,
      address: row.address ?? undefined,
      notes: row.notes ?? undefined,
      defaultMeasurementId: row.defaultMeasurementId,
      defaultMeasurement: row.defaultMeasurement
        ? this.measurements.toPayload(row.defaultMeasurement)
        : null,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }
}

function emptyToNull(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
