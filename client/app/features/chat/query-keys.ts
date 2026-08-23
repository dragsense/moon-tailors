export const chatKeys = {
  all: ["chat"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...chatKeys.lists(), params] as const,
  messages: () => [...chatKeys.all, "messages"] as const,
  messageList: (params: Record<string, unknown>) =>
    [...chatKeys.messages(), params] as const,
  availableUsers: () => [...chatKeys.all, "available-users"] as const,
  availableUsersList: (params: Record<string, unknown>) =>
    [...chatKeys.availableUsers(), params] as const,
};
