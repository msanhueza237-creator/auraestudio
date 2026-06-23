-- ============================================================
-- AURA ESTUDIO - MIGRACION: PREFERENCIAS Y RECARGO DE COSTOS
-- ============================================================

-- 1. Crear tabla intermedia de productos preferidos de clientes
create table if not exists public.client_preferred_products (
  client_id uuid not null references public.clients(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (client_id, product_id)
);

-- Habilitar RLS
alter table public.client_preferred_products enable row level security;

-- Crear política RLS para la tabla intermedia
drop policy if exists "Users can manage own client preferred products" on public.client_preferred_products;
create policy "Users can manage own client preferred products"
on public.client_preferred_products for all
using (
  exists (
    select 1 from public.clients c
    where c.id = client_preferred_products.client_id
    and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.clients c
    where c.id = client_preferred_products.client_id
    and c.user_id = auth.uid()
  )
);

-- 2. Modificar la columna calculada de la tabla service_product_usage para aplicar el 30% de recargo
alter table public.service_product_usage drop column if exists total_cost;
alter table public.service_product_usage add column total_cost numeric(12,2) generated always as (round((quantity_used * unit_cost_at_usage * 1.30)::numeric, 2)) stored;

-- 3. Script para actualizar automáticamente los totales históricos de costos en la base de datos
do $$
declare
  r record;
begin
  -- Recalcular costos totales por servicio prestado
  for r in select id from public.appointment_services loop
    perform public.recalculate_appointment_service_cost(r.id);
  end loop;

  -- Recalcular costos y márgenes totales por cita
  for r in select id from public.appointments loop
    perform public.recalculate_appointment_totals(r.id);
  end loop;
end $$;
