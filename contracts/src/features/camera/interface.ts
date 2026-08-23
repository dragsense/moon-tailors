import type { z } from "zod";
import {
  cameraSchema,
  paginatedCamerasSchema,
  streamResponseSchema,
} from "./schema.js";

export interface ICamera extends z.infer<typeof cameraSchema> {}
export interface IPaginatedCameras
  extends z.infer<typeof paginatedCamerasSchema> {}
export interface IStreamResponse extends z.infer<typeof streamResponseSchema> {}
