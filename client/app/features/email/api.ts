import type {
  IEmailMessage,
  IEmailStatus,
  IEmailSyncResult,
  IEmailThread,
  IMessageResponse,
  IPaginatedResponse,
  TEmailMessageListQuery,
  TSendEmailData,
} from "@template/contracts";
import { apiRequest, buildApiUrl } from "~/lib/api";

/** Email inbox API — explicit paths (status/threads/messages/send/sync). */
class EmailService {
  private readonly base = "/email";

  status() {
    return apiRequest<IEmailStatus>(
      buildApiUrl(`${this.base}/status`),
      "GET",
    );
  }

  threads() {
    return apiRequest<IEmailThread[]>(
      buildApiUrl(`${this.base}/threads`),
      "GET",
    );
  }

  messages(query: Partial<TEmailMessageListQuery> = {}) {
    const { page = 1, limit = 50, ...rest } = query;
    return apiRequest<IPaginatedResponse<IEmailMessage>>(
      buildApiUrl(`${this.base}/messages`, {
        query: { page, limit, ...rest },
      }),
      "GET",
    );
  }

  send(body: TSendEmailData) {
    return apiRequest<IMessageResponse>(
      buildApiUrl(`${this.base}/send`),
      "POST",
      body,
    );
  }

  sync() {
    return apiRequest<IEmailSyncResult>(
      buildApiUrl(`${this.base}/sync`),
      "POST",
      {},
    );
  }

  markRead(id: string, isRead = true) {
    return apiRequest<IMessageResponse>(
      buildApiUrl(`${this.base}/messages/${id}/read`),
      "PATCH",
      { isRead },
    );
  }
}

export const emailService = new EmailService();
