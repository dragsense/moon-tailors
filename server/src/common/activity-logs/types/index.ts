import type {
  EActivityStatus,
  EActivityType,
} from "@moon-tailors/contracts";

/** Input for ActivityLogsService.createActivityLog. */
export type CreateActivityLogInput = {
  description: string;
  type: EActivityType;
  status: EActivityStatus;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  module?: string;
};

/** Module opt-in rule for which HTTP paths write activity logs. */
export type ActivityLogEndpointRule = {
  /** Feature module name (e.g. "tasks", "users"). */
  module: string;
  /** URL path prefixes to match (e.g. "/api/tasks"). */
  endpoints: string[];
  /** HTTP methods; defaults to mutating methods. */
  methods?: string[];
};
