import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export type ChatComposerProps = {
  disabled?: boolean;
  onSend: (message: string) => Promise<void>;
};

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [text, setText] = useState("");

  return (
    <form
      className="flex gap-2 border-t p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const message = text.trim();
        if (!message) return;
        void onSend(message).then(() => setText(""));
      }}
    >
      <Input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type a message…"
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled || !text.trim()}>
        Send
      </Button>
    </form>
  );
}
