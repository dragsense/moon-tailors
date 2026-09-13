import {
  createStaffSchema,
  EStaffPayType,
  type TCreateStaffData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";
import {
  staffPeriodFieldConfig,
  staffProfileFieldConfig,
  todayIsoDate,
} from "../lib/labels";

/** Plain staff info + their first work period. */
export function CreateStaffModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <Modal
      title={t("staff.new")}
      description={t("staff.createHint")}
      onClose={close}
      className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("staff.loadFailed")
          : null
      }
    >
      <SchemaForm
        schema={createStaffSchema}
        defaultValues={{
          payType: EStaffPayType.FIXED,
          joinDate: todayIsoDate(),
          salary: 0,
        }}
        fieldConfig={{
          ...staffProfileFieldConfig(t),
          ...staffPeriodFieldConfig(t),
        }}
        onSubmit={async (values) => {
          await submit(values as TCreateStaffData);
          close();
        }}
      >
        {({ fields, isSubmitting }) => (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
              <section className="space-y-4">
                <h3 className="font-heading text-sm font-semibold">
                  {t("staff.details")}
                </h3>
                {fields.name}
                {fields.phone}
                {fields.role}
                {fields.address}
                {fields.notes}
              </section>
              <section className="space-y-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold">
                    {t("staff.firstPeriod")}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t("staff.firstPeriodHint")}
                  </p>
                </div>
                {fields.joinDate}
                {fields.payType}
                {fields.salary}
              </section>
            </div>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending
                ? t("common.actions.loading")
                : t("staff.create")}
            </Button>
          </div>
        )}
      </SchemaForm>
    </Modal>
  );
}
