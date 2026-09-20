import {
  createStaffSchema,
  EStaffPayType,
  type TCreateStaffData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";
import { staffFieldConfig } from "../lib/labels";

/** Who they are and how they are paid — nothing else to fill in. */
export function CreateStaffModal({
  isOpen,
  isError,
  error,
  close,
  submit,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <Modal
      title={t("staff.new")}
      description={t("staff.createHint")}
      onClose={close}
      className="max-h-[90vh] overflow-y-auto sm:max-w-md"
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
        defaultValues={{ payType: EStaffPayType.FIXED, salary: 0 }}
        fieldConfig={staffFieldConfig(t)}
        submitLabel={t("staff.create")}
        onSubmit={async (values) => {
          await submit(values as TCreateStaffData);
          close();
        }}
      />
    </Modal>
  );
}
