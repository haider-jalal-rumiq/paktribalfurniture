import { Container } from "@/components/layout/container";
import { AdminLoginForm } from "@/features/auth/admin-login-form";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Sign in" };

export default async function CmsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const configured = hasSupabaseEnv();

  return (
    <div className="flex min-h-[100dvh] items-center py-16">
      <Container className="max-w-md">
        <div className="border border-hairline bg-surface p-7 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Pak Tribal Furniture
          </p>
          <h1 className="mt-3 font-display text-4xl leading-none text-ink">Orders &amp; accounts</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Sign in with the administrator account.
          </p>

          {configured ? (
            <AdminLoginForm redirectTo="/cms" />
          ) : (
            <p
              role="alert"
              className="mt-7 border border-accent/30 bg-accent/8 p-4 text-sm leading-6 text-accent-deep"
            >
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
      </Container>
    </div>
  );
}
