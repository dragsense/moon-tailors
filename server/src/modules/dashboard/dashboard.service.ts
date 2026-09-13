import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  EResource,
  toIsoDate,
  type IDashboardSummary,
} from "@moon-tailors/contracts";
import { PermissionsService } from "../../common/base";
import { CustomersService } from "../customers/customers.service";
import { OrdersService } from "../orders/orders.service";
import { StaffService } from "../staff/staff.service";
import { VendorsService } from "../vendors/vendors.service";

@Injectable()
export class DashboardService implements OnModuleInit {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly customers: CustomersService,
    private readonly orders: OrdersService,
    private readonly staff: StaffService,
    private readonly vendors: VendorsService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.DASHBOARD);
  }

  async getSummary(): Promise<IDashboardSummary> {
    const [customerCount, orderCounts, staffCounts, vendorSummary] =
      await Promise.all([
        this.customers.count(),
        this.orders.counts(),
        this.staff.counts(),
        this.vendors.summary(),
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
          subLabel: "Total",
          subValue: orderCounts.totalAmount,
          subCurrency: "PKR",
        },
        {
          key: "active",
          label: "Active orders",
          value: orderCounts.active,
          hint: "Not yet delivered",
        },
        {
          key: "delivered",
          label: "Delivered orders",
          value: orderCounts.delivered,
          hint: "Handed to customers",
          subLabel: "Revenue",
          subValue: orderCounts.deliveredRevenue,
          subCurrency: "PKR",
          subTone: "success",
        },
        {
          key: "delayed",
          label: "Delayed orders",
          value: orderCounts.delayed,
          hint: "Past expected date",
        },
        {
          key: "staff",
          label: "Active staff",
          value: staffCounts.active,
          hint: `${staffCounts.fixed} fixed · ${staffCounts.onDemand} on demand`,
        },
        {
          key: "vendors",
          label: "Vendors",
          value: vendorSummary.count,
          hint: "Suppliers in the book",
        },
        {
          key: "vendorPaid",
          label: "Paid to vendors",
          value: vendorSummary.paid,
          hint: "All vendor payments",
          currency: "PKR",
          tone: "success",
        },
        {
          key: "vendorPayable",
          label: "Owed to vendors",
          value: vendorSummary.remaining,
          hint: "Purchases minus payments",
          currency: "PKR",
          tone: vendorSummary.remaining > 0 ? "danger" : "default",
        },
      ],
      activity,
      generatedAt: toIsoDate(),
    };
  }
}
