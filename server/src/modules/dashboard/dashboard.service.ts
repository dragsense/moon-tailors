import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  EResource,
  toIsoDate,
  type IDashboardSummary,
} from "@template/contracts";
import { PermissionsService } from "../../common/base";

/**
 * Example dashboard — sample numbers only.
 * Replace `getSummary()` with real aggregates when you wire feature modules.
 */
@Injectable()
export class DashboardService implements OnModuleInit {
  constructor(private readonly permissions: PermissionsService) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.DASHBOARD);
  }

  getSummary(): IDashboardSummary {
    const now = Date.now();
    return {
      stats: [
        {
          key: "tasks",
          label: "Open tasks",
          value: 12,
          hint: "Example count",
        },
        {
          key: "users",
          label: "Active users",
          value: 8,
          hint: "Example count",
        },
        {
          key: "files",
          label: "Files",
          value: 34,
          hint: "Example count",
        },
        {
          key: "cameras",
          label: "Live cameras",
          value: 3,
          hint: "Example count",
        },
      ],
      activity: [
        {
          id: "1",
          title: "Welcome to the dashboard",
          detail: "This feed is sample data for the template example.",
          at: toIsoDate(new Date(now - 5 * 60_000)),
        },
        {
          id: "2",
          title: "Task created",
          detail: "“Review onboarding checklist”",
          at: toIsoDate(new Date(now - 45 * 60_000)),
        },
        {
          id: "3",
          title: "File uploaded",
          detail: "brand-guidelines.pdf",
          at: toIsoDate(new Date(now - 3 * 3600_000)),
        },
      ],
      generatedAt: toIsoDate(),
    };
  }
}
