export const cameraKeys = {
  all: ["cameras"] as const,
  lists: () => [...cameraKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...cameraKeys.lists(), params] as const,
  streams: () => [...cameraKeys.all, "stream"] as const,
  stream: (cameraId: string) => [...cameraKeys.streams(), cameraId] as const,
};
