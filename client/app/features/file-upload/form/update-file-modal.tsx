import { useState } from "react";
import type { IFileUpload, TUpdateFileUpload } from "@template/contracts";
import { updateFileUploadSchema } from "@template/contracts";
import { FileUpload, SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { FieldShell } from "~/lib/form";
import type { MutationOpComponentProps } from "~/ops";

function fileFromPayload(payload: unknown): IFileUpload | null {
  if (payload && typeof payload === "object" && "id" in payload) {
    return payload as IFileUpload;
  }
  return null;
}

/** updateFile.component — rename / replace file. */
export function UpdateFileModal({
  isOpen,
  payload,
  close,
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const file = fileFromPayload(payload);
  const [replacement, setReplacement] = useState<File | null>(null);

  if (!isOpen || !file) return null;

  return (
    <Modal
      title="Edit file"
      description={file.name}
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Update failed"
          : null
      }
    >
      <SchemaForm
        schema={updateFileUploadSchema}
        defaultValues={{ name: file.name, type: file.type }}
        onSubmit={async (values: TUpdateFileUpload) => {
          await submit({
            id: file.id,
            body: { ...values, file: replacement },
          });
          close();
        }}
      >
        {({ fields, isSubmitting }) => (
          <div className="space-y-4">
            {fields.name}
            {fields.type}
            <FieldShell name="file" label="Replace file (optional)">
              <FileUpload
                value={replacement ?? file}
                onChange={setReplacement}
                disabled={isSubmitting || isPending}
                maxSizeInMB={50}
              />
            </FieldShell>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isPending}>
                {isSubmitting || isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </SchemaForm>
    </Modal>
  );
}
