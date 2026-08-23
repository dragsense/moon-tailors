import { registerAs } from "@nestjs/config";

export type MediamtxConfig = {
  host: string;
  apiPort: number;
  hlsPort: number;
  webrtcPort: number;
  publicHost: string;
  origin: string;
  apiBase: string;
  apiUser: string;
  apiPass: string;
  sourceOnDemandCloseAfter: string;
  hlsBaseUrl: string;
  webrtcBaseUrl: string;
  getHlsUrl(pathName: string): string;
  getWebrtcUrl(pathName: string): string;
};

/**
 * MediaMTX control + public playback URLs.
 * Browser uses Docker gateway paths `/hls` and `/webrtc` (same edge as /api /app).
 * Nest talks to MediaMTX Control API on the Docker network only.
 */
export default registerAs("mediamtx", (): MediamtxConfig => {
  const host = process.env.MEDIAMTX_HOST || "mediamtx";
  const apiPort = parseInt(process.env.MEDIAMTX_API_PORT ?? "9997", 10);
  const hlsPort = parseInt(process.env.MEDIAMTX_HLS_PORT ?? "8888", 10);
  const webrtcPort = parseInt(process.env.MEDIAMTX_WEBRTC_PORT ?? "8889", 10);
  const apiUser = process.env.MEDIAMTX_API_USER ?? "admin";
  const apiPass = process.env.MEDIAMTX_API_PASS ?? "admin123";
  const sourceOnDemandCloseAfter =
    process.env.MEDIAMTX_SOURCE_ON_DEMAND_CLOSE_AFTER ?? "30s";

  const publicHost = process.env.MEDIAMTX_PUBLIC_HOST ?? "localhost";
  const local =
    publicHost === "localhost" || publicHost === "127.0.0.1";
  const origin = local
    ? `http://${publicHost}:${process.env.GATEWAY_EXPOSE ?? "8088"}`
    : `https://${publicHost}`;

  const hlsBaseUrl = `${origin}/hls`;
  const webrtcBaseUrl = `${origin}/webrtc`;

  return {
    host,
    apiPort,
    hlsPort,
    webrtcPort,
    publicHost,
    origin,
    apiBase: `http://${host}:${apiPort}`,
    apiUser,
    apiPass,
    sourceOnDemandCloseAfter,
    hlsBaseUrl,
    webrtcBaseUrl,
    getHlsUrl(pathName: string): string {
      return `${hlsBaseUrl}/${pathName}/index.m3u8`;
    },
    getWebrtcUrl(pathName: string): string {
      return `${webrtcBaseUrl}/${pathName}/whep`;
    },
  };
});
