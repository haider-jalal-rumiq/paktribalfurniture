import { openOrderStatuses } from "@/content/cms";
import { isDueUrgently } from "@/lib/cms-core";

/**
 * Urgent is either ticked by hand or earned by the calendar: an open order
 * within two days of its delivery date is urgent whether or not anyone
 * remembered to tick it. Derived rather than written to the row, so it is
 * always right today and needs no scheduled job to keep it true.
 */
export function isUrgentOrder(order: { urgent: boolean; expected_date: string | null; status: string }): boolean {
  if (order.urgent) return true;
  return (openOrderStatuses as readonly string[]).includes(order.status) && isDueUrgently(order.expected_date);
}

/**
 * The orders page has two views with different status semantics: grouped view
 * filters the order status, while item view filters each item's own status.
 * Client and urgency are order-level in both views.
 */
export function orderMatchesFilters(
  order: { client_id: string; urgent: boolean; expected_date: string | null; status: string },
  filters: { clientId?: string; status?: string; byItems: boolean },
): boolean {
  if (filters.clientId && order.client_id !== filters.clientId) return false;
  if (filters.status === "urgent") return isUrgentOrder(order);
  return filters.byItems || !filters.status || order.status === filters.status;
}

/** Normal statuses target the item in item view; urgent already matched its order. */
export function itemMatchesStatus(item: { status: string }, status?: string): boolean {
  return !status || status === "urgent" || item.status === status;
}
