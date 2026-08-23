import type { ICamera } from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import type { MutationOpComponentProps } from "~/ops";

export function ViewCameraModal({
  isOpen,
  close,
  payload,
}: MutationOpComponentProps) {
  if (!isOpen) return null;
  const camera = payload as ICamera | null;
  if (!camera) return null;

  return (
    <Modal
      title={camera.name}
      description="Camera details"
      onClose={close}
    >
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Protocol</dt>
          <dd className="font-medium uppercase">{camera.protocol}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Address</dt>
          <dd className="font-medium">
            {camera.ipAddress ?? "—"}
            {camera.port != null ? `:${camera.port}` : ""}
            {camera.path ?? ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">
            {camera.isActive ? "Active" : "Inactive"}
          </dd>
        </div>
        {camera.description ? (
          <div>
            <dt className="text-muted-foreground">Description</dt>
            <dd>{camera.description}</dd>
          </div>
        ) : null}
      </dl>
    </Modal>
  );
}
