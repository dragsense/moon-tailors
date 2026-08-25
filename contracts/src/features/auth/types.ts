import type { z } from "zod";
import { loginSchema } from "./schema.js";

/** Request payload aliases (forms / API body). */
export type TLoginData = z.infer<typeof loginSchema>;
