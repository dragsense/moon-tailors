import type { ICamera } from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import type { MutationOpComponentProps } from "~/ops";

export function UpdateCameraStatusModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
  payload,
}: MutationOpComponentProps) {
  if (!isOpen) return null;
  const camera = payload as ICamera | null;
  if (!camera) return null;

  const nextActive = !camera.isActive;

  return (
    <Modal
      title={nextActive ? "Activate camera" : "Deactivate camera"}
      description={
        nextActive
          ? "Enable live streaming for this camera."
          : "Disable streaming and remove the MediaMTX path."
      }
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Status update failed"
          : null
      }
    >
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={async () => {
            await submit({ id: camera.id, isActive: nextActive });
            close();
          }}
        >
          {isPending ? "Saving…" : nextActive ? "Activate" : "Deactivate"}
        </Button>
      </div>
    </Modal>
  );
}
