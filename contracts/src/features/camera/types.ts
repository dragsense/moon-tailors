import type { z } from "zod";
import {
  cameraListQuerySchema,
  cameraSchema,
  createCameraSchema,
  paginatedCamerasSchema,
  streamResponseSchema,
  updateCameraSchema,
  updateCameraStatusSchema,
} from "./schema.js";

export type TCreateCamera = z.infer<typeof createCameraSchema>;
export type TUpdateCamera = z.infer<typeof updateCameraSchema>;
export type TUpdateCameraStatus = z.infer<typeof updateCameraStatusSchema>;
export type TCamera = z.infer<typeof cameraSchema>;
export type TCameraListQuery = z.infer<typeof cameraListQuerySchema>;
export type TPaginatedCameras = z.infer<typeof paginatedCamerasSchema>;
export type TStreamResponse = z.infer<typeof streamResponseSchema>;
