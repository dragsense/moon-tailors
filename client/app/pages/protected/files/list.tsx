import { OpsProvider } from "~/ops";
import { filesListOps } from "~/features/file-upload/ops/list";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Files · Template" }];
}

export default function FilesPage() {
  return (
    <OpsProvider store={filesListOps}>
      {({ components }) => components.listFiles}
    </OpsProvider>
  );
}
