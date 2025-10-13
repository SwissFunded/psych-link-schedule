-- Enable btree_gist extension for exclusion constraints
create extension if not exists btree_gist;

-- Drop existing table if it exists (clean slate)
drop table if exists public.bookings cascade;

-- Create bookings table
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  
  -- Therapist & Calendar Info
  therapist_id text not null default 't1',
  calendar_id integer not null default 136,
  
  -- Time Slot
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null,
  
  -- Patient Information (REQUIRED)
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  
  -- Appointment Details
  appointment_type text not null check (appointment_type in ('erstgespraech', 'folgetermin', 'telefontermin')),
  appointment_mode text not null check (appointment_mode in ('in_person', 'video', 'phone')),
  notes text,
  
  -- Vitabyte Integration
  vitabyte_appointment_id integer unique,
  
  -- Status & Source
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'failed')),
  source text not null default 'web' check (source in ('web', 'admin')),
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  
  -- Computed column for range queries (using tstzrange for timestamptz)
  slot tstzrange generated always as (tstzrange(start_time, end_time, '[)')) stored
);

-- Index for fast lookups
create index if not exists bookings_therapist_time_idx on public.bookings (therapist_id, start_time desc);
create index if not exists bookings_email_idx on public.bookings (email);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_vitabyte_id_idx on public.bookings (vitabyte_appointment_id);

-- GiST index for range queries
create index if not exists bookings_slot_idx on public.bookings using gist (therapist_id, slot);

-- Exclusion constraint to prevent overlapping bookings for the same therapist
-- Only applies to non-cancelled appointments
alter table public.bookings 
  add constraint no_overlapping_bookings 
  exclude using gist (
    therapist_id with =, 
    slot with &&
  ) where (status != 'cancelled');

-- Trigger to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_bookings_updated_at
  before update on public.bookings
  for each row
  execute function public.update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table public.bookings enable row level security;

-- Policy: Anyone can read their own bookings by email
create policy "Users can view their own bookings"
  on public.bookings for select
  using (auth.jwt() ->> 'email' = email or auth.role() = 'service_role');

-- Policy: Service role (Edge Functions) can insert
create policy "Service role can insert bookings"
  on public.bookings for insert
  with check (auth.role() = 'service_role');

-- Policy: Service role can update
create policy "Service role can update bookings"
  on public.bookings for update
  using (auth.role() = 'service_role');

-- Policy: Service role can delete
create policy "Service role can delete bookings"
  on public.bookings for delete
  using (auth.role() = 'service_role');

-- Grant permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on public.bookings to service_role;
grant select on public.bookings to authenticated;
grant select on public.bookings to anon;

-- Comment on table
comment on table public.bookings is 'Stores all appointment bookings with double-booking prevention';
comment on column public.bookings.slot is 'Computed range column for efficient overlap detection';
comment on constraint no_overlapping_bookings on public.bookings is 'Prevents double-bookings for the same therapist';

