import { useCallback, useState } from "react";
import { ConfirmCard, type ConfirmTone } from "~/components/layout-ui";

type ConfirmState = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmTone;
  busy: boolean;
  error: string | null;
  onConfirm: (() => void | Promise<void>) | null;
  onCancel: (() => void) | null;
};

const initialState: ConfirmState = {
  isOpen: false,
  title: "",
  description: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  tone: "default",
  busy: false,
  error: null,
  onConfirm: null,
  onCancel: null,
};

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

/**
 * Imperative confirm dialog.
 * Render `<ConfirmDialog />` once near the root of your screen or provider.
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(initialState);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, busy: false, error: null }));
  }, []);

  const setConfirmState = useCallback((patch: Partial<ConfirmState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const confirm = useCallback(
    (
      options: ConfirmOptions,
      onConfirm: () => void | Promise<void>,
      onCancel?: () => void,
    ) => {
      setState({
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? "Confirm",
        cancelLabel: options.cancelLabel ?? "Cancel",
        tone: options.tone ?? "default",
        busy: false,
        error: null,
        onConfirm,
        onCancel: onCancel ?? null,
      });
    },
    [],
  );

  function ConfirmDialog() {
    if (!state.isOpen) return null;

    return (
      <ConfirmCard
        open={state.isOpen}
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        tone={state.tone}
        busy={state.busy}
        error={state.error}
        onConfirm={() => {
          void (async () => {
            if (!state.onConfirm) return;
            setConfirmState({ busy: true, error: null });
            try {
              await state.onConfirm();
              close();
            } catch (err) {
              setConfirmState({
                busy: false,
                error:
                  err instanceof Error ? err.message : "Request failed",
              });
            }
          })();
        }}
        onCancel={() => {
          state.onCancel?.();
          close();
        }}
      />
    );
  }

  return { confirm, ConfirmDialog, close, setConfirmState };
}
