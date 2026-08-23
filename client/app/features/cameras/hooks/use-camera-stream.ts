import { useQuery } from "@tanstack/react-query";
import type { IStreamResponse } from "@template/contracts";
import { camerasService } from "../api";

/** Fetch HLS + WebRTC URLs; MediaMTX path is ensured on the server. */
export function useCameraStream(cameraId: string) {
  return useQuery<IStreamResponse>({
    queryKey: ["camera-stream", cameraId],
    queryFn: () => {
      if (!cameraId) throw new Error("Camera ID is required");
      return camerasService.getStream(cameraId);
    },
    enabled: !!cameraId,
  });
}
