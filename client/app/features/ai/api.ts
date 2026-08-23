import type {
  IAiCompletionResponse,
  IAiProcessor,
  IAiProcessorCurrent,
  IPaginatedResponse,
  TAiCompletionRequest,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

/** Catalog of configured AI providers. */
class AiProcessorsService extends BaseService<IAiProcessor> {
  constructor() {
    super("/ai-processors");
  }

  list(params: { page?: number; limit?: number } = { page: 1, limit: 100 }) {
    return this.get<IAiProcessor>(params) as Promise<
      IPaginatedResponse<IAiProcessor>
    >;
  }

  current() {
    return this.getSingle<IAiProcessorCurrent>(undefined, undefined, "/current");
  }
}

/** Runtime AI adapter (completions via business-resolved processor). */
class AiService extends BaseService<IAiCompletionResponse, TAiCompletionRequest> {
  constructor() {
    super("/ai");
  }

  current() {
    return this.getSingle<IAiProcessorCurrent>(undefined, undefined, "/current");
  }

  complete(body: TAiCompletionRequest) {
    return this.post<IAiCompletionResponse>(body, undefined, "/completions");
  }
}

export const aiProcessorsService = new AiProcessorsService();
export const aiService = new AiService();
