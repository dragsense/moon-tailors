/** Server → client events. */
export type ServerToClientEvents = {};

/** Client → server events. */
export type ClientToServerEvents = {
  joinUserRoom: (
    data: { userId: string },
    callback?: (response: { success: boolean }) => void,
  ) => void;
};

export type ChatSocketEvents = ServerToClientEvents & ClientToServerEvents;
