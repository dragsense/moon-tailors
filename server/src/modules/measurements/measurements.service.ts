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
import type { EntityManager } from "typeorm";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { PermissionsService } from "../../common/base";
import { RequestContext } from "../../common/context";
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

const LOOKUP: EntityQueryConfig = {
  alias: "row",
  searchable: [],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

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
    this.customers = this.entityService.bind(CustomerEntity, LOOKUP);
    this.orders = this.entityService.bind(OrderEntity, LOOKUP);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.MEASUREMENTS);
    ActivityLogRegistry.register({
      module: "measurements",
      endpoints: ["/api/measurements"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    });
  }

  /** GET /measurements/:id */
  async getOne(id: string): Promise<IMeasurement> {
    return this.toPayload(await this.entity.require(id));
  }

  /**
   * PATCH /measurements/customers/:customerId
   * Updates the customer’s usual measurement (creates + links if missing).
   */
  async upsertDefault(
    customerId: string,
    input?: TMeasurementValues | TUpdateMeasurementData,
  ): Promise<IMeasurement> {
    const customer = await this.customers.require(customerId);
    const values = stripForceEdit(input);

    let measurementId = customer.measurementId;
    if (!measurementId) {
      const created = await this.entity.create({
        customerId,
        orderId: null,
        ...this.columnPatch(values),
      });
      measurementId = created.id;
      await this.customers.update(customerId, { measurementId });
      return this.toPayload(created);
    }

    if (hasMeasurementValues(values)) {
      return this.toPayload(await this.applyValues(measurementId, values));
    }
    return this.toPayload(await this.entity.require(measurementId));
  }

  /** PATCH /measurements/:id — order snapshot or usual (delivered lock). */
  async update(
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

    return this.toPayload(await this.applyValues(id, values));
  }

  /**
   * Always create usual measurement in the same TX as the customer.
   * Caller sets `customer.measurementId` after this returns.
   */
  async createForCustomer(
    customerId: string,
    values: TMeasurementValues | undefined,
    manager: EntityManager,
  ): Promise<MeasurementEntity> {
    const repo = manager.getRepository(MeasurementEntity);
    const row = repo.create({
      customerId,
      orderId: null,
      tenantId: RequestContext.get("tenantId") ?? null,
      ...this.columnPatch(values ?? {}),
    });
    return manager.save(row);
  }

  /** Copy customer usual → new order measurement (separate row). */
  async createOrderSnapshot(
    customerId: string,
    values?: TMeasurementValues,
  ): Promise<MeasurementEntity> {
    const customer = await this.customers.require(customerId);
    const source = customer.measurementId
      ? await this.entity.require(customer.measurementId)
      : null;

    const created = await this.entity.create({
      customerId,
      orderId: null,
      ...(source ? this.columnPatch(this.pickValues(source)) : {}),
    });

    if (hasMeasurementValues(values)) {
      return this.applyValues(created.id, values);
    }
    return this.entity.require(created.id);
  }

  attachToOrder(id: string, orderId: string): Promise<MeasurementEntity> {
    return this.entity.update(id, { orderId });
  }

  get(id: string): Promise<MeasurementEntity> {
    return this.entity.require(id);
  }

  pickValues(
    input: TMeasurementValues | MeasurementEntity | IMeasurement,
  ): TMeasurementValues {
    const values: TMeasurementValues = {};
    for (const key of MEASUREMENT_VALUE_KEYS) {
      if (key === "extraNotes") {
        values.extraNotes =
          emptyToNull((input as { extraNotes?: string | null }).extraNotes) ??
          undefined;
        continue;
      }
      values[key] = num((input as Record<string, unknown>)[key]);
    }
    return values;
  }

  toPayload(row: MeasurementEntity): IMeasurement {
    return {
      ...this.pickValues(row),
      id: row.id,
      customerId: row.customerId,
      orderId: row.orderId,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }

  private async applyValues(id: string, input: TMeasurementValues) {
    await this.entity.update(id, this.columnPatch(input, true));
    return this.entity.require(id);
  }

  private columnPatch(
    input: TMeasurementValues,
    onlyDefined = false,
  ): Partial<MeasurementEntity> {
    const values = this.pickValues(input);
    const patch: Partial<MeasurementEntity> = {};
    for (const key of MEASUREMENT_VALUE_KEYS) {
      if (onlyDefined && input[key] === undefined) continue;
      if (key === "extraNotes") {
        patch.extraNotes = emptyToNull(values.extraNotes);
      } else {
        (patch as Record<string, unknown>)[key] = dec(
          values[key] as number | null | undefined,
        );
      }
    }
    return patch;
  }
}

function stripForceEdit(
  input?: TMeasurementValues | TUpdateMeasurementData,
): TMeasurementValues {
  if (!input) return {};
  const { forceEdit: _f, ...values } = input as TUpdateMeasurementData;
  return values;
}

function emptyToNull(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
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
