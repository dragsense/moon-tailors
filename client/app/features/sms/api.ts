import type {
  IMessageResponse,
  IPaginatedResponse,
  ISmsMessage,
  ISmsStatus,
  ISmsThread,
  TSendSmsData,
  TSmsMessageListQuery,
} from "@template/contracts";
import { apiRequest, buildApiUrl } from "~/lib/api";

/** SMS inbox API — explicit paths (status/threads/messages/send). */
class SmsService {
  private readonly base = "/sms";

  status() {
    return apiRequest<ISmsStatus>(buildApiUrl(`${this.base}/status`), "GET");
  }

  threads() {
    return apiRequest<ISmsThread[]>(
      buildApiUrl(`${this.base}/threads`),
      "GET",
    );
  }

  messages(query: Partial<TSmsMessageListQuery> = {}) {
    const { page = 1, limit = 50, ...rest } = query;
    return apiRequest<IPaginatedResponse<ISmsMessage>>(
      buildApiUrl(`${this.base}/messages`, {
        query: { page, limit, ...rest },
      }),
      "GET",
    );
  }

  send(body: TSendSmsData) {
    return apiRequest<IMessageResponse>(
      buildApiUrl(`${this.base}/send`),
      "POST",
      body,
    );
  }
}

export const smsService = new SmsService();
