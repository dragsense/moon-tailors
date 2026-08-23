import type { TCreateCamera, TUpdateCamera } from "@template/contracts";
import {
  ECameraProtocol,
  createCameraSchema,
  updateCameraSchema,
} from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Button } from "~/components/ui/button";

export type CameraFormProps = {
  mode: "create" | "update";
  onSubmit: (values: TCreateCamera | TUpdateCamera) => void | Promise<void>;
  busy?: boolean;
  defaultValues?: Partial<TCreateCamera & TUpdateCamera>;
};

export function CameraForm({
  mode,
  onSubmit,
  busy = false,
  defaultValues,
}: CameraFormProps) {
  const schema = mode === "create" ? createCameraSchema : updateCameraSchema;

  return (
    <SchemaForm
      schema={schema}
      defaultValues={{
        protocol: ECameraProtocol.RTSP,
        port: 554,
        path: "/stream",
        isActive: true,
        ...defaultValues,
      }}
      onSubmit={async (values) => {
        await onSubmit(values as TCreateCamera | TUpdateCamera);
      }}
    >
      {({ fields, form }) => (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">{fields.name}</div>
            <div className="sm:col-span-2">{fields.description}</div>
            {fields.protocol}
            {fields.isActive}
            {fields.ipAddress}
            {fields.port}
            {fields.path}
            {fields.username}
            {fields.password}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={busy || form.formState.isSubmitting}>
              {busy
                ? "Saving…"
                : mode === "create"
                  ? "Create camera"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </SchemaForm>
  );
}
