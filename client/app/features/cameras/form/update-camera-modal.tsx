import type { ICamera, TUpdateCamera } from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import type { MutationOpComponentProps } from "~/ops";
import { CameraForm } from "./camera-form";

export function UpdateCameraModal({
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

  return (
    <Modal
      title="Edit camera"
      description="Update connection settings. Leave password blank to keep the current one."
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Update failed"
          : null
      }
    >
      <CameraForm
        mode="update"
        busy={isPending}
        defaultValues={{
          name: camera.name,
          description: camera.description ?? undefined,
          protocol: camera.protocol,
          username: camera.username ?? undefined,
          ipAddress: camera.ipAddress ?? undefined,
          port: camera.port ?? undefined,
          path: camera.path ?? undefined,
          isActive: camera.isActive,
        }}
        onSubmit={async (values) => {
          await submit({
            id: camera.id,
            body: values as TUpdateCamera,
          });
          close();
        }}
      />
    </Modal>
  );
}
