-- Enable extensions
create extension if not exists "pgcrypto";

-- =========================
-- ENUMS
-- =========================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
  end if;

  if not exists (select 1 from pg_type where typname = 'stock_movement_type') then
    create type stock_movement_type as enum ('purchase', 'usage', 'adjustment', 'return', 'waste');
  end if;
end $$;

-- =========================
-- UPDATED_AT TRIGGER
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- PROFILES
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  phone text,
  hourly_cost numeric(12,2) not null default 0 check (hourly_cost >= 0),
  currency text not null default 'EUR',
  locale text not null default 'es-ES',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- CLIENTS
-- =========================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  notes text,
  preferences text,
  alerts text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_user_name_idx on public.clients(user_id, full_name);
create index if not exists clients_user_phone_idx on public.clients(user_id, phone);

create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- =========================
-- SERVICES
-- =========================

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  description text,
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  estimated_minutes integer not null default 30 check (estimated_minutes > 0),
  estimated_labor_cost numeric(12,2) not null default 0 check (estimated_labor_cost >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_user_id_idx on public.services(user_id);
create index if not exists services_user_active_idx on public.services(user_id, is_active);
create index if not exists services_user_category_idx on public.services(user_id, category);

create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

-- =========================
-- PRODUCTS
-- =========================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  category text,
  sku text,
  unit text not null default 'ml',
  unit_cost numeric(12,4) not null default 0 check (unit_cost >= 0),
  current_stock numeric(12,3) not null default 0 check (current_stock >= 0),
  minimum_stock numeric(12,3) not null default 0 check (minimum_stock >= 0),
  supplier text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists products_user_name_idx on public.products(user_id, name);
create index if not exists products_user_low_stock_idx on public.products(user_id, current_stock, minimum_stock);
create unique index if not exists products_user_sku_unique_idx
on public.products(user_id, sku)
where sku is not null;

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- =========================
-- APPOINTMENTS
-- =========================

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'scheduled',
  title text,
  notes text,
  total_price numeric(12,2) not null default 0 check (total_price >= 0),
  total_cost numeric(12,2) not null default 0 check (total_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_valid_time check (ends_at > starts_at)
);

create index if not exists appointments_user_id_idx on public.appointments(user_id);
create index if not exists appointments_user_starts_at_idx on public.appointments(user_id, starts_at);
create index if not exists appointments_user_status_idx on public.appointments(user_id, status);
create index if not exists appointments_client_id_idx on public.appointments(client_id);

create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

-- =========================
-- APPOINTMENT SERVICES
-- =========================

create table if not exists public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  price_charged numeric(12,2) not null default 0 check (price_charged >= 0),
  minutes_spent integer not null default 0 check (minutes_spent >= 0),
  labor_cost numeric(12,2) not null default 0 check (labor_cost >= 0),
  product_cost numeric(12,2) not null default 0 check (product_cost >= 0),
  total_cost numeric(12,2) generated always as (labor_cost + product_cost) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointment_services_user_id_idx on public.appointment_services(user_id);
create index if not exists appointment_services_appointment_id_idx on public.appointment_services(appointment_id);
create index if not exists appointment_services_service_id_idx on public.appointment_services(service_id);

create trigger set_appointment_services_updated_at
before update on public.appointment_services
for each row execute function public.set_updated_at();

-- =========================
-- SERVICE PRODUCT USAGE
-- =========================

create table if not exists public.service_product_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_service_id uuid not null references public.appointment_services(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity_used numeric(12,3) not null check (quantity_used > 0),
  unit text not null,
  unit_cost_at_usage numeric(12,4) not null default 0 check (unit_cost_at_usage >= 0),
  total_cost numeric(12,2) generated always as (round((quantity_used * unit_cost_at_usage)::numeric, 2)) stored,
  created_at timestamptz not null default now()
);

create index if not exists service_product_usage_user_id_idx on public.service_product_usage(user_id);
create index if not exists service_product_usage_appointment_service_id_idx on public.service_product_usage(appointment_service_id);
create index if not exists service_product_usage_product_id_idx on public.service_product_usage(product_id);

-- =========================
-- STOCK MOVEMENTS
-- =========================

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type stock_movement_type not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost numeric(12,4) check (unit_cost is null or unit_cost >= 0),
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_user_id_idx on public.stock_movements(user_id);
create index if not exists stock_movements_product_id_idx on public.stock_movements(product_id);
create index if not exists stock_movements_user_created_at_idx on public.stock_movements(user_id, created_at);

-- =========================
-- TIME ENTRIES
-- =========================

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  appointment_service_id uuid references public.appointment_services(id) on delete cascade,
  description text,
  minutes_spent integer not null check (minutes_spent > 0),
  hourly_cost numeric(12,2) not null default 0 check (hourly_cost >= 0),
  total_cost numeric(12,2) generated always as (round(((minutes_spent::numeric / 60) * hourly_cost)::numeric, 2)) stored,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_user_id_idx on public.time_entries(user_id);
create index if not exists time_entries_user_entry_date_idx on public.time_entries(user_id, entry_date);

-- =========================
-- HELPER FUNCTIONS
-- =========================

create or replace function public.recalculate_appointment_service_cost(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_total numeric(12,2);
begin
  select coalesce(sum(total_cost), 0)
  into usage_total
  from public.service_product_usage
  where appointment_service_id = target_id;

  update public.appointment_services
  set product_cost = usage_total,
      updated_at = now()
  where id = target_id;
end;
$$;

create or replace function public.recalculate_appointment_totals(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.appointments
  set total_price = coalesce((
        select sum(price_charged)
        from public.appointment_services
        where appointment_id = target_id
      ), 0),
      total_cost = coalesce((
        select sum(total_cost)
        from public.appointment_services
        where appointment_id = target_id
      ), 0),
      updated_at = now()
  where id = target_id;
end;
$$;

-- =========================
-- DASHBOARD VIEW
-- =========================

create or replace view public.dashboard_service_summary as
select
  a.user_id,
  date_trunc('month', a.starts_at)::date as month,
  count(distinct a.id) as appointments_count,
  coalesce(sum(aps.price_charged), 0) as revenue,
  coalesce(sum(aps.total_cost), 0) as cost,
  coalesce(sum(aps.price_charged - aps.total_cost), 0) as margin,
  coalesce(sum(aps.minutes_spent), 0) as minutes_spent
from public.appointments a
left join public.appointment_services aps on aps.appointment_id = a.id
where a.status = 'completed'
group by a.user_id, date_trunc('month', a.starts_at)::date;

-- =========================
-- ROW LEVEL SECURITY
-- =========================

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.service_product_usage enable row level security;
alter table public.stock_movements enable row level security;
alter table public.time_entries enable row level security;

-- Profiles
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Generic user-owned policies
create policy "Users can manage own clients"
on public.clients for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own services"
on public.services for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own products"
on public.products for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own appointments"
on public.appointments for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own appointment services"
on public.appointment_services for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own product usage"
on public.service_product_usage for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own stock movements"
on public.stock_movements for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own time entries"
on public.time_entries for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
