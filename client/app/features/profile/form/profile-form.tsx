import {
  updateMeSchema,
  type IMeUser,
  type TUpdateMeData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { CardPanel } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type MutationOpComponentProps } from "~/ops";

/** profileOps.updateMe component. */
export function ProfileForm({
  submit,
  isPending,
  isError,
  error,
  store,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const myProfile = useOp(store, "myProfile");
  const profile =
    myProfile.kind === "query" ? (myProfile.data as IMeUser | undefined) : undefined;
  const loading = myProfile.kind === "query" && myProfile.isPending && !profile;

  return (
    <div className="grid max-w-2xl gap-6">
      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("common.actions.loading")}
        </p>
      ) : null}

      <CardPanel
        title={t("profile.detailsTitle")}
        description={t("profile.detailsDescription")}
      >
        {profile ? (
          <SchemaForm
            key={profile.updatedAt}
            schema={updateMeSchema}
            defaultValues={{
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              age: profile.age,
              gender: profile.gender,
            }}
            submitLabel={
              isPending ? t("common.actions.loading") : t("profile.saveDetails")
            }
            onSubmit={async (values): Promise<void> => {
              await submit(values as TUpdateMeData);
            }}
          />
        ) : null}
        {isError ? (
          <p className="mt-3 text-sm text-destructive">
            {error instanceof Error ? error.message : t("profile.saveFailed")}
          </p>
        ) : null}
      </CardPanel>
    </div>
  );
}
