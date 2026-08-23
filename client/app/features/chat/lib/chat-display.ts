import type { IChat, IChatParticipant } from "@template/contracts";
import { userDisplayName } from "~/features/users/api";

/** Display name from `participants.user` relation. */
export function participantDisplayName(
  participant: IChatParticipant | undefined,
): string {
  if (!participant?.user) return "User";
  return userDisplayName(participant.user) || participant.user.email;
}

export function chatTitle(chat: IChat, excludeUserId?: string): string {
  const rows = chat.participants ?? [];
  const names = rows
    .filter((row) => !excludeUserId || row.userId !== excludeUserId)
    .map((row) => participantDisplayName(row))
    .filter(Boolean);
  return names.length ? names.join(", ") : chat.name || "Chat";
}
