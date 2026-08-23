import { Module } from "@nestjs/common";
import { PlatformTools } from "./tools/platform.tools";
import { PlatformResources } from "./resources/platform.resources";
import { PlatformPrompts } from "./prompts/platform.prompts";

@Module({
  providers: [PlatformTools, PlatformResources, PlatformPrompts],
  exports: [PlatformTools, PlatformResources, PlatformPrompts],
})
export class PlatformModule {}
