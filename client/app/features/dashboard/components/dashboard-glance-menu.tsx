import { useState } from "react";
import type { IDashboardSummary } from "@moon-tailors/contracts";
import { LayoutDashboardIcon } from "lucide-react";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { OpsComponent, type OpsStore } from "~/ops";
import { DashboardStats } from "./dashboard-stats";

type DashboardGlanceMenuProps = {
  store: OpsStore;
  summary?: IDashboardSummary;
};

/** Phone/tablet — same modal overlay as the rest of the app. */
export function DashboardGlanceMenu({
  store,
  summary,
}: DashboardGlanceMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="size-11 px-0 lg:hidden"
        aria-label={t("dashboard.glance")}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <LayoutDashboardIcon className="size-5" />
      </Button>
      {open ? (
        <Modal
          title={t("dashboard.glance")}
          hideTitle
          onClose={() => setOpen(false)}
          className="flex max-h-[90vh] w-full flex-col overflow-hidden sm:max-w-lg"
          contentClassName="min-h-0 overflow-y-auto"
        >
          <div className="flex flex-col gap-4">
            {summary ? <DashboardStats summary={summary} /> : null}
            <OpsComponent store={store} name="latestOrders" />
          </div>
        </Modal>
      ) : null}
    </>
  );
}
