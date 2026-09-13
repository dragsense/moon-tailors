import {
  type IStaff,
  staffSalarySchema,
  type TStaffSalaryData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";

/** Change salary / rate on the open work period. Payload: the staff member. */
export function StaffSalaryModal({
  isOpen,
  isError,
  error,
  payload,
  close,
  submit,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const staff = payload as IStaff | null;
  if (!isOpen || !staff) return null;

  return (
    <Modal
      title={t("staff.changeSalary")}
      description={t("staff.changeSalaryHint")}
      onClose={close}
      className="sm:max-w-md"
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("staff.loadFailed")
          : null
      }
    >
      <SchemaForm
        schema={staffSalarySchema}
        defaultValues={{ salary: staff.currentEmployment?.salary ?? 0 }}
        fieldConfig={{ salary: { label: t("staff.salary") } }}
        submitLabel={t("common.actions.save")}
        onSubmit={async (values) => {
          await submit({ id: staff.id, ...(values as TStaffSalaryData) });
          close();
        }}
      />
    </Modal>
  );
}
