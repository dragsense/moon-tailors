import type { z } from "zod";
import { listQuerySchema } from "./schema.js";

/** Request / query aliases from common schemas. */
export type TListQuery = z.infer<typeof listQuerySchema>;
