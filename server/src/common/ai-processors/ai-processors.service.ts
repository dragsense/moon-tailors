import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EAiProcessorType,
  type IPaginatedResponse,
  type TAiProcessorListQuery,
} from "@template/contracts";
import type { AiProcessorsConfig } from "../../config";
import { BaseBusinessService } from "../base/business";
import { RequestContext } from "../context";
import {
  EntityService,
  type IBoundEntityService,
} from "../database";
import type { EntityQueryConfig } from "../query";
import { AiProcessorEntity } from "./entities/ai-processor.entity";

const LABELS: Record<EAiProcessorType, string> = {
  [EAiProcessorType.OPENAI]: "OpenAI",
  [EAiProcessorType.ANTHROPIC]: "Anthropic",
  [EAiProcessorType.GEMINI]: "Gemini",
  [EAiProcessorType.OTHER]: "Other",
};

export const AI_PROCESSOR_QUERY: EntityQueryConfig = {
  alias: "processor",
  searchable: ["name", "type"],
  sortable: ["name", "type", "createdAt", "updatedAt"],
  defaultSort: { field: "name", order: "ASC" },
};

@Injectable()
export class AiProcessorsService implements OnModuleInit {
  private readonly entity: IBoundEntityService<AiProcessorEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly config: ConfigService,
    private readonly businesses: BaseBusinessService,
  ) {
    this.entity = this.entityService.bind(
      AiProcessorEntity,
      AI_PROCESSOR_QUERY,
    );
  }

  async onModuleInit() {
    for (const type of Object.values(EAiProcessorType)) {
      const existing = await this.entity.get({ type }, { access: [] });
      if (!existing) {
        await this.entity.create({
          type,
          name: LABELS[type],
          enabled: type === this.defaultType(),
          description: `${LABELS[type]} AI processor`,
        });
      }
    }
  }

  defaultType(): EAiProcessorType {
    return this.config.getOrThrow<AiProcessorsConfig>("aiProcessors").defaultType;
  }

  list(
    query: TAiProcessorListQuery,
  ): Promise<IPaginatedResponse<AiProcessorEntity>> {
    return this.entity.list(query, { access: [] });
  }

  getById(id: string): Promise<AiProcessorEntity> {
    return this.entity.require(id, { access: [] });
  }

  getByType(type: EAiProcessorType): Promise<AiProcessorEntity> {
    return this.entity.require({ type }, { access: [] });
  }

  /**
   * Resolve AI processor for the current request:
   * - Platform / default business → always `DEFAULT_AI_PROCESSOR` (env)
   * - Other businesses → DB FK when set (editable from frontend), else env default
   * API keys always stay in env for the chosen type.
   */
  async resolveForCurrentBusiness(): Promise<{
    processor: AiProcessorEntity;
    source: "business" | "env_default";
    config: { model?: string; hasApiKey: boolean };
  }> {
    const cfg = this.config.getOrThrow<AiProcessorsConfig>("aiProcessors");

    const useEnvDefault = async () => {
      const type = this.defaultType();
      const row = await this.getByType(type);
      return {
        processor: row,
        source: "env_default" as const,
        config: this.configFor(type, cfg),
      };
    };

    if (RequestContext.get("isPlatformBusiness")) {
      return useEnvDefault();
    }

    const businessId = RequestContext.get("businessId");
    if (businessId) {
      const business = await this.businesses.findById(businessId);
      if (business?.isPlatform) {
        return useEnvDefault();
      }
      if (business?.aiProcessorId) {
        const row = await this.getById(business.aiProcessorId);
        return {
          processor: row,
          source: "business",
          config: this.configFor(row.type, cfg),
        };
      }
    }

    return useEnvDefault();
  }

  private configFor(
    type: EAiProcessorType,
    cfg: AiProcessorsConfig,
  ): { model?: string; hasApiKey: boolean } {
    if (type === EAiProcessorType.OPENAI) {
      return { model: cfg.openai.model, hasApiKey: Boolean(cfg.openai.apiKey) };
    }
    if (type === EAiProcessorType.ANTHROPIC) {
      return {
        model: cfg.anthropic.model,
        hasApiKey: Boolean(cfg.anthropic.apiKey),
      };
    }
    if (type === EAiProcessorType.GEMINI) {
      return { model: cfg.gemini.model, hasApiKey: Boolean(cfg.gemini.apiKey) };
    }
    return { hasApiKey: false };
  }
}
