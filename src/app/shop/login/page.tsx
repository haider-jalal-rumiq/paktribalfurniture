import Image from "next/image";

import { AdminLoginForm } from "@/features/auth/admin-login-form";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Sign in" };

export default async function ShopLoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const configured = hasSupabaseEnv();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Image src="/icons/icon-192.png" alt="" width={64} height={64} className="rounded-2xl shadow-[var(--shadow-card)]" priority />
          <h1 className="mt-5 font-display text-4xl leading-none text-ink">PTF Shop</h1>
          <p className="mt-2 text-sm text-muted">Counter sales, profit and invoices.</p>
        </div>

        <div className="mt-7 rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[var(--shadow-raised)]">
          {configured ? (
            <AdminLoginForm redirectTo="/shop" />
          ) : (
            <p role="alert" className="text-sm leading-6 text-accent-deep">
              Supabase environment variables are not configured for this deployment. Follow the CMS
              setup checklist in README.md.
            </p>
          )}
          {reason === "access" && (
            <p role="alert" className="mt-5 text-sm text-accent-deep">
              This account does not have the required admin role.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">Pak Tribal Furniture · Islamabad</p>
      </div>
    </div>
  );
}
