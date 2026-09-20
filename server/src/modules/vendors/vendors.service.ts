import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import type {
  IMessageResponse,
  IPaginatedResponse,
  IVendor,
  IVendorPayment,
  IVendorPurchase,
  IVendorSlip,
  IVendorTotals,
  TCreateVendorData,
  TCreateVendorPaymentData,
  TCreateVendorPurchaseData,
  TUpdateVendorData,
  TVendorListQuery,
  TVendorSlipQuery,
} from "@moon-tailors/contracts";
import {
  EResource,
  filtersFromListSchema,
  vendorListQuerySchema,
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
import { VendorPaymentEntity } from "./entities/vendor-payment.entity";
import { VendorPurchaseItemEntity } from "./entities/vendor-purchase-item.entity";
import { VendorPurchaseEntity } from "./entities/vendor-purchase.entity";
import { VendorEntity } from "./entities/vendor.entity";

export const VENDOR_QUERY: EntityQueryConfig = {
  alias: "vendor",
  searchable: ["name", "phone", "company"],
  sortable: ["createdAt", "updatedAt", "name"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(vendorListQuerySchema),
};

const EMPTY_TOTALS: IVendorTotals = { total: 0, paid: 0, remaining: 0 };

@Injectable()
export class VendorsService implements OnModuleInit {
  private readonly entity: IBoundEntityService<VendorEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(VendorEntity, VENDOR_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.VENDORS);
    ActivityLogRegistry.register({
      module: "vendors",
      endpoints: ["/api/vendors"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "vendors",
      events: { endpoint: "/api/vendors" },
    });
  }

  async create(input: TCreateVendorData): Promise<IMessageResponse> {
    const phone = input.phone.trim();
    await this.assertPhoneAvailable(phone);
    await this.entity.create({
      name: input.name.trim(),
      phone,
      company: emptyToNull(input.company),
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
    });
    return { message: "Vendor created successfully" };
  }

  async list(query: TVendorListQuery): Promise<IPaginatedResponse<IVendor>> {
    const page = await this.entity.list(query);
    const totals = await this.totalsFor(page.data.map((row) => row.id));
    return {
      ...page,
      data: page.data.map((row) =>
        this.toPayload(row, totals.get(row.id) ?? EMPTY_TOTALS),
      ),
    };
  }

  /** Detail includes purchases (with line items), payments and totals. */
  async get(key: EntityKey): Promise<IVendor> {
    const row = await this.entity.require(key);
    const manager = this.entity.getManager();

    const purchaseRows = await manager
      .getRepository(VendorPurchaseEntity)
      .createQueryBuilder("purchase")
      .leftJoinAndSelect("purchase.items", "item", "item.deletedAt IS NULL")
      .where("purchase.vendorId = :vendorId", { vendorId: row.id })
      .andWhere("purchase.deletedAt IS NULL")
      .orderBy("purchase.purchaseDate", "DESC")
      .addOrderBy("purchase.createdAt", "DESC")
      .addOrderBy("item.createdAt", "ASC")
      .getMany();

    const paymentRows = await manager
      .getRepository(VendorPaymentEntity)
      .createQueryBuilder("payment")
      .where("payment.vendorId = :vendorId", { vendorId: row.id })
      .andWhere("payment.deletedAt IS NULL")
      .orderBy("payment.paymentDate", "DESC")
      .addOrderBy("payment.createdAt", "DESC")
      .getMany();

    const purchases = purchaseRows.map(toPurchasePayload);
    const payments = paymentRows.map(toPaymentPayload);
    const total = money(purchases.reduce((sum, p) => sum + p.total, 0));
    const paid = money(payments.reduce((sum, p) => sum + p.amount, 0));

    return {
      ...this.toPayload(row, { total, paid, remaining: money(total - paid) }),
      purchases,
      payments,
    };
  }

  async update(
    key: EntityKey,
    input: TUpdateVendorData,
  ): Promise<IMessageResponse> {
    const existing = await this.entity.require(key);
    const patch: Partial<VendorEntity> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.phone !== undefined) {
      const phone = input.phone.trim();
      await this.assertPhoneAvailable(phone, existing.id);
      patch.phone = phone;
    }
    if (input.company !== undefined) patch.company = emptyToNull(input.company);
    if (input.address !== undefined) patch.address = emptyToNull(input.address);
    if (input.notes !== undefined) patch.notes = emptyToNull(input.notes);
    if (Object.keys(patch).length > 0) {
      await this.entity.update(key, patch);
    }
    return { message: "Vendor updated successfully" };
  }

  /** Purchase + its line items in one transaction. */
  async addPurchase(
    key: EntityKey,
    input: TCreateVendorPurchaseData,
  ): Promise<IMessageResponse> {
    const vendor = await this.entity.require(key);
    const tenantId = RequestContext.get("tenantId") ?? null;

    await this.entity.getManager().transaction(async (manager) => {
      const purchaseRepo = manager.getRepository(VendorPurchaseEntity);
      const purchase = await manager.save(
        purchaseRepo.create({
          vendorId: vendor.id,
          tenantId,
          purchaseDate: input.purchaseDate,
          notes: emptyToNull(input.notes),
        }),
      );
      const itemRepo = manager.getRepository(VendorPurchaseItemEntity);
      await manager.save(
        input.items.map((item) =>
          itemRepo.create({
            purchaseId: purchase.id,
            tenantId,
            description: item.description.trim(),
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          }),
        ),
      );
    });

    return { message: "Purchase added successfully" };
  }

  /** Payment against the vendor’s overall balance — cannot exceed remaining. */
  async addPayment(
    key: EntityKey,
    input: TCreateVendorPaymentData,
  ): Promise<IMessageResponse> {
    const vendor = await this.entity.require(key);
    const totals =
      (await this.totalsFor([vendor.id])).get(vendor.id) ?? EMPTY_TOTALS;
    if (input.amount > totals.remaining + 0.001) {
      throw new BadRequestException(
        `Payment cannot be more than the remaining amount (${totals.remaining})`,
      );
    }

    const manager = this.entity.getManager();
    const repo = manager.getRepository(VendorPaymentEntity);
    await manager.save(
      repo.create({
        vendorId: vendor.id,
        tenantId: RequestContext.get("tenantId") ?? null,
        paymentDate: input.paymentDate,
        amount: String(input.amount),
        notes: emptyToNull(input.notes),
      }),
    );
    return { message: "Payment added successfully" };
  }

  /**
   * One month with the vendor: purchases made, payments sent, and what is
   * left of that month alone. The running balance across all time is on the
   * vendor record, not here.
   */
  async slip(key: EntityKey, query: TVendorSlipQuery): Promise<IVendorSlip> {
    const vendor = await this.entity.require(key);
    const { month } = query;
    const start = `${month}-01`;
    const end = monthEnd(month);
    const manager = this.entity.getManager();

    const purchaseRow = await manager
      .getRepository(VendorPurchaseItemEntity)
      .createQueryBuilder("item")
      .innerJoin("item.purchase", "purchase")
      .select("COALESCE(SUM(item.quantity * item.unitPrice), 0)", "amount")
      .where("purchase.vendorId = :vendorId", { vendorId: vendor.id })
      .andWhere("item.deletedAt IS NULL")
      .andWhere("purchase.deletedAt IS NULL")
      .andWhere("purchase.purchaseDate BETWEEN :start AND :end", { start, end })
      .getRawOne<{ amount: string }>();

    const paymentRow = await manager
      .getRepository(VendorPaymentEntity)
      .createQueryBuilder("payment")
      .select("COALESCE(SUM(payment.amount), 0)", "amount")
      .where("payment.vendorId = :vendorId", { vendorId: vendor.id })
      .andWhere("payment.deletedAt IS NULL")
      .andWhere("payment.paymentDate BETWEEN :start AND :end", { start, end })
      .getRawOne<{ amount: string }>();

    const total = money(Number(purchaseRow?.amount ?? 0));
    const paid = money(Number(paymentRow?.amount ?? 0));

    return {
      month,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        phone: vendor.phone,
        company: vendor.company ?? undefined,
      },
      total,
      paid,
      remaining: money(total - paid),
    };
  }

  /** Vendor count, total paid and total still owed across all vendors, for the dashboard. */
  async summary(): Promise<{ count: number; paid: number; remaining: number }> {
    const count = await this.entity
      .getRepository()
      .createQueryBuilder("vendor")
      .where("vendor.deletedAt IS NULL")
      .getCount();
    const totals = await this.totalsFor();
    let paid = 0;
    let remaining = 0;
    for (const value of totals.values()) {
      paid += value.paid;
      remaining += value.remaining;
    }
    return { count, paid: money(paid), remaining: money(remaining) };
  }

  /** total / paid / remaining per vendor, calculated with SQL sums. */
  private async totalsFor(
    vendorIds?: string[],
  ): Promise<Map<string, IVendorTotals>> {
    const result = new Map<string, IVendorTotals>();
    if (vendorIds && vendorIds.length === 0) return result;
    const manager = this.entity.getManager();

    const purchaseQb = manager
      .getRepository(VendorPurchaseItemEntity)
      .createQueryBuilder("item")
      .innerJoin("item.purchase", "purchase")
      .innerJoin("purchase.vendor", "vendor")
      .select("purchase.vendorId", "vendorId")
      .addSelect("COALESCE(SUM(item.quantity * item.unitPrice), 0)", "amount")
      .where("item.deletedAt IS NULL")
      .andWhere("purchase.deletedAt IS NULL")
      .andWhere("vendor.deletedAt IS NULL")
      .groupBy("purchase.vendorId");

    const paymentQb = manager
      .getRepository(VendorPaymentEntity)
      .createQueryBuilder("payment")
      .innerJoin("payment.vendor", "vendor")
      .select("payment.vendorId", "vendorId")
      .addSelect("COALESCE(SUM(payment.amount), 0)", "amount")
      .where("payment.deletedAt IS NULL")
      .andWhere("vendor.deletedAt IS NULL")
      .groupBy("payment.vendorId");

    if (vendorIds) {
      purchaseQb.andWhere("purchase.vendorId IN (:...vendorIds)", { vendorIds });
      paymentQb.andWhere("payment.vendorId IN (:...vendorIds)", { vendorIds });
    }

    type SumRow = { vendorId: string; amount: string };
    const [purchaseSums, paymentSums] = await Promise.all([
      purchaseQb.getRawMany<SumRow>(),
      paymentQb.getRawMany<SumRow>(),
    ]);

    const entry = (vendorId: string) => {
      let value = result.get(vendorId);
      if (!value) {
        value = { ...EMPTY_TOTALS };
        result.set(vendorId, value);
      }
      return value;
    };
    for (const row of purchaseSums) entry(row.vendorId).total = money(Number(row.amount));
    for (const row of paymentSums) entry(row.vendorId).paid = money(Number(row.amount));
    for (const value of result.values()) {
      value.remaining = money(value.total - value.paid);
    }
    return result;
  }

  private async assertPhoneAvailable(phone: string, excludeId?: string) {
    const qb = this.entity
      .getRepository()
      .createQueryBuilder("vendor")
      .where("vendor.deletedAt IS NULL")
      .andWhere("vendor.phone = :phone", { phone });
    if (excludeId) {
      qb.andWhere("vendor.id != :excludeId", { excludeId });
    }
    const taken = await qb.getOne();
    if (taken) {
      throw new ConflictException("A vendor with this phone already exists");
    }
  }

  private toPayload(row: VendorEntity, totals: IVendorTotals): IVendor {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      company: row.company ?? undefined,
      address: row.address ?? undefined,
      notes: row.notes ?? undefined,
      totals,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }
}

function toPurchasePayload(row: VendorPurchaseEntity): IVendorPurchase {
  const items = (row.items ?? []).map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    return {
      id: item.id,
      description: item.description,
      quantity,
      unitPrice,
      total: money(quantity * unitPrice),
    };
  });
  return {
    id: row.id,
    purchaseDate: dateOnly(row.purchaseDate),
    notes: row.notes ?? undefined,
    items,
    total: money(items.reduce((sum, item) => sum + item.total, 0)),
  };
}

function toPaymentPayload(row: VendorPaymentEntity): IVendorPayment {
  return {
    id: row.id,
    paymentDate: dateOnly(row.paymentDate),
    amount: Number(row.amount),
    notes: row.notes ?? undefined,
  };
}

/** Last calendar day of a `YYYY-MM` month, as `YYYY-MM-DD`. */
function monthEnd(month: string): string {
  const [year, index] = month.split("-").map(Number);
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, index, 0)).toISOString().slice(0, 10);
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
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
