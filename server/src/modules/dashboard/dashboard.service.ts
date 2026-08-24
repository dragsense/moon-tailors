import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  EResource,
  toIsoDate,
  type IDashboardSummary,
} from "@moon-tailors/contracts";
import { PermissionsService } from "../../common/base";
import { CustomersService } from "../customers/customers.service";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class DashboardService implements OnModuleInit {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly customers: CustomersService,
    private readonly orders: OrdersService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.DASHBOARD);
  }

  async getSummary(): Promise<IDashboardSummary> {
    const [customerCount, orderCounts] = await Promise.all([
      this.customers.count(),
      this.orders.counts(),
    ]);
    const activity =
      orderCounts.delayed > 0
        ? [
            {
              id: "delayed",
              title: `${orderCounts.delayed} delayed order${orderCounts.delayed === 1 ? "" : "s"}`,
              detail: "Expected completion date has passed and the order is not delivered.",
              at: toIsoDate(),
            },
          ]
        : [
            {
              id: "ok",
              title: "No delayed orders",
              detail: "Active orders are on schedule.",
              at: toIsoDate(),
            },
          ];

    return {
      stats: [
        {
          key: "customers",
          label: "Customers",
          value: customerCount,
          hint: "In the book",
        },
        {
          key: "orders",
          label: "Orders",
          value: orderCounts.total,
          hint: "All time",
        },
        {
          key: "active",
          label: "Active orders",
          value: orderCounts.active,
          hint: "Not yet delivered",
        },
        {
          key: "delayed",
          label: "Delayed",
          value: orderCounts.delayed,
          hint: "Past expected date",
        },
      ],
      activity,
      generatedAt: toIsoDate(),
    };
  }
}
