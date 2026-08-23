export type ActionHandler = {
  handler: (
    data?: Record<string, unknown>,
    entityId?: string,
    userId?: string,
  ) => Promise<unknown>;
  description?: string;
  retryable?: boolean;
  timeout?: number;
};

export type ActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime?: number;
};
