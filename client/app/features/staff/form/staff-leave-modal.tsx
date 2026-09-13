import {
  type IStaff,
  staffLeaveSchema,
  type TStaffLeaveData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";
import { todayIsoDate } from "../lib/labels";

/** Closes the current employment period. Payload: the staff member. */
export function StaffLeaveModal({
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
      title={t("staff.markLeft")}
      description={t("staff.markLeftHint")}
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
        schema={staffLeaveSchema}
        defaultValues={{ leaveDate: todayIsoDate() }}
        fieldConfig={{
          leaveDate: { label: t("staff.leaveDate") },
          reason: { label: t("staff.leaveReason") },
        }}
        submitLabel={t("staff.markLeft")}
        onSubmit={async (values) => {
          await submit({ id: staff.id, ...(values as TStaffLeaveData) });
          close();
        }}
      />
    </Modal>
  );
}
