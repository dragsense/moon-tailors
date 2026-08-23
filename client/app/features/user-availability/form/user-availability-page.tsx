import { useEffect, useState } from "react";
import {
  upsertUserAvailabilitySchema,
  type IUserAvailability,
  type TUpsertUserAvailability,
} from "@template/contracts";
import { EntityForm } from "~/components/form-ui";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Page } from "~/layouts";
import { userAvailabilityService } from "../api";
import { AvailabilityScheduleFields } from "./availability-schedule-fields";

/**
 * Upsert availability — one form for create + update.
 * Uses EntityForm mode="upsert" + custom weekly grid fields.
 */
export function UserAvailabilityPage() {
  const [data, setData] = useState<IUserAvailability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void userAvailabilityService
      .mine()
      .then((row) => {
        if (!cancelled) setData(row);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Page
      title="Availability"
      description="Weekly schedule and unavailable periods — upsert form (no create/edit fork)."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? (
        <Alert title="Couldn’t load availability" tone="danger">
          {error}
        </Alert>
      ) : null}
      {saved ? (
        <Alert title="Saved">
          Availability updated.
        </Alert>
      ) : null}

      {data ? (
        <EntityForm
          createSchema={upsertUserAvailabilitySchema}
          mode="upsert"
          record={data}
          defaultValues={{
            weeklySchedule: data.weeklySchedule,
            unavailablePeriods: data.unavailablePeriods ?? [],
          }}
          onSubmit={async (values) => {
            setSaved(false);
            const next = await userAvailabilityService.upsert(
              values as TUpsertUserAvailability,
            );
            setData(next);
            setSaved(true);
          }}
        >
          {({ isSubmitting }) => (
            <div className="space-y-6 max-w-2xl">
              <AvailabilityScheduleFields />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save availability"}
              </Button>
            </div>
          )}
        </EntityForm>
      ) : null}
    </Page>
  );
}
