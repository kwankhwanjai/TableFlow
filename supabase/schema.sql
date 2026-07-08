-- TableFlow reservations schema
-- Run this in the Supabase SQL editor for your project.

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  guest_count integer not null default 2,
  table_number integer not null,
  reservation_date date not null,
  start_time integer not null,
  end_time integer not null,
  status text not null default 'Reserved',
  requested_table text default 'No',
  note text default '',
  checked_in_at timestamptz,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists reservations_date_idx
  on public.reservations (reservation_date);

create index if not exists reservations_phone_idx
  on public.reservations (phone);

alter table public.reservations enable row level security;

create policy "Authenticated users can read reservations"
  on public.reservations
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert reservations"
  on public.reservations
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update reservations"
  on public.reservations
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete reservations"
  on public.reservations
  for delete
  to authenticated
  using (true);

alter publication supabase_realtime add table public.reservations;
