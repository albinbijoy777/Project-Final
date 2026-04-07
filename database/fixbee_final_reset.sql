-- FixBee full Supabase reset + bootstrap
-- Paste this whole script into the Supabase SQL Editor and run it once.
--
-- What it resets:
-- 1. FixBee public tables
-- 2. Existing FixBee auth users with @kristujayanti.com email addresses
--
-- Note:
-- Supabase blocks direct SQL deletion from storage.objects.
-- This script keeps the avatars bucket and recreates its policies safely.
--
-- Default accounts created by this script:
-- user@kristujayanti.com   / User@12345
-- worker@kristujayanti.com / Worker@12345
-- admin@kristujayanti.com  / Admin@12345
--
-- Manual steps after this SQL:
-- 1. Authentication -> URL Configuration -> Site URL = your frontend URL
-- 2. Authentication -> URL Configuration -> Redirect URLs = add YOUR_FRONTEND_URL/reset-password
-- 3. Authentication -> Providers -> Email = enabled
-- 4. If you want instant signup without email confirmation, turn off "Confirm email"

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

drop trigger if exists enforce_kristujayanti_email on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_saved on auth.users;

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_insert_own_folder" on storage.objects;
drop policy if exists "avatars_update_own_folder" on storage.objects;
drop policy if exists "avatars_delete_own_folder" on storage.objects;

drop table if exists public.notifications cascade;
drop table if exists public.reviews cascade;
drop table if exists public.bookings cascade;
drop table if exists public.services cascade;
drop table if exists public.profiles cascade;

drop function if exists public.seed_auth_user(text, text, text, text) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.require_kristujayanti_email() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.normalize_role(text) cascade;
drop function if exists public.new_uuid() cascade;

do $$
declare
  target_user_ids uuid[];
begin
  select coalesce(array_agg(id), '{}'::uuid[])
  into target_user_ids
  from auth.users
  where lower(coalesce(email, '')) like '%@kristujayanti.com';

  if coalesce(array_length(target_user_ids, 1), 0) > 0 then
    if to_regclass('auth.mfa_challenges') is not null and to_regclass('auth.mfa_factors') is not null then
      execute 'delete from auth.mfa_challenges where factor_id in (select id from auth.mfa_factors where user_id = any($1))'
      using target_user_ids;
    end if;

    if to_regclass('auth.mfa_factors') is not null then
      execute 'delete from auth.mfa_factors where user_id = any($1)'
      using target_user_ids;
    end if;

    if to_regclass('auth.one_time_tokens') is not null then
      execute 'delete from auth.one_time_tokens where user_id = any($1)'
      using target_user_ids;
    end if;

    if to_regclass('auth.sessions') is not null then
      execute 'delete from auth.sessions where user_id = any($1)'
      using target_user_ids;
    end if;

    if to_regclass('auth.refresh_tokens') is not null then
      execute 'delete from auth.refresh_tokens where user_id = any($1)'
      using target_user_ids;
    end if;

    if to_regclass('auth.identities') is not null then
      execute 'delete from auth.identities where user_id = any($1)'
      using target_user_ids;
    end if;

    delete from auth.users where id = any(target_user_ids);
  end if;
end;
$$;

create or replace function public.new_uuid()
returns uuid
language sql
volatile
set search_path = extensions, public
as $$
  select gen_random_uuid();
$$;

create or replace function public.normalize_role(input_role text)
returns text
language sql
immutable
as $$
  select case lower(trim(coalesce(input_role, 'user')))
    when 'worker' then 'worker'
    when 'technician' then 'worker'
    when 'tech' then 'worker'
    when 'provider' then 'worker'
    when 'admin' then 'admin'
    when 'superadmin' then 'admin'
    when 'super_admin' then 'admin'
    when 'manager' then 'admin'
    else 'user'
  end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.require_kristujayanti_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.email := lower(trim(coalesce(new.email, '')));

  if new.email = '' or right(new.email, length('@kristujayanti.com')) <> '@kristujayanti.com' then
    raise exception 'Only @kristujayanti.com email addresses are allowed.';
  end if;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default 'FixBee Member',
  role text not null default 'user' check (role in ('user', 'worker', 'admin')),
  phone text not null default '',
  address text not null default '',
  avatar text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_email_domain_check check (
    right(lower(email), length('@kristujayanti.com')) = '@kristujayanti.com'
  )
);

create table public.services (
  id uuid primary key default public.new_uuid(),
  slug text not null unique,
  name text not null unique,
  category text not null,
  description text not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  active boolean not null default true,
  rating numeric(3, 2) not null default 4.8 check (rating >= 0 and rating <= 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bookings (
  id uuid primary key default public.new_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  technician_id uuid references public.profiles(id) on delete set null,
  service text not null,
  service_date date not null,
  service_time text not null,
  address text not null,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  price numeric(10, 2) not null default 0 check (price >= 0),
  notes text not null default '{}',
  hidden_for_user boolean not null default false,
  hidden_for_worker boolean not null default false,
  hidden_for_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.notifications (
  id uuid primary key default public.new_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null default '',
  type text not null default 'info' check (type in ('info', 'success', 'error')),
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reviews (
  id uuid primary key default public.new_uuid(),
  service text not null,
  author text not null,
  comment text not null,
  rating numeric(3, 2) not null default 5 check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

grant usage on schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;

create index idx_profiles_role on public.profiles(role);
create index idx_services_active on public.services(active);
create index idx_bookings_user_id on public.bookings(user_id);
create index idx_bookings_technician_id on public.bookings(technician_id);
create index idx_bookings_status on public.bookings(status);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_reviews_service on public.reviews(service);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.clear_booking_history_for_current_role(
  target_role text,
  target_statuses text[] default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_target_role text := public.normalize_role(target_role);
  affected_rows integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if normalized_target_role = 'user' then
    update public.bookings
    set hidden_for_user = true,
        updated_at = timezone('utc', now())
    where user_id = auth.uid()
      and hidden_for_user = false
      and (
        target_statuses is null
        or coalesce(array_length(target_statuses, 1), 0) = 0
        or status = any(target_statuses)
      );

    get diagnostics affected_rows = row_count;
    return affected_rows;
  end if;

  if normalized_target_role = 'worker' then
    update public.bookings
    set hidden_for_worker = true,
        updated_at = timezone('utc', now())
    where technician_id = auth.uid()
      and hidden_for_worker = false
      and (
        target_statuses is null
        or coalesce(array_length(target_statuses, 1), 0) = 0
        or status = any(target_statuses)
      );

    get diagnostics affected_rows = row_count;
    return affected_rows;
  end if;

  if normalized_target_role = 'admin' then
    if not public.is_admin() then
      raise exception 'Admin access required.';
    end if;

    update public.bookings
    set hidden_for_admin = true,
        updated_at = timezone('utc', now())
    where hidden_for_admin = false
      and (
        target_statuses is null
        or coalesce(array_length(target_statuses, 1), 0) = 0
        or status = any(target_statuses)
      );

    get diagnostics affected_rows = row_count;
    return affected_rows;
  end if;

  raise exception 'Unsupported role value: %', target_role;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
  next_name text;
begin
  next_role := public.normalize_role(new.raw_user_meta_data ->> 'role');
  next_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(lower(new.email), '@', 1),
    'FixBee Member'
  );

  insert into public.profiles (id, email, name, role)
  values (new.id, lower(new.email), next_name, next_role)
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        role = excluded.role,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute procedure public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute procedure public.set_updated_at();

create trigger notifications_set_updated_at
before update on public.notifications
for each row execute procedure public.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute procedure public.set_updated_at();

create trigger enforce_kristujayanti_email
before insert or update of email on auth.users
for each row execute procedure public.require_kristujayanti_email();

create trigger on_auth_user_saved
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and right(lower(email), length('@kristujayanti.com')) = '@kristujayanti.com'
);

create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (
  (auth.uid() = id or public.is_admin())
  and right(lower(email), length('@kristujayanti.com')) = '@kristujayanti.com'
);

create policy "services_select_authenticated"
on public.services
for select
to authenticated
using (true);

create policy "services_admin_insert"
on public.services
for insert
to authenticated
with check (public.is_admin());

create policy "services_admin_update"
on public.services
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "services_admin_delete"
on public.services
for delete
to authenticated
using (public.is_admin());

create policy "bookings_select_owner_worker_admin"
on public.bookings
for select
to authenticated
using (
  user_id = auth.uid()
  or technician_id = auth.uid()
  or public.is_admin()
);

create policy "bookings_insert_owner"
on public.bookings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "bookings_update_worker_admin"
on public.bookings
for update
to authenticated
using (
  technician_id = auth.uid()
  or public.is_admin()
)
with check (
  technician_id = auth.uid()
  or public.is_admin()
);

create policy "notifications_select_own_or_admin"
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "notifications_insert_authenticated"
on public.notifications
for insert
to authenticated
with check (true);

create policy "notifications_update_own_or_admin"
on public.notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "notifications_delete_own_or_admin"
on public.notifications
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "reviews_select_authenticated"
on public.reviews
for select
to authenticated
using (true);

create policy "reviews_admin_insert"
on public.reviews
for insert
to authenticated
with check (public.is_admin());

insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (
  select 1
  from storage.buckets
  where id = 'avatars'
);

create policy "avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

create policy "avatars_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

grant usage on schema storage to authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated, service_role;

create or replace function public.seed_auth_user(seed_email text, seed_password text, seed_name text, seed_role text)
returns uuid
language plpgsql
security definer
set search_path = extensions, public
as $$
declare
  normalized_email text := lower(trim(seed_email));
  normalized_role text := public.normalize_role(seed_role);
  seeded_user_id uuid;
begin
  if right(normalized_email, length('@kristujayanti.com')) <> '@kristujayanti.com' then
    raise exception 'Seeded users must use @kristujayanti.com emails.';
  end if;

  select id
  into seeded_user_id
  from auth.users
  where lower(email) = normalized_email
  limit 1;

  if seeded_user_id is null then
    seeded_user_id := public.new_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      seeded_user_id,
      'authenticated',
      'authenticated',
      normalized_email,
      crypt(seed_password, gen_salt('bf')),
      timezone('utc', now()),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', seed_name, 'role', normalized_role),
      timezone('utc', now()),
      timezone('utc', now())
    );
  else
    update auth.users
    set email = normalized_email,
        encrypted_password = crypt(seed_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = jsonb_build_object('name', seed_name, 'role', normalized_role),
        updated_at = timezone('utc', now()),
        confirmation_token = '',
        email_change = '',
        email_change_token_new = '',
        recovery_token = ''
    where id = seeded_user_id;
  end if;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at,
    last_sign_in_at
  )
  values (
    public.new_uuid(),
    seeded_user_id,
    jsonb_build_object(
      'sub', seeded_user_id::text,
      'email', normalized_email,
      'email_verified', true
    ),
    'email',
    seeded_user_id::text,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict do nothing;

  insert into public.profiles (id, email, name, role)
  values (seeded_user_id, normalized_email, seed_name, normalized_role)
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        role = excluded.role,
        updated_at = timezone('utc', now());

  return seeded_user_id;
end;
$$;

select public.seed_auth_user('user@kristujayanti.com', 'User@12345', 'Default User', 'user');
select public.seed_auth_user('worker@kristujayanti.com', 'Worker@12345', 'Default Worker', 'worker');
select public.seed_auth_user('worker.one@kristujayanti.com', 'Worker@12345', 'Arun Das', 'worker');
select public.seed_auth_user('worker.two@kristujayanti.com', 'Worker@12345', 'Meera Joseph', 'worker');
select public.seed_auth_user('worker.three@kristujayanti.com', 'Worker@12345', 'Rafi Paul', 'worker');
select public.seed_auth_user('admin@kristujayanti.com', 'Admin@12345', 'Operations Admin', 'admin');

insert into public.services (slug, name, category, description, price, active, rating, reviews_count)
values
  ('electrician', 'Electrician', 'Repairs', 'Fast electrical repairs, fan installation, switchboard replacement, and preventive safety checks.', 399, true, 4.8, 2140),
  ('plumber', 'Plumber', 'Repairs', 'Leak fixes, tap replacement, drainage unclogging, and urgent plumbing support.', 449, true, 4.7, 1894),
  ('carpenter', 'Carpenter', 'Installation', 'Furniture assembly, door alignment, shelf installation, and modular woodwork support.', 599, true, 4.9, 1320),
  ('kitchen-cleaning', 'Kitchen Cleaning', 'Cleaning', 'Degreasing, cabinet wipe-down, chimney exterior cleaning, and appliance-surface detailing.', 799, true, 4.8, 980),
  ('deep-cleaning', 'Deep Cleaning', 'Cleaning', 'Room-to-room deep cleaning for apartments and villas with sanitization and detailing.', 1499, true, 4.9, 1575),
  ('ac-service', 'AC Service', 'Maintenance', 'AC servicing, cooling checks, drainage inspection, and preventive maintenance.', 599, true, 4.8, 1710),
  ('painting', 'Painting', 'Interiors', 'Accent walls, repainting, touch-up jobs, and supervised painting support.', 2299, true, 4.9, 620);

insert into public.reviews (service, author, comment, rating)
values
  ('Electrician', 'Ananya S.', 'The electrician arrived on time and fixed the switchboard quickly.', 5.0),
  ('Electrician', 'Rohit P.', 'Clear explanation, clean work, and a smooth visit overall.', 4.8),
  ('Plumber', 'Midhun K.', 'The worker came prepared and solved the leakage issue in one visit.', 4.8),
  ('Plumber', 'Sarah L.', 'Good communication and clear status updates from start to finish.', 4.6),
  ('Carpenter', 'Divya M.', 'Furniture assembly was neat and the finish quality was excellent.', 5.0),
  ('Carpenter', 'Noel D.', 'Very professional and careful with measurements.', 4.9),
  ('Kitchen Cleaning', 'Sneha J.', 'The kitchen looked noticeably better and the team followed my instructions closely.', 4.8),
  ('Kitchen Cleaning', 'Arjun B.', 'On-time visit, good detailing, and no mess left behind.', 4.7),
  ('Deep Cleaning', 'Karthik R.', 'The team covered the full apartment thoroughly and stayed on schedule.', 5.0),
  ('Deep Cleaning', 'Isha T.', 'Well coordinated service with a clear checklist and clean finish.', 4.9),
  ('AC Service', 'Rahul G.', 'Both AC units were checked properly and cooling improved immediately.', 4.8),
  ('AC Service', 'Priya N.', 'The technician explained the issue clearly and completed the service on time.', 4.7),
  ('Painting', 'Aditi V.', 'Crew assignment was smooth, updates were timely, and the final finish looked great.', 5.0),
  ('Painting', 'Mohammed F.', 'The detail page and estimate helped me decide quickly.', 4.8);

with ids as (
  select
    (select id from public.profiles where email = 'user@kristujayanti.com') as user_id,
    (select id from public.profiles where email = 'worker@kristujayanti.com') as worker_id
)
insert into public.bookings (user_id, technician_id, service, service_date, service_time, address, status, price, notes)
select
  ids.user_id,
  null,
  'Plumber',
  current_date + 2,
  '12:30 PM',
  'Kothanur Main Road, Bengaluru',
  'pending',
  449,
  jsonb_build_object(
    'serviceSlug', 'plumber',
    'requirementDetails', 'Kitchen sink drainage is slow and there is a small leak under the sink.',
    'urgency', 'standard',
    'paymentMethod', 'cash',
    'promoCode', 'FLOW10',
    'rewardCoinsRedeemed', 0,
    'rewardCoinsEarned', 28,
    'location', 'Kothanur Main Road, Bengaluru',
    'city', 'Bengaluru',
    'customerName', 'Default User',
    'customerPhone', '+91 9876500001',
    'timeline', jsonb_build_array(
      jsonb_build_object(
        'id', public.new_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'system',
        'status', 'pending',
        'title', 'Booking created',
        'note', 'Your request has been received and is waiting for assignment.'
      )
    )
  )::text
from ids;

with ids as (
  select
    (select id from public.profiles where email = 'user@kristujayanti.com') as user_id,
    (select id from public.profiles where email = 'worker@kristujayanti.com') as worker_id
)
insert into public.bookings (user_id, technician_id, service, service_date, service_time, address, status, price, notes)
select
  ids.user_id,
  ids.worker_id,
  'AC Service',
  current_date + 1,
  '10:00 AM',
  'Kristu Jayanti College Road, Bengaluru',
  'assigned',
  599,
  jsonb_build_object(
    'serviceSlug', 'ac-service',
    'requirementDetails', 'Cooling is weak in the guest room unit.',
    'urgency', 'standard',
    'paymentMethod', 'cash',
    'promoCode', 'COOL100',
    'rewardCoinsRedeemed', 0,
    'rewardCoinsEarned', 38,
    'location', 'Kristu Jayanti College Road, Bengaluru',
    'city', 'Bengaluru',
    'customerName', 'Default User',
    'customerPhone', '+91 9876500001',
    'timeline', jsonb_build_array(
      jsonb_build_object(
        'id', public.new_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'system',
        'status', 'pending',
        'title', 'Booking created',
        'note', 'Your request has been received and is waiting for assignment.'
      ),
      jsonb_build_object(
        'id', public.new_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'Operations Admin',
        'status', 'assigned',
        'title', 'Worker assigned',
        'note', 'The booking has been routed to an available worker.'
      )
    )
  )::text
from ids;

with ids as (
  select
    (select id from public.profiles where email = 'user@kristujayanti.com') as user_id,
    (select id from public.profiles where email = 'worker@kristujayanti.com') as worker_id
)
insert into public.bookings (user_id, technician_id, service, service_date, service_time, address, status, price, notes)
select
  ids.user_id,
  ids.worker_id,
  'Electrician',
  current_date - 3,
  '03:00 PM',
  'K Narayanapura Main Road, Bengaluru',
  'completed',
  399,
  jsonb_build_object(
    'serviceSlug', 'electrician',
    'requirementDetails', 'Living room switchboard repair completed successfully.',
    'urgency', 'standard',
    'paymentMethod', 'cash',
    'promoCode', null,
    'rewardCoinsRedeemed', 0,
    'rewardCoinsEarned', 30,
    'location', 'K Narayanapura Main Road, Bengaluru',
    'city', 'Bengaluru',
    'customerName', 'Default User',
    'customerPhone', '+91 9876500001',
    'timeline', jsonb_build_array(
      jsonb_build_object(
        'id', public.new_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'system',
        'status', 'pending',
        'title', 'Booking created',
        'note', 'Your request has been received.'
      ),
      jsonb_build_object(
        'id', public.new_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'Default Worker',
        'status', 'completed',
        'title', 'Job completed',
        'note', 'Switchboard repair and testing completed.'
      )
    )
  )::text
from ids;

insert into public.notifications (user_id, title, message, type)
select id, 'Welcome to FixBee', 'Your account is ready to book, track, and manage services.', 'success'
from public.profiles;
