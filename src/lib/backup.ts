import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export interface BackupBundle {
  exportedAt: string;
  version: 1;
  clients: unknown[];
  orders: unknown[];
  order_payments: unknown[];
  expenses: unknown[];
}

/** One JSON object holding every business row. Small enough to keep in memory. */
export async function buildBackup(
  supabase: SupabaseClient<Database>,
): Promise<BackupBundle | { error: string }> {
  const [clients, orders, payments, expenses] = await Promise.all([
    supabase.from("clients").select("*").order("created_at"),
    supabase.from("orders").select("*").order("created_at"),
    supabase.from("order_payments").select("*").order("created_at"),
    supabase.from("expenses").select("*").order("created_at"),
  ]);

  const failed = [clients, orders, payments, expenses].find((result) => result.error);
  if (failed?.error) {
    console.error("Backup failed", { code: failed.error.code, message: failed.error.message });
    return { error: "The export could not be built." };
  }

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    clients: clients.data ?? [],
    orders: orders.data ?? [],
    order_payments: payments.data ?? [],
    expenses: expenses.data ?? [],
  };
}
