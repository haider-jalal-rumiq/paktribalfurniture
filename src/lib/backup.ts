import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readAll } from "@/lib/cms-read";
import type { Database } from "@/types/database";

// Every table holding business records. A table missing here is a table the
// weekly export silently loses, so add new ones the moment they are created.
const TABLES = ["clients", "orders", "order_payments", "expenses", "balance_entries",
  "labour_entries", "wood_entries", "invoices", "shop_sales", "shop_invoices", "shop_expenses"] as const;
export interface BackupBundle {
  exportedAt: string;
  /** 4 adds the factory wood purchaser ledger. */
  version: 4;
  clients: unknown[];
  orders: unknown[];
  order_payments: unknown[];
  expenses: unknown[];
  balance_entries: unknown[];
  labour_entries: unknown[];
  wood_entries: unknown[];
  invoices: unknown[];
  shop_sales: unknown[];
  shop_invoices: unknown[];
  shop_expenses: unknown[];
}
export async function buildBackup(supabase: SupabaseClient<Database>): Promise<BackupBundle | { error: string }> {
  const results = await Promise.all(TABLES.map(async (table) => {
    const rows = await readAll((from, to) => supabase.from(table).select("*").order("created_at").order("id").range(from, to));
    return [table, rows] as const;
  }));
  if (results.some(([, rows]) => rows === null)) return { error: "The export could not be built. Please try again." };
  return { exportedAt: new Date().toISOString(), version: 4, ...Object.fromEntries(results) } as BackupBundle;
}
