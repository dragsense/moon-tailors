import type { z } from "zod";
import { getQuerySchema, listQuerySchema } from "./schema.js";

/** Request / query aliases from common schemas. */
export type TListQuery = z.infer<typeof listQuerySchema>;
export type TGetQuery = z.infer<typeof getQuerySchema>;
