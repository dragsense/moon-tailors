import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MediamtxConfig } from "../../../../config/mediamtx.config";

interface MediaMtxPathRuntime {
  name: string;
  ready: boolean;
  readers?: unknown[];
}

interface MediaMtxPathConfigList {
  items?: Array<{ name: string }>;
}

@Injectable()
export class MediaMtxApiService {
  private readonly logger = new Logger(MediaMtxApiService.name);
  private readonly apiBase: string;
  private readonly apiUser: string;
  private readonly apiPass: string;
  private readonly sourceOnDemandCloseAfter: string;

  constructor(config: ConfigService) {
    const cfg = config.get<MediamtxConfig>("mediamtx");
    this.apiBase = cfg?.apiBase ?? "http://mediamtx:9997";
    this.apiUser = cfg?.apiUser ?? "admin";
    this.apiPass = cfg?.apiPass ?? "admin123";
    this.sourceOnDemandCloseAfter = cfg?.sourceOnDemandCloseAfter ?? "30s";
    this.logger.log(`MediaMTX API base: ${this.apiBase}`);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: object,
    opts?: { allowNotFound?: boolean },
  ): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiUser && this.apiPass) {
      headers.Authorization = `Basic ${Buffer.from(
        `${this.apiUser}:${this.apiPass}`,
      ).toString("base64")}`;
    }
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`MediaMTX API unreachable: ${url} - ${msg}`);
      throw new Error(
        `MediaMTX unreachable at ${url}. Check MEDIAMTX_HOST (use "mediamtx" in Docker) and that MediaMTX is running. ${msg}`,
      );
    }
    if (!res.ok) {
      if (opts?.allowNotFound && res.status === 404) {
        return undefined as T;
      }
      const text = await res.text();
      this.logger.warn(`MediaMTX API ${method} ${path} ${res.status}: ${text}`);
      throw new Error(`MediaMTX API ${res.status}: ${text}`);
    }
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }

  async ensurePath(pathName: string, rtspSourceUrl: string): Promise<void> {
    const safeName = encodeURIComponent(pathName);
    const body = {
      source: rtspSourceUrl,
      sourceOnDemand: true,
      sourceOnDemandCloseAfter: this.sourceOnDemandCloseAfter,
    };
    try {
      await this.request("POST", `/v3/config/paths/add/${safeName}`, body);
      this.logger.debug(`MediaMTX path added: ${pathName}`);
    } catch {
      await this.request("PATCH", `/v3/config/paths/patch/${safeName}`, body);
      this.logger.debug(`MediaMTX path patched: ${pathName}`);
    }
  }

  async removePath(pathName: string): Promise<void> {
    const safeName = encodeURIComponent(pathName);
    await this.request<void>(
      "DELETE",
      `/v3/config/paths/delete/${safeName}`,
      undefined,
      { allowNotFound: true },
    );
    this.logger.debug(`MediaMTX path removed (or already absent): ${pathName}`);
  }

  async listConfiguredPathNames(): Promise<string[]> {
    const result = await this.request<MediaMtxPathConfigList>(
      "GET",
      "/v3/config/paths/list?itemsPerPage=1000",
    );
    return result.items?.map((item) => item.name) ?? [];
  }

  async getPathRuntime(pathName: string): Promise<MediaMtxPathRuntime | null> {
    const safeName = encodeURIComponent(pathName);
    const result = await this.request<MediaMtxPathRuntime>(
      "GET",
      `/v3/paths/get/${safeName}`,
      undefined,
      { allowNotFound: true },
    );
    return result ?? null;
  }
}
