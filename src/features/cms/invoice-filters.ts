import { z } from "zod";
import { isCalendarDate } from "@/features/cms/fields";
import type { InvoiceFilters } from "@/lib/cms";

export function parseInvoiceFilters(params: { client?: string; from?: string; to?: string; status?: string }) {
  const error = (params.from && !isCalendarDate(params.from)) || (params.to && !isCalendarDate(params.to))
    ? "Choose valid dates."
    : params.from && params.to && params.from > params.to ? "The From date must be before or equal to the To date." : "";
  const filters: InvoiceFilters = {
    client: z.uuid().safeParse(params.client).success ? params.client : undefined,
    from: params.from && isCalendarDate(params.from) ? params.from : undefined,
    to: params.to && isCalendarDate(params.to) ? params.to : undefined,
    status: params.status === "void" ? "void" : "issued",
  };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  return { filters, error, query: query.toString() };
}
