import { createOps, pickOps } from "~/ops";
import { chatOpsCore } from "./core";

/** /chat — full chat workspace. */
export const chatPageOps = createOps({
  id: "chat-page",
  scope: "page",
  ops: pickOps(chatOpsCore, {
    listChats: true,
    listMessages: true,
    listAvailableUsers: true,
    openChat: true,
    createChat: true,
    sendMessage: true,
  }),
});
