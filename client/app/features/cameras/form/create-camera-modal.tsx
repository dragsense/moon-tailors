import { Modal } from "~/components/layout-ui";
import type { MutationOpComponentProps } from "~/ops";
import { CameraForm } from "./camera-form";

export function CreateCameraModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
}: MutationOpComponentProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title="New camera"
      description="Add a camera for live HLS / WebRTC streaming."
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Create failed"
          : null
      }
    >
      <CameraForm
        mode="create"
        busy={isPending}
        onSubmit={async (values) => {
          await submit(values);
          close();
        }}
      />
    </Modal>
  );
}
