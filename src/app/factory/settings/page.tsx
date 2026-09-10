import { Download, ExternalLink } from "lucide-react";

import { CmsPage } from "@/components/cms/cms-page";
import { AdminSignOut } from "@/features/auth/admin-sign-out";
import { PushToggle } from "@/features/cms/push-toggle";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <CmsPage title="Settings">
      <section className="mt-8">
        <h2 className="font-display text-3xl text-ink">Due-date notifications</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
          A notification goes out each morning for orders due in two days. The dashboard always
          lists them as well, so nothing depends on notifications getting through.
        </p>
        <div className="mt-4">
          {vapidPublicKey ? (
            <PushToggle vapidPublicKey={vapidPublicKey} />
          ) : (
            <p className="text-sm text-muted">
              Push keys are not configured for this deployment. Generate them with{" "}
              <code className="text-accent-deep">npx web-push generate-vapid-keys</code> and set{" "}
              <code className="text-accent-deep">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> and{" "}
              <code className="text-accent-deep">VAPID_PRIVATE_KEY</code>.
            </p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl text-ink">Backup</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
          Download clients, orders, invoices, balances, labour, expenses and legacy payments as one JSON file. A copy is also written
          to private storage each week. Neither survives losing the Supabase project itself — for
          that, turn on point-in-time recovery in the Supabase dashboard.
        </p>
        <a
          href="/api/cms/export"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-ui)] border border-hairline bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download a copy of everything
        </a>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl text-ink">Elsewhere</h2>
        <div className="mt-4 flex flex-col items-start gap-4">
          <a
            href="/studio"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Product catalogue (Studio)
          </a>
          <AdminSignOut redirectTo="/factory/login" />
        </div>
        {!hasSupabaseEnv() && (
          <p className="mt-6 text-sm text-muted">Supabase is not configured for this deployment.</p>
        )}
      </section>
    </CmsPage>
  );
}
