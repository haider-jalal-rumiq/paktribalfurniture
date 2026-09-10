import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readAll } from "@/lib/cms-read";
import type { Database } from "@/types/database";

const TABLES = ["clients", "orders", "order_payments", "expenses", "balance_entries", "labour_entries", "invoices"] as const;
export interface BackupBundle {
  exportedAt: string;
  version: 2;
  clients: unknown[];
  orders: unknown[];
  order_payments: unknown[];
  expenses: unknown[];
  balance_entries: unknown[];
  labour_entries: unknown[];
  invoices: unknown[];
}
export async function buildBackup(supabase: SupabaseClient<Database>): Promise<BackupBundle | { error: string }> {
  const results = await Promise.all(TABLES.map(async (table) => {
    const rows = await readAll((from, to) => supabase.from(table).select("*").order("created_at").order("id").range(from, to));
    return [table, rows] as const;
  }));
  if (results.some(([, rows]) => rows === null)) return { error: "The export could not be built. Please try again." };
  return { exportedAt: new Date().toISOString(), version: 2, ...Object.fromEntries(results) } as BackupBundle;
}
