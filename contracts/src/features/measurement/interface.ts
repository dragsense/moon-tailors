import type { z } from "zod";
import { measurementSchema } from "./schema.js";

export interface IMeasurement extends z.infer<typeof measurementSchema> {}
