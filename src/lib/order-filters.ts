/**
 * Client and urgency are order-level filters in both order views. A normal
 * status belongs to the order in grouped view and to the item in item view.
 */
export function orderMatchesFilters(
  order: { client_id: string; status: string },
  filters: { clientId?: string; status?: string; byItems: boolean },
  urgent: boolean,
): boolean {
  if (filters.clientId && order.client_id !== filters.clientId) return false;
  if (filters.status === "urgent") return urgent;
  return filters.byItems || !filters.status || order.status === filters.status;
}

/** Normal statuses target the item in item view; urgent already matched its order. */
export function itemMatchesStatus(item: { status: string }, status?: string): boolean {
  return !status || status === "urgent" || item.status === status;
}
