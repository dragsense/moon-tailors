import { useCallback, useEffect, useRef, useState } from "react";
import type { ICamera } from "@template/contracts";
import Hls from "hls.js";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { cn } from "~/lib/utils";
import { useCameraStream } from "../hooks/use-camera-stream";
import { createWhepClient } from "../lib/whep-client";

type StreamState = "idle" | "connecting" | "playing" | "error";
type StreamProtocol = "auto" | "hls" | "webrtc";

const WEBRTC_TRY_MS = 8000;

const STREAM_UNAVAILABLE_MESSAGE =
 "Camera offline or stream not ready. Check the camera's stream URL and that it's streaming.";

export type CameraPlayerProps = {
 camera: ICamera;
 className?: string;
};

/** Live player — WebRTC (WHEP) first, HLS fallback. */
export function CameraPlayer({ camera, className }: CameraPlayerProps) {
 const videoRef = useRef<HTMLVideoElement>(null);
 const hlsRef = useRef<Hls | null>(null);
 const whepCloseRef = useRef<( () => void) | null>(null);
 const [state, setState] = useState<StreamState>("idle");
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [protocol, setProtocol] = useState<StreamProtocol>("auto");
 const [retryCount, setRetryCount] = useState(0);

 const { data, isLoading, isError, error, refetch } = useCameraStream(
 camera.id,
);

 const cleanup = useCallback(() => {
 whepCloseRef.current?.();
 whepCloseRef.current = null;
 if (hlsRef.current) {
 hlsRef.current.destroy;
 hlsRef.current = null;
 }
 if (videoRef.current) {
 videoRef.current.srcObject = null;
 videoRef.current.src = "";
 videoRef.current.load;
 }
 }, []);

 const handleRetry = useCallback(() => {
 cleanup;
 setErrorMessage(null);
 setState("idle");
 setRetryCount((c) => c + 1);
 void refetch;
 }, [refetch, cleanup]);

 const startHls = useCallback((video: HTMLVideoElement, hlsUrl: string) => {
 if (Hls.isSupported()) {
 const hls = new Hls({ enableWorker: true });
 hlsRef.current = hls;
 hls.loadSource(hlsUrl);
 hls.attachMedia(video);
 hls.on(Hls.Events.ERROR, (_, ev) => {
 if (ev.fatal) {
 const is404 = ev.response?.code === 404;
 const isNoStream =
 typeof (ev as { details?: string }).details === "string" &&
 (ev as { details?: string }).details!
 .toLowerCase()
 .includes("no stream");
 const msg =
 ev.type === Hls.ErrorTypes.NETWORK_ERROR && (is404 || isNoStream)
 ? STREAM_UNAVAILABLE_MESSAGE
 : ev.type === Hls.ErrorTypes.NETWORK_ERROR
 ? "Network error"
 : "Playback error";
 setErrorMessage(msg);
 setState("error");
 }
 });
 video.oncanplay = () => setState("playing");
 video.onerror = () => {
 setErrorMessage("Video failed to load");
 setState("error");
 };
 } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
 video.src = hlsUrl;
 video.addEventListener("loadeddata",  () => setState("playing"));
 video.onerror = () => {
 setErrorMessage("Video failed to load");
 setState("error");
 };
 } else {
 setErrorMessage("HLS not supported");
 setState("error");
 }
 }, []);

 useEffect(() => {
 if (!data?.hlsUrl || !videoRef.current) return;

 const video = videoRef.current;
 setState("connecting");
 setErrorMessage(null);

 const tryHlsFallback = () => {
 setErrorMessage(null);
 startHls(video, data.hlsUrl);
 };

 const useHlsOnly = protocol === "hls" || !data.webrtcUrl;
 const useWebrtcOnly = protocol === "webrtc";

 if (useHlsOnly) {
 tryHlsFallback;
 return () => cleanup;
 }

 if (useWebrtcOnly && !data.webrtcUrl) {
 setErrorMessage("WebRTC URL not available");
 setState("error");
 return () => cleanup;
 }

 let webrtcDone = false;
 const webrtcTimeout = window.setTimeout( () => {
 if (webrtcDone) return;
 webrtcDone = true;
 whepCloseRef.current?.();
 whepCloseRef.current = null;
 if (useWebrtcOnly) {
 setErrorMessage("WebRTC connection timed out");
 setState("error");
 } else {
 tryHlsFallback;
 }
 }, WEBRTC_TRY_MS);

 let webrtcStream: MediaStream | null = null;
 const closeWhep = createWhepClient({
 url: data.webrtcUrl!,
 onTrack: (evt) => {
 if (webrtcDone) return;
 if (!webrtcStream) webrtcStream = new MediaStream;
 webrtcStream.addTrack(evt.track);
 if (video.srcObject !== webrtcStream) {
 video.srcObject = webrtcStream;
 video.play().catch(() => {});
 }
 webrtcDone = true;
 window.clearTimeout(webrtcTimeout);
 setState("playing");
 },
 onError: () => {
 if (webrtcDone) return;
 webrtcDone = true;
 window.clearTimeout(webrtcTimeout);
 whepCloseRef.current?.();
 whepCloseRef.current = null;
 if (useWebrtcOnly) {
 setErrorMessage("WebRTC failed");
 setState("error");
 } else {
 tryHlsFallback;
 }
 },
 });
 whepCloseRef.current = closeWhep;

 return () => {
 window.clearTimeout(webrtcTimeout);
 cleanup;
 };
 }, [
 data?.hlsUrl,
 data?.webrtcUrl,
 protocol,
 retryCount,
 cleanup,
 startHls,
 ]);

 useEffect(() => {
 if (isError) {
 setErrorMessage(
 error instanceof Error ? error.message : "Failed to load stream",
);
 setState("error");
 }
 }, [isError, error]);

 return (
 <div
 className={cn(
 "relative overflow-hidden rounded-lg bg-black shadow-lg",
 className,
)}
 >
 <video
 ref={videoRef}
 muted
 playsInline
 autoPlay
 preload="auto"
 className="h-full min-h-[240px] w-full object-contain"
 />

 <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
 {state === "playing" ? (
 <div className="flex items-center gap-2 rounded-md bg-green-500/90 px-2 py-1 backdrop-blur-sm">
 <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
 <span className="text-xs font-medium text-white">LIVE</span>
 </div>
) : null}
 {state === "connecting" ? (
 <div className="flex items-center gap-2 rounded-md bg-blue-500/90 px-2 py-1 backdrop-blur-sm">
 <Loader2 className="h-3 w-3 animate-spin text-white" />
 <span className="text-xs font-medium text-white">CONNECTING</span>
 </div>
) : null}
 {state === "error" ? (
 <div className="flex items-center gap-2 rounded-md bg-red-500/90 px-2 py-1 backdrop-blur-sm">
 <AlertCircle className="h-3 w-3 text-white" />
 <span className="text-xs font-medium text-white">FAILED</span>
 </div>
) : null}
 </div>

 <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
 <select
 value={protocol}
 onChange={(e) => setProtocol(e.target.value as StreamProtocol)}
 className="h-8 rounded-md border border-white/30 bg-black/50 px-2 text-xs font-medium text-white backdrop-blur-sm focus:ring-1 focus:ring-white/50 focus:outline-none"
 title="Stream protocol"
 >
 <option value="auto">Auto</option>
 <option value="hls">HLS</option>
 <option value="webrtc">WebRTC</option>
 </select>
 <button
 type="button"
 onClick={handleRetry}
 className="flex h-8 w-8 items-center justify-center rounded-md border border-white/30 bg-black/50 text-white backdrop-blur-sm transition hover:bg-white/20 focus:ring-1 focus:ring-white/50 focus:outline-none"
 title="Retry stream"
 >
 <RefreshCw className="h-4 w-4" />
 </button>
 </div>

 {state === "error" || state === "connecting" ? (
 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/60 p-4 text-white backdrop-blur-sm">
 {state === "connecting" ? (
 <>
 <Loader2 className="h-8 w-8 animate-spin" />
 <span className="text-sm">Connecting to stream…</span>
 </>
) : null}
 {state === "error" ? (
 <>
 {errorMessage ? (
 <p className="text-center text-sm">{errorMessage}</p>
) : null}
 <button
 type="button"
 onClick={handleRetry}
 className="flex items-center gap-2 rounded-md bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 focus:ring-2 focus:ring-white/50 focus:outline-none"
 >
 <RefreshCw className="h-4 w-4" />
 Retry
 </button>
 </>
) : null}
 </div>
) : null}

 {isLoading && state === "idle" ? (
 <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
 <Loader2 className="h-8 w-8 animate-spin text-white" />
 </div>
) : null}
 </div>
);
}
