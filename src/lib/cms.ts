import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { openOrderStatuses } from "@/content/cms";
import { claimsAreAdmin } from "@/lib/auth";
import { URGENT_WITHIN_DAYS, addDays, monthRange, today } from "@/lib/cms-core";
import { readAll } from "@/lib/cms-read";
import { availableCredit } from "@/lib/accounting-core";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Client, Database, Expense, Order, Invoice, BalanceEntry, LabourEntry, ShopSale, ShopInvoice, ShopExpense, InventoryItem } from "@/types/database";

export async function getCmsSession(): Promise<{ supabase: SupabaseClient<Database>; userId: string } | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  if (error || !claimsAreAdmin(claims) || typeof claims?.sub !== "string") return null;
  return { supabase, userId: claims.sub };
}

export type OrderWithClient = Order & { clients: Pick<Client, "id" | "name" | "type"> | null };
export type OrderDetail = Order & { clients: Client | null };
const ORDER_LIST_SELECT = "*, clients(id, name, type)";

export async function getClients(): Promise<Client[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return await readAll((from, to) => supabase.from("clients").select("*").order("name").order("id").range(from, to)) ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) { console.error("Could not load client", { code: error.code, message: error.message }); return null; }
  return data;
}

export async function getOrders(filters: { status?: string; clientId?: string; urgentOnly?: boolean } = {}): Promise<OrderWithClient[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const data = await readAll((from, to) => {
    let query = supabase.from("orders").select(ORDER_LIST_SELECT);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.clientId) query = query.eq("client_id", filters.clientId);
    if (filters.urgentOnly) query = query.eq("urgent", true);
    return query.order("order_no", { ascending: true }).order("id").range(from, to);
  });
  return (data ?? []) as OrderWithClient[];
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("orders").select("*, clients(*)").eq("id", id).maybeSingle();
  if (error) { console.error("Could not load order", { code: error.code, message: error.message }); return null; }
  return data as OrderDetail | null;
}

export async function getDueSoon(days = 7): Promise<OrderWithClient[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const data = await readAll((from, to) => supabase.from("orders").select(ORDER_LIST_SELECT)
    .in("status", [...openOrderStatuses]).not("expected_date", "is", null)
    .lte("expected_date", addDays(today(), days)).order("expected_date").order("id").range(from, to));
  return (data ?? []) as OrderWithClient[];
}

/** Ticked by hand, or open and within two days of delivery. Soonest first. */
/** Every order once, for the dashboard's counts. Small business, small table. */
export async function getAllOrders(): Promise<OrderWithClient[]> {
  return getOrders();
}

export async function getUrgentOrders(): Promise<OrderWithClient[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const cutoff = addDays(today(), URGENT_WITHIN_DAYS);
  const data = await readAll((from, to) => supabase.from("orders").select(ORDER_LIST_SELECT)
    .in("status", [...openOrderStatuses])
    .or(`urgent.eq.true,expected_date.lte.${cutoff}`)
    .order("expected_date", { ascending: true, nullsFirst: false }).order("id").range(from, to));
  return (data ?? []) as OrderWithClient[];
}

export async function getExpenses(month: string): Promise<Expense[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { start, end } = monthRange(month);
  return await readAll((from, to) => supabase.from("expenses").select("*").gte("spent_on", start).lt("spent_on", end)
    .order("spent_on", { ascending: false }).order("id").range(from, to)) ?? [];
}

export type InvoiceFilters = { client?: string; from?: string; to?: string; status?: "issued" | "void" };
export async function getInvoices(filters: InvoiceFilters = {}): Promise<Invoice[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return await readAll((from, to) => {
    let query = supabase.from("invoices").select("*");
    if (filters.client) query = query.eq("client_id", filters.client);
    if (filters.from) query = query.gte("issued_on", filters.from);
    if (filters.to) query = query.lte("issued_on", filters.to);
    if (filters.status) query = query.eq("status", filters.status);
    return query.order("issued_on", { ascending: false }).order("invoice_no", { ascending: false }).range(from, to);
  }) ?? [];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
  if (error) { console.error("Could not load invoice", { code: error.code, message: error.message }); return null; }
  return data;
}

export async function getBalanceEntries(): Promise<BalanceEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return await readAll((from, to) => supabase.from("balance_entries").select("*")
    .order("received_on", { ascending: false }).order("id").range(from, to)) ?? [];
}

export async function getLabourEntries(month: string, byPaymentDate = false): Promise<LabourEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { start, end } = monthRange(month);
  const field = byPaymentDate ? "paid_on" : "period";
  return await readAll((from, to) => supabase.from("labour_entries").select("*").gte(field, start).lt(field, end)
    .order("name").order("id").range(from, to)) ?? [];
}

/** Every salary month that has entries, newest first, for the month picker. */
export async function getLabourMonths(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const rows = await readAll<{ period: string }>((from, to) => supabase.from("labour_entries")
    .select("period").order("period", { ascending: false }).range(from, to));
  return [...new Set((rows ?? []).map((row) => row.period.slice(0, 7)))];
}

export async function getLabourEntry(id: string): Promise<LabourEntry | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("labour_entries").select("*").eq("id", id).maybeSingle();
  if (error) { console.error("Could not load labour entry", { code: error.code, message: error.message }); return null; }
  return data;
}

/** The whole shop ledger. Newest first; the printed serial is sale_no, not the row index. */
export async function getShopSales(): Promise<ShopSale[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return await readAll((from, to) => supabase.from("shop_sales").select("*")
    .order("sold_on", { ascending: false }).order("sale_no", { ascending: false }).range(from, to)) ?? [];
}

/** The shop's own expenses. The factory's live in public.expenses. */
export async function getShopExpenses(): Promise<ShopExpense[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return await readAll((from, to) => supabase.from("shop_expenses").select("*")
    .order("spent_on", { ascending: false }).order("id").range(from, to)) ?? [];
}

export async function getShopInvoices(): Promise<ShopInvoice[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return await readAll((from, to) => supabase.from("shop_invoices").select("*")
    .order("issued_on", { ascending: false }).order("invoice_no", { ascending: false }).range(from, to)) ?? [];
}

export async function getShopInvoice(id: string): Promise<ShopInvoice | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("shop_invoices").select("*").eq("id", id).maybeSingle();
  if (error) { console.error("Could not load shop invoice", { code: error.code, message: error.message }); return null; }
  return data;
}

export async function getInventory(): Promise<InventoryItem[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return await readAll((from, to) => supabase.from("inventory_items").select("*")
    .order("item_no").range(from, to)) ?? [];
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("inventory_items").select("*").eq("id", id).maybeSingle();
  if (error) { console.error("Could not load inventory item", { code: error.code, message: error.message }); return null; }
  return data;
}

/** Drives the dashboard warning; empty when the inventory table is absent. */
export async function getOutOfStock(): Promise<InventoryItem[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  return await readAll((from, to) => supabase.from("inventory_items").select("*")
    .eq("quantity", 0).order("name").range(from, to)) ?? [];
}

export async function getFinancialTotals() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("cms_financial_totals");
  if (error || !data) {
    console.error("Could not load financial totals", { code: error?.code, message: error?.message });
    return null;
  }
  const values = data as { added: string; expenses: string; labourPaid: string; sales: string; openOrders: number };
  const added = BigInt(values.added), expenses = BigInt(values.expenses), labourPaid = BigInt(values.labourPaid);
  return { added, expenses: expenses + labourPaid, credit: availableCredit(added, expenses, labourPaid), sales: BigInt(values.sales), openOrders: values.openOrders };
}

export * from "@/lib/cms-core";
