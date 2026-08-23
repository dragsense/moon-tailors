import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { TUpsertUserAvailability, TWeekday } from "@template/contracts";
import { WEEKDAY_KEYS } from "@template/contracts";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

/** Weekly grid + unavailable periods — custom availability UI. */
export function AvailabilityScheduleFields() {
 const { control, register, setValue } =
 useFormContext<TUpsertUserAvailability>();
 const schedule = useWatch({ control, name: "weeklySchedule" });

 return (
 <div className="space-y-8">
 <section className="space-y-4">
 <h3 className="text-sm font-medium">Weekly schedule</h3>
 {WEEKDAY_KEYS.map((day) => (
 <DayRow
 key={day}
 day={day}
 enabled={Boolean(schedule?.[day]?.enabled)}
 onEnabledChange={(enabled) =>
 setValue(`weeklySchedule.${day}.enabled`, enabled, {
 shouldDirty: true,
 })
 }
 />
))}
 </section>
 <UnavailablePeriodsSection />
 </div>
);
}

function DayRow({
 day,
 enabled,
 onEnabledChange,
}: {
 day: TWeekday;
 enabled: boolean;
 onEnabledChange: (v: boolean) => void;
}) {
 const { control, register } = useFormContext<TUpsertUserAvailability>();
 const { fields, append, remove } = useFieldArray({
 control,
 name: `weeklySchedule.${day}.timeSlots`,
 });

 return (
 <div className="rounded-md border border-border p-3 space-y-3">
 <div className="flex items-center justify-between gap-3">
 <Label className="capitalize">{day}</Label>
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground">Enabled</span>
 <Switch checked={enabled} onCheckedChange={onEnabledChange} />
 </div>
 </div>
 {enabled ? (
 <div className="space-y-2">
 {fields.map((field, index) => (
 <div key={field.id} className="flex flex-wrap items-end gap-2">
 <div className="space-y-1">
 <Label className="text-xs">Start</Label>
 <Input
 type="time"
 className="w-32"
 {...register(`weeklySchedule.${day}.timeSlots.${index}.start`)}
 />
 </div>
 <div className="space-y-1">
 <Label className="text-xs">End</Label>
 <Input
 type="time"
 className="w-32"
 {...register(`weeklySchedule.${day}.timeSlots.${index}.end`)}
 />
 </div>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={ () => remove(index)}
 >
 Remove
 </Button>
 </div>
))}
 {fields.length < 5 ? (
 <Button
 type="button"
 variant="secondary"
 size="sm"
 onClick={ () => append({ start: "09:00", end: "17:00" })}
 >
 Add slot
 </Button>
) : null}
 </div>
) : null}
 </div>
);
}

function UnavailablePeriodsSection() {
 const { control, register } = useFormContext<TUpsertUserAvailability>();
 const { fields, append, remove } = useFieldArray({
 control,
 name: "unavailablePeriods",
 });

 return (
 <section className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-medium">Unavailable periods</h3>
 <Button
 type="button"
 size="sm"
 variant="secondary"
 onClick={ () =>
 append({ reason: "", startDate: "", endDate: "" })
 }
 disabled={fields.length >= 10}
 >
 Add period
 </Button>
 </div>
 {fields.map((field, index) => (
 <div
 key={field.id}
 className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-4"
 >
 <div className="sm:col-span-2 space-y-1">
 <Label className="text-xs">Reason</Label>
 <Input {...register(`unavailablePeriods.${index}.reason`)} />
 </div>
 <div className="space-y-1">
 <Label className="text-xs">From</Label>
 <Input
 type="date"
 {...register(`unavailablePeriods.${index}.startDate`)}
 />
 </div>
 <div className="space-y-1">
 <Label className="text-xs">To</Label>
 <Input
 type="date"
 {...register(`unavailablePeriods.${index}.endDate`)}
 />
 </div>
 <Button
 type="button"
 variant="outline"
 size="sm"
 className="sm:col-span-4 w-fit"
 onClick={ () => remove(index)}
 >
 Remove period
 </Button>
 </div>
))}
 </section>
);
}
