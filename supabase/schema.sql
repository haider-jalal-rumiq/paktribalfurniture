create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 140),
  category_slug text not null check (category_slug in (
    'beds', 'sofas', 'chairs-study-tables', 'dining-tables',
    'mirrors-lamps-decor', 'chests-consoles-side-tables',
    'tv-consoles-shoe-racks-bookshelves', 'custom-furniture'
  )),
  short_description text not null check (char_length(short_description) between 10 and 220),
  description text not null default '' check (char_length(description) <= 4000),
  wood_types text[] not null default '{}'::text[] check (
    wood_types <@ array['rosewood', 'cedar', 'pine', 'mango', 'walnut']::text[]
  ),
  dimensions text check (char_length(dimensions) <= 160),
  price_note text check (char_length(price_note) <= 120),
  image_urls text[] not null default '{}'::text[] check (cardinality(image_urls) <= 12),
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 7 and 30),
  city text check (char_length(city) <= 80),
  category_slug text check (category_slug is null or category_slug in (
    'beds', 'sofas', 'chairs-study-tables', 'dining-tables',
    'mirrors-lamps-decor', 'chests-consoles-side-tables',
    'tv-consoles-shoe-racks-bookshelves', 'custom-furniture'
  )),
  product_id uuid references public.products(id) on delete set null,
  product_name text check (char_length(product_name) <= 140),
  wood_type text check (wood_type is null or wood_type in ('rosewood', 'cedar', 'pine', 'mango', 'walnut')),
  message text not null check (char_length(message) between 10 and 1200),
  source_path text not null default '/contact' check (char_length(source_path) <= 200),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists products_catalog_idx on public.products (published, featured desc, created_at desc);
create index if not exists products_category_idx on public.products (category_slug) where published = true;
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists "Published products are public" on public.products;
create policy "Published products are public" on public.products for select to anon, authenticated
using (
  published = true or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
);

drop policy if exists "Admins create products" on public.products;
create policy "Admins create products" on public.products for insert to authenticated
with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

drop policy if exists "Admins update products" on public.products;
create policy "Admins update products" on public.products for update to authenticated
using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

drop policy if exists "Admins delete products" on public.products;
create policy "Admins delete products" on public.products for delete to authenticated
using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

drop policy if exists "Visitors create enquiries" on public.inquiries;
create policy "Visitors create enquiries" on public.inquiries for insert to anon, authenticated
with check (status = 'new');

drop policy if exists "Admins read enquiries" on public.inquiries;
create policy "Admins read enquiries" on public.inquiries for select to authenticated
using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

drop policy if exists "Admins update enquiries" on public.inquiries;
create policy "Admins update enquiries" on public.inquiries for update to authenticated
using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

drop policy if exists "Admins delete enquiries" on public.inquiries;
create policy "Admins delete enquiries" on public.inquiries for delete to authenticated
using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public product images are readable" on storage.objects;
create policy "Public product images are readable" on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
with check (bucket_id = 'product-images' and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
