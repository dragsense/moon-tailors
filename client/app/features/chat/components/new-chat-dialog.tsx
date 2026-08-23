import { useEffect, useState } from "react";
import type {
  IChat,
  IPaginatedResponse,
  TCreateChatResponse,
} from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  userDisplayName,
  type TUserRow,
} from "~/features/users/api";
import { useOp, type OpsStore } from "~/ops";

export type NewChatDialogProps = {
  store: OpsStore;
  onClose: () => void;
  onCreated: (chat: IChat) => void;
};

export function NewChatDialog({ store, onClose, onCreated }: NewChatDialogProps) {
  const listAvailableUsers = useOp(store, "listAvailableUsers");
  const createChat = useOp(store, "createChat");
  const [participantId, setParticipantId] = useState("");

  if (listAvailableUsers.kind !== "query") return null;
  if (createChat.kind !== "mutation") return null;

  const users =
    (listAvailableUsers.data as IPaginatedResponse<TUserRow> | undefined)
      ?.data ?? [];

  useEffect(() => {
    void listAvailableUsers.refetch();
  }, []);

  return (
    <Modal title="New chat" description="Start a direct conversation." onClose={onClose}>
      <div className="space-y-4">
        <Select value={participantId} onValueChange={setParticipantId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {userDisplayName(user)} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!participantId || createChat.isPending}
            onClick={() => {
              void createChat
                .run({ participantId })
                .then((result) => {
                  const chat = (result as TCreateChatResponse).chat;
                  onCreated(chat);
                })
                .catch(() => {});
            }}
          >
            Start chat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
