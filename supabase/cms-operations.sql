-- Upgrade an existing CMS. Also appended to cms-schema.sql for fresh installs.
-- Existing order amounts/payments are preserved; the new UI does not use them.
begin;

alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'in_progress', 'ready', 'completed', 'delivered', 'cancelled'));

create or replace function public.cms_valid_order_items(entries jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare entry jsonb;
begin
  if jsonb_typeof(entries) <> 'array' or jsonb_array_length(entries) > 100 then return false; end if;
  for entry in select value from jsonb_array_elements(entries) loop
    if not (entry ?& array['id','name','quantity','status','notes']) then return false; end if;
    if jsonb_typeof(entry->'id') <> 'string' or jsonb_typeof(entry->'quantity') <> 'number' or jsonb_typeof(entry->'status') <> 'string' then return false; end if;
    if jsonb_typeof(entry->'name') <> 'string' or char_length(btrim(entry->>'name')) not between 1 and 200
      or jsonb_typeof(entry->'notes') <> 'string' or char_length(entry->>'notes') > 1000
      or (entry->>'quantity') !~ '^[0-9]+$' or (entry->>'quantity')::bigint not between 1 and 10000
      or (entry->>'status') not in ('pending','in_progress','ready','completed','delivered','cancelled')
      or (entry->>'id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;
alter table public.orders drop constraint if exists orders_items_check;
alter table public.orders add constraint orders_items_check check (public.cms_valid_order_items(items));

alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check check (char_length(btrim(category)) between 1 and 80);

create table if not exists public.balance_entries (
  id uuid primary key default gen_random_uuid(),
  received_on date not null default (now() at time zone 'Asia/Karachi')::date,
  amount bigint not null check (amount between 1 and 999999999999),
  note text not null check (char_length(btrim(note)) between 2 and 400),
  created_at timestamptz not null default now()
);

create table if not exists public.labour_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 140),
  period date not null check (extract(day from period) = 1),
  paid_on date not null default (now() at time zone 'Asia/Karachi')::date,
  salary bigint not null check (salary between 0 and 999999999999),
  total_amount bigint not null check (total_amount between 0 and 999999999999),
  advance bigint not null default 0 check (advance between 0 and 999999999999),
  salary_paid bigint not null default 0 check (salary_paid between 0 and 999999999999),
  leaves integer not null default 0 check (leaves between 0 and 31),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (advance + salary_paid <= total_amount)
);

-- Labour payslip inputs. Existing entries remain monthly salary workers.
alter table public.labour_entries add column if not exists per_day_salary bigint not null default 0
  check (per_day_salary between 0 and 999999999999);
alter table public.labour_entries add column if not exists ot_hours integer not null default 0
  check (ot_hours between 0 and 1000);
alter table public.labour_entries add column if not exists ot_rate bigint not null default 0
  check (ot_rate between 0 and 999999999999);
alter table public.labour_entries add column if not exists deduction bigint not null default 0
  check (deduction between 0 and 999999999999);
alter table public.labour_entries add column if not exists pay_basis text not null default 'monthly';
alter table public.labour_entries add column if not exists days_worked integer not null default 0;
alter table public.labour_entries add column if not exists item_count integer not null default 0;
alter table public.labour_entries add column if not exists item_rate bigint not null default 0;
alter table public.labour_entries drop constraint if exists labour_entries_pay_basis_check;
alter table public.labour_entries add constraint labour_entries_pay_basis_check
  check (pay_basis in ('monthly', 'daily', 'per_item'));
alter table public.labour_entries drop constraint if exists labour_entries_basis_amounts_check;
alter table public.labour_entries add constraint labour_entries_basis_amounts_check check (
  days_worked between 0 and 31
  and item_count between 0 and 1000000
  and item_rate between 0 and 999999999999
  and (
    (pay_basis = 'monthly' and days_worked = 0 and item_count = 0 and item_rate = 0)
    or (pay_basis = 'daily' and salary = 0 and leaves = 0 and item_count = 0 and item_rate = 0)
    or (pay_basis = 'per_item' and salary = 0 and per_day_salary = 0 and leaves = 0 and days_worked = 0)
  )
);
alter table public.labour_entries drop constraint if exists labour_entries_check;
alter table public.labour_entries drop constraint if exists labour_entries_total_amount_check;
alter table public.labour_entries add constraint labour_entries_total_amount_check
  check (total_amount between -999999999999 and 999999999999);

-- Validates the lines and computes the stored bigint total in one atomic write.
create or replace function public.cms_invoice_total(entries jsonb)
returns bigint language plpgsql immutable security invoker set search_path = '' as $$
declare entry jsonb; total bigint := 0;
begin
  if jsonb_typeof(entries) <> 'array' or jsonb_array_length(entries) not between 1 and 100 then
    raise exception 'Invalid invoice items';
  end if;
  for entry in select value from jsonb_array_elements(entries) loop
    if not (entry ?& array['id','item','quantity','amount','source']) then raise exception 'Invalid invoice item'; end if;
    if jsonb_typeof(entry->'id') <> 'string' or jsonb_typeof(entry->'quantity') <> 'number' or jsonb_typeof(entry->'amount') <> 'number' then raise exception 'Invalid invoice item'; end if;
    if jsonb_typeof(entry->'item') <> 'string' or char_length(btrim(entry->>'item')) not between 1 and 200
      or jsonb_typeof(entry->'source') <> 'string' or char_length(btrim(entry->>'source')) not between 1 and 80
      or (entry->>'quantity') !~ '^[0-9]+$' or (entry->>'quantity')::bigint not between 1 and 10000
      or (entry->>'amount') !~ '^[0-9]+$' or (entry->>'amount')::bigint not between 0 and 999999999999
      or (entry->>'id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then raise exception 'Invalid invoice item'; end if;
    total := total + (entry->>'amount')::bigint * (entry->>'quantity')::bigint;
  end loop;
  if total not between 1 and 999999999999 then raise exception 'Invalid invoice total'; end if;
  return total;
end;
$$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no bigint generated always as identity unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  client_name text not null check (char_length(btrim(client_name)) between 2 and 140),
  client_address text check (char_length(client_address) <= 400),
  client_phone text check (char_length(client_phone) <= 30),
  issued_on date not null default (now() at time zone 'Asia/Karachi')::date,
  items jsonb not null,
  total_amount bigint generated always as (public.cms_invoice_total(items)) stored,
  notes text check (char_length(notes) <= 2000),
  status text not null default 'issued' check (status in ('issued','void')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists balance_entries_date_idx on public.balance_entries (received_on desc, id);
create index if not exists labour_entries_period_idx on public.labour_entries (period, name, id);
create index if not exists labour_entries_paid_idx on public.labour_entries (paid_on);
create index if not exists invoices_client_date_idx on public.invoices (client_id, issued_on desc, id);
create index if not exists invoices_date_idx on public.invoices (issued_on desc, id);

drop trigger if exists labour_entries_updated_at on public.labour_entries;
create trigger labour_entries_updated_at before update on public.labour_entries for each row execute function public.set_updated_at();
drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();

alter table public.balance_entries enable row level security;
alter table public.labour_entries enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "Admins manage balances" on public.balance_entries;
create policy "Admins manage balances" on public.balance_entries for all to authenticated
using (coalesce((select auth.jwt()->'app_metadata'->>'role'), '') = 'admin')
with check (coalesce((select auth.jwt()->'app_metadata'->>'role'), '') = 'admin');
drop policy if exists "Admins manage labour" on public.labour_entries;
create policy "Admins manage labour" on public.labour_entries for all to authenticated
using (coalesce((select auth.jwt()->'app_metadata'->>'role'), '') = 'admin')
with check (coalesce((select auth.jwt()->'app_metadata'->>'role'), '') = 'admin');
drop policy if exists "Admins manage invoices" on public.invoices;
create policy "Admins manage invoices" on public.invoices for all to authenticated
using (coalesce((select auth.jwt()->'app_metadata'->>'role'), '') = 'admin')
with check (coalesce((select auth.jwt()->'app_metadata'->>'role'), '') = 'admin');

grant select, insert, update, delete on public.balance_entries, public.labour_entries, public.invoices to authenticated;
grant usage, select on sequence public.invoices_invoice_no_seq to authenticated;
revoke all on function public.cms_invoice_total(jsonb), public.cms_valid_order_items(jsonb) from public, anon;
grant execute on function public.cms_invoice_total(jsonb), public.cms_valid_order_items(jsonb) to authenticated, service_role;

-- SQL sums cover every record, independent of the API's row limit. Return text
-- so arbitrarily large all-time values survive JSON without precision loss.
create or replace function public.cms_financial_totals()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'added', (select coalesce(sum(amount),0)::text from public.balance_entries),
    'expenses', (select coalesce(sum(amount),0)::text from public.expenses),
    'labourPaid', (select coalesce(sum(advance + salary_paid),0)::text from public.labour_entries),
    'sales', (select coalesce(sum(total_amount),0)::text from public.invoices where status = 'issued'),
    'openOrders', (select count(*) from public.orders where status in ('pending','in_progress','ready'))
  );
$$;
revoke all on function public.cms_financial_totals() from public, anon;
grant execute on function public.cms_financial_totals() to authenticated;

notify pgrst, 'reload schema';
commit;
