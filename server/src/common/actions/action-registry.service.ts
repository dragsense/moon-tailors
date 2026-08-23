import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { ActionHandler, ActionResult } from "./action.interface";

/**
 * Modules register named handlers that schedule jobs (and other callers) invoke.
 *
 * @example
 * // in TasksModule OnModuleInit:
 * this.actions.registerAction("tasks.send-reminder", {
 *   description: "Send task reminder",
 *   handler: (data) => this.tasks.sendReminder(data),
 * });
 */
@Injectable()
export class ActionRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ActionRegistryService.name);
  private readonly actions = new Map<string, ActionHandler>();

  onModuleInit() {
    this.logger.log("Action registry ready");
  }

  registerAction(actionName: string, handler: ActionHandler): void {
    this.actions.set(actionName, handler);
    this.logger.log(`Registered action: ${actionName}`);
  }

  unregisterAction(actionName: string): boolean {
    return this.actions.delete(actionName);
  }

  getAction(actionName: string): ActionHandler | undefined {
    return this.actions.get(actionName);
  }

  hasAction(actionName: string): boolean {
    return this.actions.has(actionName);
  }

  listActions(): string[] {
    return [...this.actions.keys()];
  }

  async executeAction(
    actionName: string,
    data?: Record<string, unknown>,
    entityId?: string,
    userId?: string,
  ): Promise<ActionResult> {
    const start = Date.now();
    const handler = this.actions.get(actionName);
    if (!handler) {
      return {
        success: false,
        error: `Action '${actionName}' not found`,
        executionTime: Date.now() - start,
      };
    }

    try {
      const run = handler.handler(data, entityId, userId);
      const result = handler.timeout
        ? await Promise.race([
            run,
            new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(new Error(`Action timeout after ${handler.timeout}ms`)),
                handler.timeout,
              ),
            ),
          ])
        : await run;

      return {
        success: true,
        data: result,
        executionTime: Date.now() - start,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Action ${actionName} failed: ${message}`);
      return {
        success: false,
        error: message,
        executionTime: Date.now() - start,
      };
    }
  }
}
