import { useState } from "react";
import type { TCreateFileUpload } from "@template/contracts";
import {
  USER_UPLOAD_FOLDER,
  createFileUploadSchema,
} from "@template/contracts";
import { FileUpload, SchemaForm } from "~/components/form-ui";
import { Button } from "~/components/ui/button";
import { FieldShell } from "~/lib/form";

export type CreateFileFormProps = {
  onSubmit: (
    values: TCreateFileUpload & { file?: File | null },
  ) => void | Promise<void>;
  busy?: boolean;
  defaultFolder?: string;
};

export function CreateFileForm({
  onSubmit,
  busy = false,
  defaultFolder = USER_UPLOAD_FOLDER,
}: CreateFileFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  return (
    <SchemaForm
      schema={createFileUploadSchema}
      defaultValues={{ folder: defaultFolder }}
      onSubmit={async (values) => {
        if (!file && !values.url) {
          setFileError("Choose a file or provide a URL.");
          return;
        }
        setFileError(null);
        await onSubmit({ ...values, file });
      }}
    >
      {({ fields, isSubmitting }) => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.name}
            {fields.type}
          </div>
          {fields.folder}
          <FieldShell name="file" label="File" error={fileError ?? undefined}>
            <FileUpload
              value={file}
              onChange={(next) => {
                setFile(next);
                if (next) setFileError(null);
              }}
              disabled={isSubmitting || busy}
              maxSizeInMB={50}
            />
          </FieldShell>
          {fields.url}
          <Button type="submit" disabled={isSubmitting || busy}>
            {isSubmitting || busy ? "Uploading…" : "Upload file"}
          </Button>
        </div>
      )}
    </SchemaForm>
  );
}
