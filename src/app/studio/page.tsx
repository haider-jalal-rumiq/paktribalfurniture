import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { StudioSignOut } from "@/features/studio/studio-sign-out";
import { getStudioInquiries, getStudioProducts } from "@/lib/catalog";
import { hasSupabaseEnv } from "@/lib/supabase/config";

const dateFormatter = new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" });

export default async function StudioPage() {
  const configured = hasSupabaseEnv();
  const [products, inquiries] = configured ? await Promise.all([getStudioProducts(), getStudioInquiries()]) : [[], []];
  return (
    <div className="pb-24 pt-32 sm:pt-36">
      <Container>
        <div className="flex flex-col gap-5 border-b border-hairline pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Private catalogue tools</p><h1 className="mt-3 font-display text-5xl leading-none text-ink sm:text-6xl">PTF Studio</h1></div>
          <div className="flex flex-wrap items-center gap-5"><StudioSignOut /><ButtonLink href="/studio/products/new"><Plus className="h-4 w-4" aria-hidden="true" />Add product</ButtonLink></div>
        </div>

        {!configured && <section className="mt-10 border border-accent/30 bg-accent/8 p-6"><h2 className="font-display text-3xl text-ink">Connect Supabase to begin</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">Apply the included database schema, add the environment variables, and assign the admin role to your Supabase Auth user. The full checklist is in README.md.</p></section>}

        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-4"><h2 className="font-display text-4xl text-ink">Products</h2><span className="text-sm text-muted">{products.length} total</span></div>
          {products.length ? <div className="mt-6 divide-y divide-hairline border-y border-hairline">{products.map((product) => <Link key={product.id} href={`/studio/products/${product.id}`} className="grid gap-2 py-5 transition-colors hover:bg-wash sm:grid-cols-[1fr_0.8fr_auto] sm:items-center sm:px-3"><div><h3 className="font-display text-2xl text-ink">{product.name}</h3><p className="mt-1 text-xs text-muted">/{product.slug}</p></div><p className="text-sm text-ink-soft">{product.published ? "Published" : "Draft"}{product.featured ? " · Featured" : ""}</p><ArrowUpRight className="h-5 w-5 text-accent" aria-hidden="true" /></Link>)}</div> : <div className="mt-6 border border-hairline bg-surface p-6 text-sm text-muted">No products yet. Add the first piece when Supabase is connected.</div>}
        </section>

        <section className="mt-16">
          <div className="flex items-baseline justify-between gap-4"><h2 className="font-display text-4xl text-ink">Recent enquiries</h2><span className="text-sm text-muted">Latest 50</span></div>
          {inquiries.length ? <div className="mt-6 overflow-x-auto border border-hairline bg-surface"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-hairline bg-canvas-deep text-xs uppercase tracking-[0.12em] text-muted"><tr><th className="p-4">Customer</th><th className="p-4">Furniture</th><th className="p-4">Message</th><th className="p-4">Received</th></tr></thead><tbody className="divide-y divide-hairline">{inquiries.map((inquiry) => <tr key={inquiry.id} className="align-top"><td className="p-4"><p className="font-semibold text-ink">{inquiry.name}</p><a href={`tel:${inquiry.phone}`} className="mt-1 block text-accent">{inquiry.phone}</a>{inquiry.city && <p className="mt-1 text-xs text-muted">{inquiry.city}</p>}</td><td className="p-4 text-ink-soft">{inquiry.product_name ?? inquiry.category_slug ?? "General enquiry"}{inquiry.wood_type && <p className="mt-1 text-xs text-muted">{inquiry.wood_type}</p>}</td><td className="max-w-md p-4 leading-6 text-ink-soft">{inquiry.message}</td><td className="p-4 whitespace-nowrap text-muted">{dateFormatter.format(new Date(inquiry.created_at))}</td></tr>)}</tbody></table></div> : <div className="mt-6 border border-hairline bg-surface p-6 text-sm text-muted">Saved customer enquiries will appear here.</div>}
        </section>
      </Container>
    </div>
  );
}
