import {
  createVendorSchema,
  type TCreateVendorData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";
import { vendorProfileFieldConfig } from "../lib/format";

export function CreateVendorModal({
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
      title={t("vendors.new")}
      description={t("vendors.createHint")}
      onClose={close}
      className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("vendors.loadFailed")
          : null
      }
    >
      <SchemaForm
        schema={createVendorSchema}
        fieldConfig={vendorProfileFieldConfig(t)}
        submitLabel={t("vendors.create")}
        onSubmit={async (values) => {
          await submit(values as TCreateVendorData);
          close();
        }}
      />
    </Modal>
  );
}
