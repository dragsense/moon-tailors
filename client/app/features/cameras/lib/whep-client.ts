/**
 * WHEP (WebRTC HTTP Egress Protocol) client for MediaMTX.
 * Keep WHEP behavior identical so streaming does not break.
 * @see https://mediamtx.org/docs/read/webrtc
 */

export interface WhepClientOptions {
 url: string;
 user?: string;
 pass?: string;
 onTrack: (evt: RTCTrackEvent) => void;
 onError: (err: string) => void;
}

/** Subscribe to a WHEP stream. Returns a close function. */
export function createWhepClient(options: WhepClientOptions): () => void {
 const { url, user, pass, onTrack, onError } = options;
 let closed = false;
 let pc: RTCPeerConnection | null = null;
 let resourceUrl: string | null = null;

 const authHeader =
 user && pass
 ? { Authorization: `Basic ${btoa(`${user}:${pass}`)}` }
 : ({} as Record<string, string>);

 const close = () => {
 closed = true;
 if (pc) {
 pc.close();
 pc = null;
 }
 };

 const run = async () => {
 try {
 pc = new RTCPeerConnection({
 iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
 });

 pc.ontrack = (evt) => {
 if (!closed) onTrack(evt);
 };
 pc.oniceconnectionstatechange = () => {
 if (closed || !pc) return;
 if (
 pc.iceConnectionState === "failed" ||
 pc.iceConnectionState === "disconnected"
) {
 onError("WebRTC connection failed");
 }
 };

 pc.addTransceiver("video", { direction: "recvonly" });
 pc.addTransceiver("audio", { direction: "recvonly" });

 const offer = await pc.createOffer();
 await pc.setLocalDescription(offer);

 const res = await fetch(url, {
 method: "POST",
 headers: {
 "Content-Type": "application/sdp",
 ...authHeader,
 },
 body: offer.sdp,
 });

 if (!res.ok) {
 let msg = res.statusText;
 try {
 const text = await res.text();
 if (text) {
 const json = JSON.parse(text) as { error?: string };
 msg = json.error ?? text;
 }
 } catch {
 // use default msg
 }
 throw new Error(msg);
 }

 const answerSdp = await res.text();
 let rawResource = res.headers.get("Location") ?? res.headers.get("Link");
 if (rawResource) {
 const match = rawResource.match(/<([^>]+)>/);
 const parsed = match ? match[1] : rawResource.trim();
 if (parsed.startsWith("http://") || parsed.startsWith("https://")) {
 resourceUrl = parsed;
 } else if (parsed.startsWith("/")) {
 const base = new URL(url);
 resourceUrl = `${base.origin}${parsed}`;
 }
 }

 await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

 if (resourceUrl) {
 pc.onicecandidate = (evt) => {
 if (closed || !evt.candidate || !resourceUrl) return;
 const candidate = evt.candidate.candidate;
 if (!candidate) return;
 fetch(resourceUrl!, {
 method: "PATCH",
 headers: {
 "Content-Type": "application/trickle-ice-sdpfrag",
 ...authHeader,
 },
 body: `a=${candidate}`,
 }).catch(() => {});
 };
 }
 } catch (err) {
 if (!closed) {
 onError(err instanceof Error ? err.message : "WebRTC failed");
 }
 }
 };
  run();
 return close;
}
