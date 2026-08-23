import type {
  ICamera,
  IMessageResponse,
  IPaginatedCameras,
  IStreamResponse,
  TCameraListQuery,
  TCreateCamera,
  TUpdateCamera,
  TUpdateCameraStatus,
} from "@template/contracts";
import { apiRequest, BaseService } from "~/lib/api";

class CamerasService extends BaseService<
  ICamera,
  TCreateCamera,
  TUpdateCamera
> {
  constructor() {
    super("/cameras");
  }

  list(query: Partial<TCameraListQuery> = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<ICamera>({
      page,
      limit,
      ...rest,
    }) as Promise<IPaginatedCameras>;
  }

  getOne(id: string) {
    return this.getSingle(id);
  }

  create(body: TCreateCamera) {
    return this.post<IMessageResponse>(body);
  }

  update(id: string, body: TUpdateCamera) {
    return this.patch<IMessageResponse>(id)(body);
  }

  updateStatus(id: string, body: TUpdateCameraStatus) {
    return this.patch<IMessageResponse>()(body, undefined, `/status/${id}`);
  }

  remove(id: string) {
    return this.delete(id) as Promise<IMessageResponse>;
  }

  /** Stream playback URLs live under `/streams`, not `/cameras`. */
  getStream(cameraId: string) {
    return apiRequest<IStreamResponse>(`/streams/${cameraId}`, "GET");
  }
}

export const camerasService = new CamerasService();
