import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import type {
  ICustomer,
  IPaginatedResponse,
  TCopyCustomerMeasurementData,
  TCreateCustomerData,
  TCustomerListQuery,
  TMeasurementValues,
  TUpdateCustomerData,
} from "@moon-tailors/contracts";
import {
  customerListQuerySchema,
  EGender,
  EResource,
  filtersFromListSchema,
  garmentAudienceForGender,
} from "@moon-tailors/contracts";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import { DomainEventRegistry } from "../../common/events";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { GarmentTypesService } from "../garment-types/garment-types.service";
import { MeasurementsService } from "../measurements/measurements.service";
import { CustomerEntity } from "./entities/customer.entity";

export const CUSTOMER_QUERY: EntityQueryConfig = {
  alias: "customer",
  searchable: ["name", "phone", "whatsapp", "email", "id"],
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
    private readonly garmentTypes: GarmentTypesService,
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
      gender: input.gender,
      phone: input.phone.trim(),
      whatsapp: emptyToNull(input.whatsapp),
      email: uniqueCustomerEmail(),
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
    });

    for (const row of input.measurements ?? []) {
      await this.assertTypeForCustomer(customer.gender, row.garmentTypeId);
      await this.measurements.upsertDefault(
        customer.id,
        row.garmentTypeId,
        row,
      );
    }

    return this.get(customer.id);
  }

  async list(
    query: TCustomerListQuery,
  ): Promise<IPaginatedResponse<ICustomer>> {
    const page = await this.entity.list(query);
    return { ...page, data: page.data.map((row) => this.toPayload(row, [])) };
  }

  async get(key: EntityKey): Promise<ICustomer> {
    const row = await this.entity.require(key);
    const defaults = await this.measurements.listDefaults(row.id);
    return this.toPayload(row, defaults);
  }

  async update(
    key: EntityKey,
    input: TUpdateCustomerData,
  ): Promise<ICustomer> {
    const patch: Partial<CustomerEntity> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.gender !== undefined) patch.gender = input.gender;
    if (input.phone !== undefined) patch.phone = input.phone.trim();
    if (input.whatsapp !== undefined) patch.whatsapp = emptyToNull(input.whatsapp);
    if (input.address !== undefined) patch.address = emptyToNull(input.address);
    if (input.notes !== undefined) patch.notes = emptyToNull(input.notes);
    if (Object.keys(patch).length > 0) {
      await this.entity.update(key, patch);
    }
    return this.get(key);
  }

  async upsertMeasurement(
    customerId: string,
    garmentTypeId: string,
    input: TMeasurementValues,
  ): Promise<ICustomer> {
    const customer = await this.entity.require(customerId);
    await this.assertTypeForCustomer(customer.gender, garmentTypeId);
    await this.measurements.upsertDefault(customer.id, garmentTypeId, input);
    return this.get(customer.id);
  }

  async copyMeasurement(
    customerId: string,
    input: TCopyCustomerMeasurementData,
  ): Promise<ICustomer> {
    const customer = await this.entity.require(customerId);
    await this.assertTypeForCustomer(customer.gender, input.toGarmentTypeId);
    await this.measurements.copyDefault(
      customer.id,
      input.fromGarmentTypeId,
      input.toGarmentTypeId,
    );
    return this.get(customer.id);
  }

  count(): Promise<number> {
    return this.entity
      .getRepository()
      .createQueryBuilder("customer")
      .where("customer.deletedAt IS NULL")
      .getCount();
  }

  private async assertTypeForCustomer(
    gender: EGender | null,
    garmentTypeId: string,
  ) {
    const type = await this.garmentTypes.require(garmentTypeId);
    const expected = garmentAudienceForGender(gender);
    if (expected && type.audience !== expected) {
      throw new BadRequestException(
        "That garment does not match this customer’s gents/ladies type",
      );
    }
  }

  private toPayload(
    row: CustomerEntity,
    defaults: Awaited<ReturnType<MeasurementsService["listDefaults"]>>,
  ): ICustomer {
    return {
      id: row.id,
      name: row.name,
      gender: row.gender === EGender.FEMALE ? EGender.FEMALE : EGender.MALE,
      phone: row.phone,
      whatsapp: row.whatsapp ?? undefined,
      email: row.email ?? undefined,
      address: row.address ?? undefined,
      notes: row.notes ?? undefined,
      measurements: defaults.map((item) => this.measurements.toPayload(item)),
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
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
