-- DÁLMATA — esquema inicial para Supabase (SQL editor)
-- Ejecutá en orden. Ajustá RLS según tu política de seguridad.

-- Catálogo (sincronizado con el shape de data/products.js)
create table if not exists public.products (
  id text primary key,
  name text not null,
  description text default '',
  price integer not null default 0,
  silhouette text default 'clasica',
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  image text default '',
  active boolean not null default true,
  updated_at timestamptz default now()
);

-- Pedidos
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb
);

-- Perfil ligado a auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  updated_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;

-- Lectura pública de productos activos
create policy "products_select_active"
  on public.products for select
  using (active = true);

-- Inserción de pedidos anónima (solo anon key; endurecé en producción)
create policy "orders_insert_anon"
  on public.orders for insert
  with check (true);

-- Perfiles: cada usuario ve/edita solo el suyo
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Ejemplo de fila (ajustá paths de imagen):
-- insert into public.products (id, name, description, price, silhouette, sizes, colors, image, active)
-- values (
--   'demo-1',
--   'Remera Demo',
--   'Producto de prueba',
--   39900,
--   'clasica',
--   '["S","M","L"]'::jsonb,
--   '[{"label":"Negro","value":"#000000"}]'::jsonb,
--   './assets/products/clasica-mujer.jpg',
--   true
-- );
