import {
  emailMessageListQuerySchema,
  filtersFromListSchema,
} from "@template/contracts";
import type { EntityQueryConfig } from "../../common/query";

export const EMAIL_MESSAGE_QUERY: EntityQueryConfig = {
  alias: "email",
  searchable: ["subject", "text", "html", "contactEmail", "fromEmail"],
  sortable: ["createdAt", "updatedAt", "subject"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(emailMessageListQuerySchema),
};
