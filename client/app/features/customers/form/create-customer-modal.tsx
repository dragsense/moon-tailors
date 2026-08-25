import { useEffect, useState } from "react";
import {
  createCustomerSchema,
  EGarmentAudience,
  EGender,
  garmentAudienceForGender,
  hasMeasurementValues,
  pickMeasurementValues,
  type IGarmentType,
  type TCreateCustomerData,
  type TMeasurementValues,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { SchemaFieldMap } from "~/lib/form";
import type { MutationOpComponentProps } from "~/ops";
import { useGarmentTypes } from "~/features/garment-types/use-garment-types";
import { GarmentTypeField } from "~/features/garment-types/components/garment-type-field";
import {
  CopyFromRow,
  DraftMeasurementEditor,
} from "../components/measurement-fields";

export function CreateCustomerModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const [drafts, setDrafts] = useState<Record<string, TMeasurementValues>>({});
  const [copyStamp, setCopyStamp] = useState<Record<string, number>>({});
  const { types: allTypes, isPending: typesPending } = useGarmentTypes();
  if (!isOpen) return null;

  return (
    <Modal
      title={t("customers.new")}
      description={t("customers.createHint")}
      onClose={() => {
        setDrafts({});
        setCopyStamp({});
        close();
      }}
      className="max-h-[90vh] overflow-y-auto sm:max-w-5xl"
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("customers.loadFailed")
          : null
      }
    >
      <SchemaForm
        schema={createCustomerSchema}
        defaultValues={{ gender: EGender.MALE }}
        fieldConfig={{ measurements: { hidden: true }, email: { hidden: true } }}
        onSubmit={async (values) => {
          const data = values as TCreateCustomerData;
          const audience = garmentAudienceForGender(
            data.gender ?? EGender.MALE,
          );
          const allowed = new Set(
            allTypes
              .filter((type) =>
                audience ? type.audience === audience : true,
              )
              .map((type) => type.id),
          );
          const measurements = Object.entries(drafts)
            .filter(
              ([garmentTypeId, row]) =>
                allowed.has(garmentTypeId) && hasMeasurementValues(row),
            )
            .map(([garmentTypeId, row]) => ({ garmentTypeId, ...row }));
          await submit({
            ...data,
            measurements,
          });
          setDrafts({});
          setCopyStamp({});
          close();
        }}
      >
        {({ fields, form, isSubmitting }) => (
          <CreateCustomerFields
            fields={fields}
            gender={(form.watch("gender") as EGender | undefined) ?? EGender.MALE}
            isSubmitting={isSubmitting}
            isPending={isPending}
            allTypes={allTypes}
            typesPending={typesPending}
            drafts={drafts}
            copyStamp={copyStamp}
            onDraftChange={(typeId, next) =>
              setDrafts((current) => ({ ...current, [typeId]: next }))
            }
            onCopy={(toId, fromId) => {
              const source = drafts[fromId];
              if (!source) return;
              setDrafts((current) => ({
                ...current,
                [toId]: pickMeasurementValues(source),
              }));
              setCopyStamp((current) => ({
                ...current,
                [toId]: (current[toId] ?? 0) + 1,
              }));
            }}
          />
        )}
      </SchemaForm>
    </Modal>
  );
}

function CreateCustomerFields({
  fields,
  gender,
  isSubmitting,
  isPending,
  allTypes,
  typesPending,
  drafts,
  copyStamp,
  onDraftChange,
  onCopy,
}: {
  fields: SchemaFieldMap;
  gender: EGender;
  isSubmitting: boolean;
  isPending: boolean;
  allTypes: IGarmentType[];
  typesPending: boolean;
  drafts: Record<string, TMeasurementValues>;
  copyStamp: Record<string, number>;
  onDraftChange: (typeId: string, values: TMeasurementValues) => void;
  onCopy: (toId: string, fromId: string) => void;
}) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState("");
  const types = allTypes.filter((type) => {
    const audience = garmentAudienceForGender(gender);
    return audience ? type.audience === audience : true;
  });
  const selected =
    types.find((type) => type.id === selectedId) ?? types[0] ?? null;
  const filledTypes = types.filter((type) =>
    hasMeasurementValues(drafts[type.id]),
  );
  const filledIds = new Set(filledTypes.map((type) => type.id));

  useEffect(() => {
    const ids = allTypes
      .filter((type) => {
        const audience = garmentAudienceForGender(gender);
        return audience ? type.audience === audience : true;
      })
      .map((type) => type.id);
    setSelectedId((current) => {
      if (ids.length === 0) return "";
      return ids.includes(current) ? current : ids[0];
    });
  }, [allTypes, gender]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4">
          <h3 className="font-heading text-sm font-semibold">
            {t("customers.details")}
          </h3>
          {fields.name}
          {fields.gender}
          {fields.phone}
          {fields.whatsapp}
          {fields.address}
          {fields.notes}
        </section>
        <section className="space-y-4">
          <div>
            <h3 className="font-heading text-sm font-semibold">
              {t("customers.defaultMeasurements")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("customers.measurementsHint")}
            </p>
          </div>
          {typesPending ? (
            <p className="text-muted-foreground text-sm">
              {t("common.actions.loading")}
            </p>
          ) : (
            <>
              <GarmentTypeField
                types={types}
                value={selected?.id ?? ""}
                audience={
                  garmentAudienceForGender(gender) ?? EGarmentAudience.GENTS
                }
                filledIds={filledIds}
                onChange={setSelectedId}
              />
              {selected ? (
                <>
                  <CopyFromRow
                    types={filledTypes.filter((item) => item.id !== selected.id)}
                    onCopy={(fromId) => onCopy(selected.id, fromId)}
                  />
                  <DraftMeasurementEditor
                    key={`${selected.id}-${copyStamp[selected.id] ?? 0}`}
                    values={drafts[selected.id]}
                    onChange={(next) => onDraftChange(selected.id, next)}
                  />
                </>
              ) : null}
            </>
          )}
        </section>
      </div>
      <Button type="submit" disabled={isSubmitting || isPending}>
        {isSubmitting || isPending
          ? t("common.actions.loading")
          : t("customers.create")}
      </Button>
    </div>
  );
}
