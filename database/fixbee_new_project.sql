-- Deprecated file.
-- Use database/fixbee_final_reset.sql instead.
-- That file is the final one-paste reset script for the app.
--
-- Older content below is kept only for reference.
-- FixBee fresh Supabase bootstrap
-- Run this whole file in the Supabase SQL Editor after updating your .env values.
--
-- Default seeded accounts:
-- user@kristujayanti.com   / User@12345
-- worker@kristujayanti.com / Worker@12345
-- admin@kristujayanti.com  / Admin@12345
--
-- After running:
-- 1. Keep Email auth enabled in Supabase.
-- 2. Add your app URL and `/reset-password` URL in Authentication -> URL Configuration.
-- 3. Test login with the seeded accounts above.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

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

create table if not exists public.profiles (
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

create table if not exists public.services (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text unique,
  name text not null unique,
  category text not null,
  description text not null,
  price numeric(10, 2) not null default 0,
  active boolean not null default true,
  rating numeric(3, 2) not null default 4.8,
  reviews_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  technician_id uuid references public.profiles(id) on delete set null,
  service text not null,
  service_date date not null,
  service_time text not null,
  address text not null,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  price numeric(10, 2) not null default 0,
  notes text not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null default '',
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  service text not null,
  author text not null,
  comment text not null,
  rating numeric(3, 2) not null default 5,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_technician_id on public.bookings(technician_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_reviews_service on public.reviews(service);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute procedure public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute procedure public.set_updated_at();

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row execute procedure public.set_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute procedure public.set_updated_at();

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

create or replace function public.require_kristujayanti_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := lower(trim(coalesce(new.email, '')));

  if new.email = '' or right(new.email, length('@kristujayanti.com')) <> '@kristujayanti.com' then
    raise exception 'Only @kristujayanti.com email addresses are allowed.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_kristujayanti_email on auth.users;
create trigger enforce_kristujayanti_email
before insert or update of email on auth.users
for each row execute procedure public.require_kristujayanti_email();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_role text;
  next_name text;
begin
  next_role := public.normalize_role(new.raw_user_meta_data ->> 'role');
  next_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(new.email, '@', 1),
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and right(lower(email), length('@kristujayanti.com')) = '@kristujayanti.com'
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (
  (auth.uid() = id or public.is_admin())
  and right(lower(email), length('@kristujayanti.com')) = '@kristujayanti.com'
);

drop policy if exists "services_select_authenticated" on public.services;
create policy "services_select_authenticated"
on public.services
for select
to authenticated
using (true);

drop policy if exists "services_admin_insert" on public.services;
create policy "services_admin_insert"
on public.services
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "services_admin_update" on public.services;
create policy "services_admin_update"
on public.services
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "services_admin_delete" on public.services;
create policy "services_admin_delete"
on public.services
for delete
to authenticated
using (public.is_admin());

drop policy if exists "bookings_select_owner_worker_admin" on public.bookings;
create policy "bookings_select_owner_worker_admin"
on public.bookings
for select
to authenticated
using (
  user_id = auth.uid()
  or technician_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "bookings_insert_owner" on public.bookings;
create policy "bookings_insert_owner"
on public.bookings
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "bookings_update_owner_worker_admin" on public.bookings;
create policy "bookings_update_owner_worker_admin"
on public.bookings
for update
to authenticated
using (
  user_id = auth.uid()
  or technician_id = auth.uid()
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or technician_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin"
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_insert_authenticated" on public.notifications;
create policy "notifications_insert_authenticated"
on public.notifications
for insert
to authenticated
with check (true);

drop policy if exists "notifications_update_own_or_admin" on public.notifications;
create policy "notifications_update_own_or_admin"
on public.notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "reviews_select_authenticated" on public.reviews;
create policy "reviews_select_authenticated"
on public.reviews
for select
to authenticated
using (true);

drop policy if exists "reviews_admin_insert" on public.reviews;
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

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own_folder" on storage.objects;
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

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.seed_auth_user(seed_email text, seed_password text, seed_name text, seed_role text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(seed_email));
  normalized_role text := case lower(trim(coalesce(seed_role, 'user')))
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
  seeded_user_id uuid;
begin
  if right(normalized_email, length('@kristujayanti.com')) <> '@kristujayanti.com' then
    raise exception 'Seeded users must use @kristujayanti.com emails.';
  end if;

  select id
  into seeded_user_id
  from auth.users
  where email = normalized_email;

  if seeded_user_id is null then
    seeded_user_id := extensions.gen_random_uuid();

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
      extensions.crypt(seed_password, extensions.gen_salt('bf')),
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
    set encrypted_password = extensions.crypt(seed_password, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', seed_name, 'role', normalized_role),
        updated_at = timezone('utc', now()),
        confirmation_token = coalesce(confirmation_token, ''),
        email_change = coalesce(email_change, ''),
        email_change_token_new = coalesce(email_change_token_new, ''),
        recovery_token = coalesce(recovery_token, '')
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
    extensions.gen_random_uuid(),
    seeded_user_id,
    jsonb_build_object('sub', seeded_user_id::text, 'email', normalized_email),
    'email',
    seeded_user_id::text,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict do nothing;

  update public.profiles
  set email = normalized_email,
      name = seed_name,
      role = normalized_role,
      updated_at = timezone('utc', now())
  where id = seeded_user_id;

  return seeded_user_id;
end;
$$;

select public.seed_auth_user('user@kristujayanti.com', 'User@12345', 'Default User', 'user');
select public.seed_auth_user('worker@kristujayanti.com', 'Worker@12345', 'Default Worker', 'worker');
select public.seed_auth_user('admin@kristujayanti.com', 'Admin@12345', 'Default Admin', 'admin');

insert into public.services (slug, name, category, description, price, active, rating, reviews_count)
values
  ('electrician', 'Electrician', 'Repairs', 'Fast electrical repairs, switch replacements, fan installation, and safety checks.', 399, true, 4.8, 2140),
  ('plumber', 'Plumber', 'Repairs', 'Leak fixes, tap replacements, drainage support, and urgent plumbing assistance.', 449, true, 4.7, 1894),
  ('carpenter', 'Carpenter', 'Installation', 'Furniture assembly, door alignment, shelf mounting, and woodwork support.', 599, true, 4.9, 1320),
  ('kitchen-cleaning', 'Kitchen Cleaning', 'Cleaning', 'Degreasing, cabinet wipe-down, and appliance-surface detailing.', 799, true, 4.8, 980),
  ('deep-cleaning', 'Deep Cleaning', 'Cleaning', 'Room-to-room deep cleaning service for apartments and villas.', 1499, true, 4.9, 1575),
  ('ac-service', 'AC Service', 'Maintenance', 'Cooling checks, AC servicing, and preventive maintenance for split and window units.', 599, true, 4.8, 1710),
  ('painting', 'Painting', 'Interiors', 'Accent wall work, repainting, and supervised painting jobs.', 2299, true, 4.9, 620)
on conflict (slug) do update
set name = excluded.name,
    category = excluded.category,
    description = excluded.description,
    price = excluded.price,
    active = excluded.active,
    rating = excluded.rating,
    reviews_count = excluded.reviews_count,
    updated_at = timezone('utc', now());

with ids as (
  select
    (select id from public.profiles where email = 'user@kristujayanti.com') as user_id,
    (select id from public.profiles where email = 'worker@kristujayanti.com') as worker_id,
    (select id from public.profiles where email = 'admin@kristujayanti.com') as admin_id
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
        'id', extensions.gen_random_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'system',
        'status', 'pending',
        'title', 'Booking created',
        'note', 'Your request has been received and is waiting for assignment.'
      ),
      jsonb_build_object(
        'id', extensions.gen_random_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'Default Admin',
        'status', 'assigned',
        'title', 'Worker assigned',
        'note', 'The booking has been routed to an available worker.'
      )
    )
  )::text
from ids
where ids.user_id is not null
  and ids.worker_id is not null
  and not exists (
    select 1
    from public.bookings
    where service = 'AC Service'
      and address = 'Kristu Jayanti College Road, Bengaluru'
  );

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
        'id', extensions.gen_random_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'system',
        'status', 'pending',
        'title', 'Booking created',
        'note', 'Your request has been received.'
      ),
      jsonb_build_object(
        'id', extensions.gen_random_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', 'Default Worker',
        'status', 'completed',
        'title', 'Job completed',
        'note', 'Switchboard repair and testing completed.'
      )
    )
  )::text
from ids
where ids.user_id is not null
  and ids.worker_id is not null
  and not exists (
    select 1
    from public.bookings
    where service = 'Electrician'
      and address = 'K Narayanapura Main Road, Bengaluru'
  );

insert into public.notifications (user_id, title, message, type)
select id, 'Welcome to FixBee', 'Your new workspace is connected to the fresh database.', 'success'
from public.profiles
where email in (
  'user@kristujayanti.com',
  'worker@kristujayanti.com',
  'admin@kristujayanti.com'
)
and not exists (
  select 1
  from public.notifications
  where public.notifications.user_id = public.profiles.id
    and public.notifications.title = 'Welcome to FixBee'
);
