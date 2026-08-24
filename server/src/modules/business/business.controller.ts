import {
  Controller,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EUserLevel,
} from "@moon-tailors/contracts";
import {
  RequireUserLevels,
} from "../../common/auth";
import { BusinessService } from "./business.service";



@ApiTags("Businesses")
@Controller("businesses")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER
)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}
}
