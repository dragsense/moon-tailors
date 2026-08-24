import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import type {
  IOrder,
  IPaginatedResponse,
  TCreateOrderData,
  TMeasurementValues,
  TOrderListQuery,
  TUpdateOrderData,
} from "@moon-tailors/contracts";
import {
  EOrderStatus,
  EResource,
  filtersFromListSchema,
  orderListQuerySchema,
} from "@moon-tailors/contracts";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import { DomainEventRegistry } from "../../common/events";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { CustomersService } from "../customers/customers.service";
import { MeasurementsService } from "../measurements/measurements.service";
import { OrderEntity } from "./entities/order.entity";

export const ORDER_QUERY: EntityQueryConfig = {
  alias: "order",
  searchable: ["orderNumber", "notes", "customer.name", "customer.phone"],
  sortable: [
    "createdAt",
    "updatedAt",
    "orderDate",
    "expectedCompletionDate",
    "status",
    "totalCost",
  ],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(orderListQuerySchema),
};

const RELATIONS = ["customer", "measurement"] as const;

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly entity: IBoundEntityService<OrderEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
    private readonly customers: CustomersService,
    private readonly measurements: MeasurementsService,
  ) {
    this.entity = this.entityService.bind(OrderEntity, ORDER_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.ORDERS);
    ActivityLogRegistry.register({
      module: "orders",
      endpoints: ["/api/orders"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "orders",
      events: { endpoint: "/api/orders" },
    });
  }

  async create(input: TCreateOrderData): Promise<IOrder> {
    const customer = await this.customers.get(input.customerId);
    if (!customer.defaultMeasurementId) {
      throw new BadRequestException("Customer has no default measurements");
    }
    const source = await this.measurements.get(customer.defaultMeasurementId);
    const snapshot = await this.measurements.copyForOrder(
      source,
      customer.id,
      null,
    );

    const order = await this.entity.create({
      orderNumber: nextOrderNumber(),
      customerId: customer.id,
      measurementId: snapshot.id,
      orderDate: input.orderDate,
      expectedCompletionDate: input.expectedCompletionDate,
      status: input.status ?? EOrderStatus.NEW,
      totalCost: String(input.totalCost ?? 0),
      paidAmount: String(input.paidAmount ?? 0),
      notes: emptyToNull(input.notes),
    });

    await this.measurements.attachToOrder(snapshot.id, order.id);
    return this.get(order.id);
  }

  async list(query: TOrderListQuery): Promise<IPaginatedResponse<IOrder>> {
    const page = await this.entity.list(query, { _relations: [...RELATIONS] });
    return { ...page, data: page.data.map((row) => this.toPayload(row)) };
  }

  async get(key: EntityKey): Promise<IOrder> {
    const row = await this.entity.require(key, { _relations: [...RELATIONS] });
    return this.toPayload(row);
  }

  async update(key: EntityKey, input: TUpdateOrderData): Promise<IOrder> {
    const existing = await this.entity.require(key);
    this.assertWritable(existing, input.forceEdit);

    const patch: Partial<OrderEntity> = {};
    if (input.orderDate !== undefined) patch.orderDate = input.orderDate;
    if (input.expectedCompletionDate !== undefined) {
      patch.expectedCompletionDate = input.expectedCompletionDate;
    }
    if (input.status !== undefined) patch.status = input.status;
    if (input.totalCost !== undefined) patch.totalCost = String(input.totalCost);
    if (input.paidAmount !== undefined) patch.paidAmount = String(input.paidAmount);
    if (input.notes !== undefined) patch.notes = emptyToNull(input.notes);

    await this.entity.update(key, patch);
    return this.get(key);
  }

  async updateMeasurements(
    orderId: string,
    input: TMeasurementValues,
    forceEdit?: boolean,
  ): Promise<IOrder> {
    const order = await this.entity.require(orderId);
    this.assertWritable(order, forceEdit);
    await this.measurements.updateValues(order.measurementId, input);
    return this.get(orderId);
  }

  async applyMeasurementsToDefault(orderId: string): Promise<IOrder> {
    const order = await this.get(orderId);
    if (!order.measurement) {
      throw new BadRequestException("Order has no measurements");
    }
    await this.customers.updateDefaultMeasurements(
      order.customerId,
      this.measurements.pickValues(order.measurement),
    );
    return this.get(orderId);
  }

  async counts() {
    const repo = this.entity.getRepository();
    const base = repo
      .createQueryBuilder("order")
      .where("order.deletedAt IS NULL");
    const today = new Date().toISOString().slice(0, 10);
    const [total, active, delayed] = await Promise.all([
      base.clone().getCount(),
      base
        .clone()
        .andWhere("order.status != :delivered", {
          delivered: EOrderStatus.DELIVERED,
        })
        .getCount(),
      base
        .clone()
        .andWhere("order.status != :delivered", {
          delivered: EOrderStatus.DELIVERED,
        })
        .andWhere("order.expectedCompletionDate < :today", { today })
        .getCount(),
    ]);
    return { total, active, delayed };
  }

  private assertWritable(order: OrderEntity, forceEdit?: boolean) {
    if (order.status === EOrderStatus.DELIVERED && !forceEdit) {
      throw new ForbiddenException(
        "Delivered orders are locked. Use force edit to change historical data.",
      );
    }
  }

  private toPayload(row: OrderEntity): IOrder {
    const totalCost = Number(row.totalCost ?? 0);
    const paidAmount = Number(row.paidAmount ?? 0);
    return {
      id: row.id,
      customerId: row.customerId,
      orderNumber: row.orderNumber,
      measurementId: row.measurementId,
      orderDate: dateOnly(row.orderDate),
      expectedCompletionDate: dateOnly(row.expectedCompletionDate),
      status: row.status,
      totalCost,
      paidAmount,
      notes: row.notes ?? undefined,
      customer: row.customer
        ? {
            id: row.customer.id,
            name: row.customer.name,
            phone: row.customer.phone,
            whatsapp: row.customer.whatsapp ?? undefined,
          }
        : undefined,
      measurement: row.measurement
        ? this.measurements.toPayload(row.measurement)
        : null,
      remainingAmount: Math.max(0, totalCost - paidAmount),
      isDelayed: isDelayed(row),
      isLocked: row.status === EOrderStatus.DELIVERED,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }
}

function nextOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MT-${stamp}-${rand}`;
}

function isDelayed(order: OrderEntity) {
  if (order.status === EOrderStatus.DELIVERED) return false;
  const due = dateOnly(order.expectedCompletionDate);
  const today = new Date().toISOString().slice(0, 10);
  return due < today;
}

function dateOnly(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return new Date(value).toISOString().slice(0, 10);
}

function emptyToNull(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
