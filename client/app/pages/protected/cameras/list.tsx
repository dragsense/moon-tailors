import { OpsProvider } from "~/ops";
import { camerasListOps } from "~/features/cameras/ops/list";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Cameras · Template" }];
}

export default function CamerasPage() {
  return (
    <OpsProvider store={camerasListOps}>
      {({ components }) => components.listCameras}
    </OpsProvider>
  );
}
