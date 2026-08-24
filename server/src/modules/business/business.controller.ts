import {
  Controller,
  Get,
  Param,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
 
  EPermissionAction,
  EResource,
  EUserLevel,
} from "@moon-tailors/contracts";
import {
  RequirePermissions,
  RequireUserLevels,
} from "../../common/auth";
import type { BusinessEntity } from "../../common/base";
import { BusinessService } from "./business.service";



@ApiTags("Businesses")
@Controller("businesses")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER
)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}


  @Get(":id")
  @RequirePermissions({
    resource: EResource.BUSINESSES,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<BusinessEntity> {
    return this.businesses.get(id);
  }


}
