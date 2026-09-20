import { Injectable } from "@nestjs/common";
import type { IVendorSlip, TVendorSlipQuery } from "@moon-tailors/contracts";
import type { EntityKey } from "../../common/query";
import { VendorsService } from "./vendors.service";

const CURRENCY = "PKR";

/**
 * The vendor's monthly statement as a standalone HTML page, served as raw
 * `text/html` so the browser can print it to paper or PDF. Mirrors the staff
 * slip, so the app itself still needs no print stylesheet.
 */
@Injectable()
export class VendorSlipService {
  constructor(private readonly vendors: VendorsService) {}

  async render(key: EntityKey, query: TVendorSlipQuery): Promise<string> {
    return buildHtml(await this.vendors.slip(key, query));
  }
}

function buildHtml(slip: IVendorSlip): string {
  const overpaid = slip.remaining < 0;

  const monthRows: [string, string, string?][] = [
    ["Purchases this month", money(slip.total)],
    ["Paid this month", money(slip.paid), "paid"],
    [
      overpaid ? "Paid over purchases" : "Remaining this month",
      money(Math.abs(slip.remaining)),
      overpaid ? "over" : "due",
    ],
  ];

  const rows = (entries: [string, string, string?][]) =>
    entries
      .map(
        ([label, value, tone]) =>
          `<div class="row ${tone ?? ""}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`,
      )
      .join("");

  const meta = [slip.vendor.company, slip.vendor.phone]
    .filter(Boolean)
    .map((value) => esc(String(value)))
    .join(" &middot; ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Statement — ${esc(slip.vendor.name)} — ${esc(monthLabel(slip.month))}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 24px;
    background: #f5f5f4;
    color: #1c1917;
    font: 14px/1.5 ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  }
  .sheet {
    max-width: 640px;
    margin: 0 auto;
    padding: 32px;
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 8px;
  }
  .shop { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
  .title { margin-top: 2px; font-size: 12px; text-transform: uppercase;
           letter-spacing: 0.08em; color: #78716c; }
  .who { margin: 24px 0 4px; font-size: 16px; font-weight: 600; }
  .meta { color: #57534e; font-size: 13px; }
  .month { margin-top: 24px; font-size: 12px; font-weight: 600;
           text-transform: uppercase; letter-spacing: 0.08em; color: #78716c; }
  .rows { margin-top: 8px; border-top: 1px solid #e7e5e4; }
  .row { display: flex; justify-content: space-between; gap: 16px;
         padding: 10px 0; border-bottom: 1px solid #f5f5f4; }
  .row span { color: #57534e; }
  .row strong { font-variant-numeric: tabular-nums; }
  .row.paid, .row.due, .row.over { font-weight: 600; }
  .row.paid span, .row.due span, .row.over span { color: #1c1917; }
  .row.paid strong { color: #15803d; }
  .row.due strong { color: #b45309; }
  .row.over strong { color: #be123c; }
  .sign { display: flex; justify-content: space-between; gap: 32px;
          margin-top: 48px; }
  .sign div { flex: 1; border-top: 1px solid #d6d3d1; padding-top: 6px;
              font-size: 12px; color: #78716c; }
  .actions { max-width: 640px; margin: 0 auto 16px; text-align: right; }
  .actions button {
    padding: 8px 16px; font: inherit; font-weight: 500; color: #fff;
    background: #7f1d1d; border: 0; border-radius: 6px; cursor: pointer;
  }
  @page { margin: 16mm; }
  @media print {
    body { padding: 0; background: #fff; }
    .sheet { max-width: none; padding: 0; border: 0; border-radius: 0; }
    .actions { display: none; }
  }
</style>
</head>
<body>
  <div class="actions"><button type="button" onclick="window.print()">Print</button></div>
  <div class="sheet">
    <div class="shop">Moon Tailors &amp; Matching Center</div>
    <div class="title">Vendor statement</div>

    <div class="who">${esc(slip.vendor.name)}</div>
    <div class="meta">${meta}</div>

    <div class="month">${esc(monthLabel(slip.month))}</div>
    <div class="rows">${rows(monthRows)}</div>

    <div class="sign">
      <div>Received by</div>
      <div>Authorised by</div>
    </div>
  </div>
</body>
</html>`;
}

function monthLabel(month: string): string {
  const [year, index] = month.split("-").map(Number);
  if (!year || !index) return month;
  return new Date(Date.UTC(year, index - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function money(value: number): string {
  return `${CURRENCY} ${value.toLocaleString("en-GB", {
    maximumFractionDigits: 2,
  })}`;
}

/** Everything interpolated into the page is shop data — escape it all. */
function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
