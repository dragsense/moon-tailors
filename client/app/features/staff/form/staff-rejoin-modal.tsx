import {
  type IStaff,
  staffRejoinSchema,
  type TStaffRejoinData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { formatDateWithSettings, useSettings } from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";
import { staffPeriodFieldConfig, todayIsoDate } from "../lib/labels";

function lastHistoryDate(staff: IStaff): string | null {
  const dates = staff.employments.flatMap((period) =>
    period.leaveDate ? [period.joinDate, period.leaveDate] : [period.joinDate],
  );
  return dates.length ? dates.sort().at(-1)! : null;
}

function nextDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Opens a new employment period. Payload: the staff member. */
export function StaffRejoinModal({
  isOpen,
  isError,
  error,
  payload,
  close,
  submit,
}: MutationOpComponentProps) {
  const { t, intlLocale } = useI18n();
  const prefs = useSettings();
  const staff = payload as IStaff | null;
  if (!isOpen || !staff) return null;

  // New period must start after every earlier join / leave date (server enforces too).
  const lastDate = lastHistoryDate(staff);
  const earliest = lastDate ? nextDay(lastDate) : null;
  const today = todayIsoDate();
  const defaultJoinDate = earliest && earliest > today ? earliest : today;

  return (
    <Modal
      title={t("staff.rejoin")}
      description={
        lastDate
          ? `${t("staff.rejoinHint")} ${t("staff.rejoinAfter", {
              date: formatDateWithSettings(lastDate, prefs, intlLocale),
            })}`
          : t("staff.rejoinHint")
      }
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
        schema={staffRejoinSchema}
        defaultValues={{
          joinDate: defaultJoinDate,
          payType: staff.currentEmployment?.payType,
          salary: staff.currentEmployment?.salary ?? 0,
        }}
        fieldConfig={{
          ...staffPeriodFieldConfig(t),
          notes: { label: t("staff.notes") },
        }}
        submitLabel={t("staff.rejoin")}
        onSubmit={async (values) => {
          await submit({ id: staff.id, ...(values as TStaffRejoinData) });
          close();
        }}
      />
    </Modal>
  );
}
