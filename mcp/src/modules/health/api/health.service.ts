import { Injectable } from "@nestjs/common";
import { ApiClient, BaseApiService } from "../../../common/api";

@Injectable()
export class HealthApiService extends BaseApiService {
  constructor(api: ApiClient) {
    super(api, "/health");
  }

  check() {
    return this.get<{ status: string; service: string }>();
  }
}
