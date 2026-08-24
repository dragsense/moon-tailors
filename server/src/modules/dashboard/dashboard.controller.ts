import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  type IDashboardSummary,
} from "@moon-tailors/contracts";
import { RequirePermissions } from "../../common/auth";
import { DashboardService } from "./dashboard.service";

@ApiBearerAuth("access-token")
@ApiTags("Dashboard")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @RequirePermissions({
    resource: EResource.DASHBOARD,
    action: EPermissionAction.READ,
  })
  summary(): Promise<IDashboardSummary> {
    return this.dashboardService.getSummary();
  }
}
