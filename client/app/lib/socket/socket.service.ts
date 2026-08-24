import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "~/lib/api";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./socket.events";

/** Socket.IO connects to API host root — not the `/api` prefix. */
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      transports: ["polling", "websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      withCredentials: true,
    });
  }
  return socket;
}

export function ensureSocketConnected(): Promise<Socket> {
  const s = getSocket();
  if (s.connected) return Promise.resolve(s);

  return new Promise((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve(s);
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      s.off("connect", onConnect);
      s.off("connect_error", onError);
    };

    s.on("connect", onConnect);
    s.on("connect_error", onError);
    s.connect();
  });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function socketEmit<TResponse = unknown>(
  event: keyof ClientToServerEvents,
  data?: unknown,
): Promise<TResponse> {
  return ensureSocketConnected().then(
    (s) =>
      new Promise((resolve, reject) => {
        const emit = s.emit.bind(s) as (
          name: keyof ClientToServerEvents,
          payload: unknown,
          ack: (response: unknown) => void,
        ) => void;
        emit(event, data, (response) => {
          resolve(response as TResponse);
        });
        setTimeout(() => reject(new Error("Socket ack timeout")), 10_000);
      }),
  );
}
