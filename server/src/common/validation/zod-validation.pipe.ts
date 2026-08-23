import {
  type ArgumentMetadata,
  BadRequestException,
  type PipeTransform,
} from "@nestjs/common";
import type { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Nest may pass `undefined` for empty @Query() — treat as {}.
    const input =
      value === undefined && metadata.type === "query" ? {} : value;
    const result = this.schema.safeParse(input);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
