"use client";
import { Field, Select } from "@/components/ui/field";

export type MonthOption = { value: string; label: string; from: string; to: string };

/**
 * A month shortcut over the From/To dates rather than a filter of its own:
 * choosing one fills those two fields and submits. The URL stays a plain date
 * range, so the print report and every existing link keep working, and there
 * is only ever one source of truth for which invoices are shown.
 */
export function InvoiceMonthFilter({ months, selected }: { months: MonthOption[]; selected?: string }) {
  return (
    <Field label="Month" htmlFor="invoiceMonth" hint="Sets the dates beside it.">
      <Select
        id="invoiceMonth"
        defaultValue={selected ?? ""}
        onChange={(event) => {
          const form = event.currentTarget.form;
          if (!form) return;
          const month = months.find((option) => option.value === event.currentTarget.value);
          const from = form.elements.namedItem("from");
          const to = form.elements.namedItem("to");
          if (!(from instanceof HTMLInputElement) || !(to instanceof HTMLInputElement)) return;
          from.value = month?.from ?? "";
          to.value = month?.to ?? "";
          form.requestSubmit();
        }}
      >
        <option value="">All months</option>
        {months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
      </Select>
    </Field>
  );
}
