import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { ECameraProtocol } from "./enum.js";

const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

const protocolOptions = [
  { label: "RTSP", value: ECameraProtocol.RTSP },
  { label: "RTMP", value: ECameraProtocol.RTMP },
  { label: "SRT", value: ECameraProtocol.SRT },
  { label: "HLS", value: ECameraProtocol.HLS },
  { label: "HTTP MPEG-TS", value: ECameraProtocol.HTTP_MPEGTS },
  { label: "HTTP MJPEG", value: ECameraProtocol.HTTP_MJPEG },
];

export const createCameraSchema = z.object({
  name: field(z.string().min(1).max(255), {
    type: "text",
    label: "Name",
    order: 1,
  }),
  description: field(z.string().max(2000).optional(), {
    type: "textarea",
    label: "Description",
    order: 2,
  }),
  protocol: field(z.nativeEnum(ECameraProtocol), {
    type: "select",
    label: "Protocol",
    order: 3,
    options: protocolOptions,
  }),
  username: field(z.string().max(255).optional(), {
    type: "text",
    label: "Username",
    order: 4,
  }),
  password: field(z.string().max(255).optional(), {
    type: "password",
    label: "Password",
    order: 5,
  }),
  ipAddress: field(
    z.string().regex(ipv4Regex, "Invalid IP address format"),
    {
      type: "text",
      label: "IP address",
      placeholder: "192.168.1.100",
      order: 6,
    },
  ),
  port: field(
    z.preprocess(
      (v) => {
        if (v === "" || v === null || v === undefined) return undefined;
        const n = typeof v === "number" ? v : Number(v);
        return Number.isNaN(n) ? v : n;
      },
      z.number().int().min(1).max(65535).optional(),
    ),
    {
      type: "number",
      label: "Port",
      placeholder: "554",
      order: 7,
    },
  ),
  path: field(z.string().max(500).optional(), {
    type: "text",
    label: "Stream path",
    placeholder: "/stream",
    order: 8,
  }),
  isActive: field(z.boolean().optional(), {
    type: "switch",
    label: "Active",
    order: 9,
  }),
});

export const updateCameraSchema = createCameraSchema.partial();

export const updateCameraStatusSchema = z.object({
  isActive: z.boolean(),
});

export const cameraSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  protocol: z.nativeEnum(ECameraProtocol),
  username: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  port: z.number().int().nullable().optional(),
  path: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const cameraListQuerySchema = listQuerySchema.extend({
  isActive: field(
    z.preprocess((v) => {
      if (v === "" || v === null || v === undefined || v === "__any__") {
        return undefined;
      }
      if (v === true || v === "true" || v === "1") return true;
      if (v === false || v === "false" || v === "0") return false;
      return v;
    }, z.boolean().optional()),
    {
      type: "select",
      label: "Status",
      placeholder: "Any",
      order: 2,
      filter: "bool",
      options: [
        { label: "Any", value: "__any__" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  ),
});

/** GET /streams/:cameraId — MediaMTX playback URLs (browser → HLS/WHEP). */
export const streamResponseSchema = z.object({
  cameraId: z.string().uuid(),
  hlsUrl: z.string().url(),
  webrtcUrl: z.string().url(),
});

export const paginatedCamerasSchema = createPaginatedSchema(cameraSchema);
