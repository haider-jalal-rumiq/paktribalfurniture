import { Container } from "@/components/layout/container";
import { AdminLoginForm } from "@/features/auth/admin-login-form";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default async function StudioLoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const configured = hasSupabaseEnv();
  return (
    <div className="min-h-screen pb-20 pt-32 sm:pt-40">
      <Container className="max-w-xl">
        <div className="border border-hairline bg-surface p-7 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Private catalogue tools</p>
          <h1 className="mt-4 font-display text-5xl leading-none text-ink">PTF Studio</h1>
          <p className="mt-4 text-sm leading-6 text-muted">Sign in with the administrator account configured in Supabase.</p>
          {!configured ? <p role="alert" className="mt-7 border border-accent/30 bg-accent/8 p-4 text-sm leading-6 text-accent-deep">Supabase environment variables are not configured. Follow the setup guide in the project README before signing in.</p> : <div className="mt-8"><AdminLoginForm redirectTo="/studio" /></div>}
          {reason === "access" && <p role="alert" className="mt-5 text-sm text-accent-deep">This account does not have the required admin role.</p>}
        </div>
      </Container>
    </div>
  );
}
