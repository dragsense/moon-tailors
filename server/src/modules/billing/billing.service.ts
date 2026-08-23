import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  EBillingStatus,
  EResource,
  billingListQuerySchema,
  filtersFromListSchema,
  type IMessageResponse,
  type IPaginatedResponse,
  type TBillingListQuery,
  type TCreateBilling,
  type TUpdateBilling,
} from "@template/contracts";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { BillingEntity } from "./entities/billing.entity";

export const BILLING_QUERY: EntityQueryConfig = {
  alias: "billing",
  searchable: ["title", "description", "notes"],
  sortable: ["createdAt", "dueDate", "amountCents", "status"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(billingListQuerySchema),
};

function computeBillingAmountCents(
  lineItems: TCreateBilling["lineItems"],
  taxRate: number,
): number {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100),
    0,
  );
  return Math.round(subtotal * (1 + (taxRate || 0) / 100));
}

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly entity: IBoundEntityService<BillingEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(BillingEntity, BILLING_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.BILLINGS);
  }

  async create(input: TCreateBilling): Promise<IMessageResponse> {
    await this.entity.create({
      title: input.title,
      type: input.type,
      description: input.description ?? null,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lineItems: input.lineItems,
      taxRate: input.taxRate ?? 0,
      amountCents: computeBillingAmountCents(
        input.lineItems,
        Number(input.taxRate) || 0,
      ),
      recipientUserId: input.recipientUserId,
      notes: input.notes ?? null,
      status: EBillingStatus.PENDING,
      paidAmountCents: 0,
      paymentIntentId: null,
    });
    return { message: "Billing created" };
  }

  async update(
    key: EntityKey,
    input: TUpdateBilling,
  ): Promise<IMessageResponse> {
    const row = await this.entity.require(key);
    const patch: Partial<BillingEntity> = {};

    if (input.title !== undefined) patch.title = input.title;
    if (input.type !== undefined) patch.type = input.type;
    if (input.description !== undefined) {
      patch.description = input.description ?? null;
    }
    if (input.issueDate !== undefined) patch.issueDate = input.issueDate;
    if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
    if (input.lineItems !== undefined) patch.lineItems = input.lineItems;
    if (input.taxRate !== undefined) patch.taxRate = input.taxRate;
    if (input.recipientUserId !== undefined) {
      patch.recipientUserId = input.recipientUserId;
    }
    if (input.notes !== undefined) patch.notes = input.notes ?? null;

    if (input.lineItems || input.taxRate !== undefined) {
      patch.amountCents = computeBillingAmountCents(
        patch.lineItems ?? row.lineItems,
        Number(patch.taxRate ?? row.taxRate) || 0,
      );
    }

    await this.entity.update(key, patch);
    return { message: "Billing updated" };
  }

  list(query: TBillingListQuery): Promise<IPaginatedResponse<BillingEntity>> {
    return this.entity.list(query);
  }

  get(key: EntityKey): Promise<BillingEntity> {
    return this.entity.require(key);
  }

  async remove(key: EntityKey): Promise<IMessageResponse> {
    await this.entity.softDelete(key);
    return { message: "Billing deleted" };
  }

  async markPaid(
    key: EntityKey,
    paidAmountCents: number,
    paymentIntentId?: string,
  ): Promise<BillingEntity> {
    const row = await this.entity.require(key);
    return this.entity.update(key, {
      paidAmountCents,
      paymentIntentId: paymentIntentId ?? row.paymentIntentId,
      status:
        paidAmountCents >= row.amountCents
          ? EBillingStatus.PAID
          : paidAmountCents > 0
            ? EBillingStatus.PARTIALLY_PAID
            : row.status,
    });
  }

  async markFailed(
    key: EntityKey,
    paymentIntentId?: string,
  ): Promise<BillingEntity> {
    const patch: Partial<BillingEntity> = {
      status: EBillingStatus.FAILED,
    };
    if (paymentIntentId !== undefined) patch.paymentIntentId = paymentIntentId;
    return this.entity.update(key, patch);
  }
}
