import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ECameraProtocol, type IStreamResponse } from "@template/contracts";
import type { MediamtxConfig } from "../../../config/mediamtx.config";
import { CamerasService } from "../cameras.service";
import type { CameraEntity } from "../entities/camera.entity";
import { MediaMtxApiService } from "./services/mediamtx-api.service";

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);

  constructor(
    @Inject(forwardRef(() => CamerasService))
    private readonly camerasService: CamerasService,
    private readonly configService: ConfigService,
    private readonly mediamtxApi: MediaMtxApiService,
  ) {}

  /**
   * Ensure MediaMTX path exists (on-demand RTSP source) and return HLS/WHEP URLs.
   */
  async getStream(cameraId: string): Promise<IStreamResponse> {
    const cam = await this.camerasService.getCameraForStreaming(cameraId);
    if (!cam) throw new NotFoundException("Camera not found");
    if (!cam.isActive) {
      throw new NotFoundException("Camera stream is not active");
    }

    const sourceUrl = this.buildSourceStreamUrl(cam);
    if (!sourceUrl) {
      throw new NotFoundException("Camera stream URL not configured");
    }

    const cfg = this.configService.get<MediamtxConfig>("mediamtx");
    if (!cfg) throw new NotFoundException("MediaMTX config not found");

    const pathName = cameraId;
    await this.mediamtxApi.ensurePath(pathName, sourceUrl);

    return {
      cameraId,
      hlsUrl: cfg.getHlsUrl(pathName),
      webrtcUrl: cfg.getWebrtcUrl(pathName),
    };
  }

  /** Drop MediaMTX path (deactivate/delete). Best-effort. */
  async removeCameraPath(cameraId: string): Promise<void> {
    try {
      await this.mediamtxApi.removePath(cameraId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to remove MediaMTX path for camera ${cameraId}: ${msg}`,
      );
    }
  }

  buildSourceStreamUrl(camera: CameraEntity): string {
    const baseUrl = this.generateStreamUrl(
      camera.protocol,
      camera.ipAddress ?? undefined,
      camera.port ?? undefined,
      camera.path ?? undefined,
    );
    if (!baseUrl) return "";
    return this.applyCredentials(baseUrl, camera.username, camera.password);
  }

  private generateStreamUrl(
    protocol: ECameraProtocol,
    ipAddress?: string,
    port?: number,
    path?: string,
  ): string {
    if (!ipAddress) return "";

    const portStr = port ? `:${port}` : "";
    const pathStr = path || "/";
    const normalizedPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;

    switch (protocol) {
      case ECameraProtocol.RTSP:
        return `rtsp://${ipAddress}${portStr}${normalizedPath}`;
      case ECameraProtocol.RTMP:
        return `rtmp://${ipAddress}${portStr}${normalizedPath}`;
      case ECameraProtocol.SRT:
        return `srt://${ipAddress}${portStr}${normalizedPath}`;
      case ECameraProtocol.HTTP_MJPEG:
      case ECameraProtocol.HTTP_MPEGTS:
      case ECameraProtocol.HLS:
        return `http://${ipAddress}${portStr}${normalizedPath}`;
      default:
        return "";
    }
  }

  private applyCredentials(
    streamUrl: string,
    username?: string | null,
    password?: string | null,
  ): string {
    const user = username?.trim();
    const pass = password?.trim();
    if (!user && !pass) return streamUrl;

    try {
      const url = new URL(streamUrl);
      if (user) url.username = user;
      if (pass) url.password = pass;
      return url.toString();
    } catch {
      return streamUrl;
    }
  }
}
