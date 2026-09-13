import { useState } from "react";
import {
  createVendorPurchaseSchema,
  type IVendor,
} from "@moon-tailors/contracts";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";
import { formatAmount, todayIsoDate } from "../lib/format";

type ItemRow = {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

let rowKey = 0;
const emptyRow = (): ItemRow => ({
  key: ++rowKey,
  description: "",
  quantity: "1",
  unitPrice: "",
});

const lineTotal = (row: ItemRow) =>
  (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);

/** Purchase with line items. Totals are shown live, calculated not typed. */
export function VendorPurchaseModal({
  isOpen,
  isError,
  error,
  isPending,
  payload,
  close,
  submit,
}: MutationOpComponentProps) {
  const { t, intlLocale } = useI18n();
  const [purchaseDate, setPurchaseDate] = useState(todayIsoDate);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ItemRow[]>(() => [emptyRow()]);
  const [formError, setFormError] = useState<string | null>(null);

  const vendor = payload as IVendor | null;
  if (!isOpen || !vendor) return null;

  const grandTotal = rows.reduce((sum, row) => sum + lineTotal(row), 0);

  function reset() {
    setPurchaseDate(todayIsoDate());
    setNotes("");
    setRows([emptyRow()]);
    setFormError(null);
  }

  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = createVendorPurchaseSchema.safeParse({
      purchaseDate,
      notes,
      items: rows.map(({ description, quantity, unitPrice }) => ({
        description,
        quantity,
        unitPrice,
      })),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t("vendors.loadFailed"));
      return;
    }
    setFormError(null);
    await submit({ id: vendor!.id, ...parsed.data });
    reset();
    close();
  }

  return (
    <Modal
      title={t("vendors.addPurchase")}
      description={t("vendors.addPurchaseHint", { name: vendor.name })}
      onClose={() => {
        reset();
        close();
      }}
      className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      error={
        formError ??
        (isError
          ? error instanceof Error
            ? error.message
            : t("vendors.loadFailed")
          : null)
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="purchase-date">{t("vendors.purchaseDate")}</Label>
            <Input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              required
            />
          </div>
        </div>

        <section className="space-y-2">
          <h3 className="font-heading text-sm font-semibold">
            {t("vendors.lineItems")}
          </h3>
          <div className="flex flex-col gap-2">
            {rows.map((row, index) => (
              <div
                key={row.key}
                className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border border-border/50 p-2 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_7rem_auto]"
              >
                <div className="col-span-2 space-y-1 sm:col-span-1">
                  <Label className="text-xs">{t("vendors.item")}</Label>
                  <Input
                    value={row.description}
                    placeholder={t("vendors.itemPlaceholder")}
                    onChange={(event) =>
                      updateRow(row.key, { description: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("vendors.quantity")}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.key, { quantity: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("vendors.unitPrice")}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={row.unitPrice}
                    onChange={(event) =>
                      updateRow(row.key, { unitPrice: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("vendors.lineTotal")}</Label>
                  <p className="flex h-9 items-center text-sm font-medium tabular-nums">
                    {formatAmount(lineTotal(row), intlLocale)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("vendors.removeItem")}
                  disabled={rows.length === 1}
                  onClick={() =>
                    setRows((current) =>
                      current.filter((item) => item.key !== row.key),
                    )
                  }
                  className={index === 0 && rows.length === 1 ? "opacity-40" : ""}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((current) => [...current, emptyRow()])}
          >
            <PlusIcon className="size-4" />
            {t("vendors.addItem")}
          </Button>
        </section>

        <div className="space-y-2">
          <Label htmlFor="purchase-notes">{t("vendors.notes")}</Label>
          <Textarea
            id="purchase-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <p className="text-sm">
            <span className="text-muted-foreground">
              {t("vendors.purchaseTotal")}:{" "}
            </span>
            <span className="text-lg font-semibold tabular-nums">
              {formatAmount(grandTotal, intlLocale)}
            </span>
          </p>
          <Button type="submit" disabled={isPending}>
            {isPending ? t("common.actions.loading") : t("vendors.savePurchase")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
