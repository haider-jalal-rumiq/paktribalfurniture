import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { claimsAreAdmin } from "@/lib/auth";
import {
  addDays,
  monthRange,
  orderBalance,
  today,
} from "@/lib/cms-core";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Client, Database, Expense, Order, OrderPayment } from "@/types/database";

/** The /cms twin of getStudioSession(). Every /api/cms route starts here. */
export async function getCmsSession(): Promise<{ supabase: SupabaseClient<Database>; userId: string } | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  if (error || !claimsAreAdmin(claims) || typeof claims?.sub !== "string") return null;
  return { supabase, userId: claims.sub };
}

export type OrderWithClient = Order & {
  clients: Pick<Client, "id" | "name" | "type"> | null;
  order_payments: Pick<OrderPayment, "amount">[];
};

export type OrderDetail = Order & {
  clients: Client | null;
  order_payments: OrderPayment[];
};

const ORDER_LIST_SELECT = "*, clients(id, name, type), order_payments(amount)";
const ORDER_DETAIL_SELECT = "*, clients(*), order_payments(*)";

export async function getClients(): Promise<Client[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) {
    console.error("Could not load clients", { code: error.code, message: error.message });
    return [];
  }
  return data;
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Could not load client", { code: error.code, message: error.message });
    return null;
  }
  return data;
}

export async function getOrders(filters: { status?: string; clientId?: string } = {}): Promise<OrderWithClient[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase.from("orders").select(ORDER_LIST_SELECT);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);

  const { data, error } = await query
    .order("expected_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load orders", { code: error.code, message: error.message });
    return [];
  }
  return data as unknown as OrderWithClient[];
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("orders").select(ORDER_DETAIL_SELECT).eq("id", id).maybeSingle();
  if (error) {
    console.error("Could not load order", { code: error.code, message: error.message });
    return null;
  }
  return data as unknown as OrderDetail | null;
}

/**
 * Orders due within `days`, plus anything already overdue. This is the in-app
 * half of the reminder — it works whether or not push is permitted.
 */
export async function getDueSoon(days = 7): Promise<OrderWithClient[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const horizon = addDays(today(), days);

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
    .in("status", ["pending", "in_progress", "ready"])
    .not("expected_date", "is", null)
    .lte("expected_date", horizon)
    .order("expected_date", { ascending: true });

  if (error) {
    console.error("Could not load due orders", { code: error.code, message: error.message });
    return [];
  }
  return data as unknown as OrderWithClient[];
}

export async function getExpenses(month: string): Promise<Expense[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("spent_on", start)
    .lt("spent_on", end)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load expenses", { code: error.code, message: error.message });
    return [];
  }
  return data;
}

/** Totals for the whole open book, used by the dashboard tiles. */
export async function getOutstanding(): Promise<{ billed: number; received: number; outstanding: number; openOrders: number }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { billed: 0, received: 0, outstanding: 0, openOrders: 0 };

  const { data, error } = await supabase
    .from("orders")
    .select("total_amount, order_payments(amount)")
    .in("status", ["pending", "in_progress", "ready"]);

  if (error) {
    console.error("Could not load outstanding totals", { code: error.code, message: error.message });
    return { billed: 0, received: 0, outstanding: 0, openOrders: 0 };
  }

  const rows = data as unknown as { total_amount: number; order_payments: { amount: number }[] }[];
  return rows.reduce(
    (totals, row) => {
      const { total, paid } = orderBalance(row);
      return {
        billed: totals.billed + total,
        received: totals.received + paid,
        outstanding: totals.outstanding + (total - paid),
        openOrders: totals.openOrders + 1,
      };
    },
    { billed: 0, received: 0, outstanding: 0, openOrders: 0 },
  );
}

export * from "@/lib/cms-core";
