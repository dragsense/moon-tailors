import { Controller, Get, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  type IStreamResponse,
} from "@template/contracts";
import { RequirePermissions } from "../../../common/auth";
import { StreamsService } from "./streams.service";

@ApiBearerAuth("access-token")
@ApiTags("Streams")
@Controller("streams")
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get(":cameraId")
  @RequirePermissions({
    resource: EResource.VIDEO_STREAM,
    action: EPermissionAction.READ,
  })
  @ApiOperation({ summary: "Get HLS + WebRTC (WHEP) URLs for a camera" })
  getStream(@Param("cameraId") cameraId: string): Promise<IStreamResponse> {
    return this.streamsService.getStream(cameraId);
  }
}
