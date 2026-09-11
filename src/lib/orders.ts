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
