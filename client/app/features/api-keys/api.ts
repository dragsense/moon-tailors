import type {
  ICreateApiKeyResponse,
  IPaginatedResponse,
  TCreateApiKeyData,
  TRevokeApiKeyResponse,
  IApiKey,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

class ApiKeysService extends BaseService<
  ICreateApiKeyResponse,
  TCreateApiKeyData
> {
  constructor() {
    super("/api-keys");
  }

  list(params: { page?: number; limit?: number } = { page: 1, limit: 100 }) {
    return this.get<IApiKey>(params) as Promise<IPaginatedResponse<IApiKey>>;
  }

  create(body: TCreateApiKeyData) {
    return this.post<ICreateApiKeyResponse>(body);
  }

  revoke(id: string) {
    return this.delete<TRevokeApiKeyResponse>(id);
  }
}

export const apiKeysService = new ApiKeysService();
