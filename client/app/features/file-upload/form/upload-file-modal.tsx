import { Modal } from "~/components/layout-ui";
import type { MutationOpComponentProps } from "~/ops";
import { CreateFileForm } from "./create-file-form";

/** uploadFile.component — modal shell around CreateFileForm. */
export function UploadFileModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
  payload,
}: MutationOpComponentProps) {
  if (!isOpen) return null;

  const folder =
    payload &&
    typeof payload === "object" &&
    "folder" in payload &&
    typeof (payload as { folder?: unknown }).folder === "string"
      ? (payload as { folder: string }).folder
      : undefined;

  return (
    <Modal
      title="Upload file"
      description="Add a file to the selected folder, or paste an external URL."
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Upload failed"
          : null
      }
    >
      <CreateFileForm
        busy={isPending}
        defaultFolder={folder}
        onSubmit={async (values) => {
          await submit(values);
          close();
        }}
      />
    </Modal>
  );
}
