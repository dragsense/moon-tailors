import {
  createGarmentTypeSchema,
  EGarmentAudience,
  type IGarmentType,
  type TCreateGarmentTypeData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";

function asGarmentType(payload: unknown): IGarmentType | undefined {
  if (!payload || typeof payload !== "object" || !("id" in payload)) {
    return undefined;
  }
  return payload as IGarmentType;
}

export function GarmentTypeModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
  payload,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const existing = asGarmentType(payload);
  if (!isOpen) return null;

  return (
    <Modal
      title={existing ? t("garmentTypes.edit") : t("garmentTypes.new")}
      description={
        existing ? t("garmentTypes.editHint") : t("garmentTypes.createHint")
      }
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("garmentTypes.loadFailed")
          : null
      }
    >
      <SchemaForm
        key={existing?.id ?? "new"}
        schema={createGarmentTypeSchema}
        defaultValues={{
          name: existing?.name ?? "",
          audience: existing?.audience ?? EGarmentAudience.GENTS,
          sortOrder: existing?.sortOrder ?? 0,
        }}
        submitLabel={
          isPending ? t("common.actions.loading") : t("common.actions.save")
        }
        onSubmit={async (values) => {
          const body = values as TCreateGarmentTypeData;
          if (existing) {
            await submit({ id: existing.id, ...body });
          } else {
            await submit(body);
          }
          close();
        }}
      />
    </Modal>
  );
}
