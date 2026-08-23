import type { BusinessThemeDraftPayload } from "./preview";

type Listener = () => void;

let draft: BusinessThemeDraftPayload | null = null;
const listeners = new Set<Listener>();

export function setPreviewDraft(next: BusinessThemeDraftPayload | null) {
  draft = next;
  for (const listener of listeners) listener();
}

export function getPreviewDraft() {
  return draft;
}

export function subscribePreviewDraft(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
