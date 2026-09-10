import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { openOrderStatuses } from "@/content/cms";
import { claimsAreAdmin } from "@/lib/auth";
import { addDays, monthRange, today } from "@/lib/cms-core";
import { readAll } from "@/lib/cms-read";
import { availableCredit } from "@/lib/accounting-core";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Client, Database, Expense, Order, Invoice, BalanceEntry, LabourEntry } from "@/types/database";

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

export async function getOrders(filters: { status?: string; clientId?: string } = {}): Promise<OrderWithClient[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const data = await readAll((from, to) => {
    let query = supabase.from("orders").select(ORDER_LIST_SELECT);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.clientId) query = query.eq("client_id", filters.clientId);
    return query.order("order_no", { ascending: false }).order("id").range(from, to);
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

export async function getLabourEntry(id: string): Promise<LabourEntry | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("labour_entries").select("*").eq("id", id).maybeSingle();
  if (error) { console.error("Could not load labour entry", { code: error.code, message: error.message }); return null; }
  return data;
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
