import { ForbiddenException, Injectable, OnModuleInit } from "@nestjs/common";
import type {
  IMeasurement,
  TMeasurementValues,
  TUpdateMeasurementData,
} from "@moon-tailors/contracts";
import {
  EOrderStatus,
  EResource,
  hasMeasurementValues,
  MEASUREMENT_VALUE_KEYS,
} from "@moon-tailors/contracts";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityQueryConfig } from "../../common/query";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "../orders/entities/order.entity";
import { MeasurementEntity } from "./entities/measurement.entity";

export const MEASUREMENT_QUERY: EntityQueryConfig = {
  alias: "measurement",
  searchable: [],
  sortable: ["createdAt", "updatedAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

const CUSTOMER_LOOKUP_QUERY: EntityQueryConfig = {
  alias: "customer",
  searchable: [],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

const ORDER_LOOKUP_QUERY: EntityQueryConfig = {
  alias: "order",
  searchable: [],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

function emptyToNull(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
}

@Injectable()
export class MeasurementsService implements OnModuleInit {
  private readonly entity: IBoundEntityService<MeasurementEntity>;
  private readonly customers: IBoundEntityService<CustomerEntity>;
  private readonly orders: IBoundEntityService<OrderEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(
      MeasurementEntity,
      MEASUREMENT_QUERY,
    );
    this.customers = this.entityService.bind(
      CustomerEntity,
      CUSTOMER_LOOKUP_QUERY,
    );
    this.orders = this.entityService.bind(OrderEntity, ORDER_LOOKUP_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.MEASUREMENTS);
    ActivityLogRegistry.register({
      module: "measurements",
      endpoints: ["/api/measurements"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    });
  }

  pickValues(
    input: TMeasurementValues | MeasurementEntity,
  ): TMeasurementValues {
    const values: TMeasurementValues = {};
    for (const key of MEASUREMENT_VALUE_KEYS) {
      if (key === "extraNotes") {
        values.extraNotes =
          emptyToNull(
            (input as { extraNotes?: string | null }).extraNotes,
          ) ?? undefined;
        continue;
      }
      values[key] = num((input as Record<string, unknown>)[key]);
    }
    return values;
  }

  toPayload(row: MeasurementEntity): IMeasurement {
    const values = this.pickValues(row);
    return {
      ...values,
      id: row.id,
      customerId: row.customerId,
      orderId: row.orderId,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }

  /** Customer’s single usual measurement (`orderId` null). */
  findDefault(customerId: string): Promise<MeasurementEntity | null> {
    return this.entity
      .getRepository()
      .createQueryBuilder("measurement")
      .where("measurement.customerId = :customerId", { customerId })
      .andWhere("measurement.orderId IS NULL")
      .andWhere("measurement.deletedAt IS NULL")
      .orderBy("measurement.updatedAt", "DESC")
      .getOne();
  }

  /** Keep at most one default row per customer (soft-delete extras). */
  private async collapseExtraDefaults(
    customerId: string,
    keepId: string,
  ): Promise<void> {
    const extras = await this.entity
      .getRepository()
      .createQueryBuilder("measurement")
      .where("measurement.customerId = :customerId", { customerId })
      .andWhere("measurement.orderId IS NULL")
      .andWhere("measurement.deletedAt IS NULL")
      .andWhere("measurement.id != :keepId", { keepId })
      .getMany();
    for (const row of extras) {
      await this.entity.softDelete(row.id);
    }
  }

  async upsertDefault(
    customerId: string,
    values?: TMeasurementValues,
  ): Promise<MeasurementEntity> {
    const existing = await this.findDefault(customerId);
    if (existing) {
      await this.collapseExtraDefaults(customerId, existing.id);
      if (hasMeasurementValues(values)) {
        return this.updateValues(existing.id, values);
      }
      return this.entity.require(existing.id);
    }
    const created = await this.entity.create({
      customerId,
      orderId: null,
    });
    if (hasMeasurementValues(values)) {
      return this.updateValues(created.id, values);
    }
    return this.entity.require(created.id);
  }

  /** HTTP: upsert usual measurements for a customer (no row yet or by customer). */
  async upsertCustomerDefault(
    customerId: string,
    input: TUpdateMeasurementData,
  ): Promise<IMeasurement> {
    await this.customers.require(customerId);
    const { forceEdit: _force, ...values } = input;
    const row = await this.upsertDefault(customerId, values);
    return this.toPayload(row);
  }

  /** HTTP: get one measurement by id. */
  async getById(id: string): Promise<IMeasurement> {
    const row = await this.entity.require(id);
    return this.toPayload(row);
  }

  /**
   * HTTP: update any measurement row by id (customer default or order snapshot).
   * Order-linked rows respect delivered lock unless `forceEdit`.
   */
  async updateById(
    id: string,
    input: TUpdateMeasurementData,
  ): Promise<IMeasurement> {
    const { forceEdit, ...values } = input;
    const row = await this.entity.require(id);
    if (row.orderId) {
      const order = await this.orders.require(row.orderId);
      if (order.status === EOrderStatus.DELIVERED && !forceEdit) {
        throw new ForbiddenException(
          "Delivered orders are locked. Use force edit to change historical data.",
        );
      }
    }
    const updated = await this.updateValues(id, values);
    return this.toPayload(updated);
  }

  async createOrderSnapshot(
    customerId: string,
    values?: TMeasurementValues,
  ): Promise<MeasurementEntity> {
    const source = await this.findDefault(customerId);
    const created = await this.entity.create({
      customerId,
      orderId: null,
      ...(source ? this.toColumnValues(this.pickValues(source)) : {}),
    });
    if (hasMeasurementValues(values)) {
      return this.updateValues(created.id, values);
    }
    return this.entity.require(created.id);
  }

  async updateValues(
    id: string,
    input: TMeasurementValues,
  ): Promise<MeasurementEntity> {
    const values = this.pickValues(input);
    const patch: Partial<MeasurementEntity> = {};
    for (const key of MEASUREMENT_VALUE_KEYS) {
      if (input[key] !== undefined) {
        if (key === "extraNotes") {
          patch.extraNotes = emptyToNull(values.extraNotes);
        } else {
          (patch as Record<string, unknown>)[key] = dec(
            values[key] as number | null | undefined,
          );
        }
      }
    }
    await this.entity.update(id, patch);
    return this.entity.require(id);
  }

  get(id: string): Promise<MeasurementEntity> {
    return this.entity.require(id);
  }

  attachToOrder(id: string, orderId: string): Promise<MeasurementEntity> {
    return this.entity.update(id, { orderId });
  }

  private toColumnValues(
    values: TMeasurementValues,
  ): Partial<MeasurementEntity> {
    const patch: Partial<MeasurementEntity> = {};
    for (const key of MEASUREMENT_VALUE_KEYS) {
      if (key === "extraNotes") {
        patch.extraNotes = emptyToNull(values.extraNotes);
        continue;
      }
      (patch as Record<string, unknown>)[key] = dec(values[key]);
    }
    return patch;
  }
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dec(value: number | null | undefined): string | null {
  return value == null ? null : String(value);
}

function toIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
