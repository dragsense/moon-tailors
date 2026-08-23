import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EAiProcessorType,
  EResource,
  type IAiCompletionResponse,
  type TAiCompletionRequest,
} from "@template/contracts";
import type { AiProcessorsConfig } from "../../config";
import { PermissionsService } from "../../common/base";
import {
  AiProcessorsService,
  type AiProcessorEntity,
} from "../../common/ai-processors";

type CompletionResult = { text: string; model: string };

/**
 * Single AI adapter facade.
 * Same public API always — under the hood switches on processor type
 * (env DEFAULT_AI_PROCESSOR for platform, DB FK for other businesses).
 */
@Injectable()
export class AiAdapterService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly processors: AiProcessorsService,
    private readonly permissions: PermissionsService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.AI);
  }

  getCurrent(): Promise<{
    processor: AiProcessorEntity;
    source: "business" | "env_default";
    config: { model?: string; hasApiKey: boolean };
  }> {
    return this.processors.resolveForCurrentBusiness();
  }

  async complete(
    input: TAiCompletionRequest,
  ): Promise<IAiCompletionResponse> {
    const resolved = await this.processors.resolveForCurrentBusiness();
    const type = resolved.processor.type;

    if (!resolved.config.hasApiKey) {
      throw new ServiceUnavailableException(
        `No API key configured in env for AI processor "${type}"`,
      );
    }

    const result = await this.run(type, input);
    return {
      text: result.text,
      model: result.model,
      processorType: type,
    };
  }

  private run(
    type: EAiProcessorType,
    input: TAiCompletionRequest,
  ): Promise<CompletionResult> {
    switch (type) {
      case EAiProcessorType.OPENAI:
        return this.completeOpenAi(input);
      case EAiProcessorType.ANTHROPIC:
        return this.completeAnthropic(input);
      case EAiProcessorType.GEMINI:
        return this.completeGemini(input);
      default:
        throw new BadRequestException(
          `AI processor "${type}" has no implementation`,
        );
    }
  }

  private async completeOpenAi(
    input: TAiCompletionRequest,
  ): Promise<CompletionResult> {
    const cfg = this.config.getOrThrow<AiProcessorsConfig>("aiProcessors");
    const apiKey = cfg.openai.apiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is not configured");
    }
    const model = input.model || cfg.openai.model;
    const messages: Array<{ role: string; content: string }> = [];
    if (input.system) messages.push({ role: "system", content: input.system });
    messages.push({ role: "user", content: input.prompt });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.4 }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(
        `OpenAI error ${res.status}: ${body.slice(0, 300)}`,
      );
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };
    return {
      text: data.choices?.[0]?.message?.content?.trim() ?? "",
      model: data.model ?? model,
    };
  }

  private async completeAnthropic(
    input: TAiCompletionRequest,
  ): Promise<CompletionResult> {
    const cfg = this.config.getOrThrow<AiProcessorsConfig>("aiProcessors");
    const apiKey = cfg.anthropic.apiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "ANTHROPIC_API_KEY is not configured",
      );
    }
    const model = input.model || cfg.anthropic.model;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: input.system,
        messages: [{ role: "user", content: input.prompt }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(
        `Anthropic error ${res.status}: ${body.slice(0, 300)}`,
      );
    }
    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      model?: string;
    };
    const text =
      data.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("")
        .trim() ?? "";
    return { text, model: data.model ?? model };
  }

  private async completeGemini(
    input: TAiCompletionRequest,
  ): Promise<CompletionResult> {
    const cfg = this.config.getOrThrow<AiProcessorsConfig>("aiProcessors");
    const apiKey = cfg.gemini.apiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException("GEMINI_API_KEY is not configured");
    }
    const model = input.model || cfg.gemini.model;
    const prompt = input.system
      ? `${input.system}\n\n${input.prompt}`
      : input.prompt;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(
        `Gemini error ${res.status}: ${body.slice(0, 300)}`,
      );
    }
    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";
    return { text, model };
  }
}
