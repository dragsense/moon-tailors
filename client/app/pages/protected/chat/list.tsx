import { OpsProvider } from "~/ops";
import { ChatPage } from "~/features/chat/components/chat-page";
import { chatPageOps } from "~/features/chat/ops/list";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Chat · Template" }];
}

export default function ChatRoute() {
  return (
    <>
      <OpsProvider store={chatPageOps} />
      <ChatPage store={chatPageOps} />
    </>
  );
}
