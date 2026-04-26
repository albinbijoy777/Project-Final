-- FixBee latest upgrade patch
-- Run this in the Supabase SQL Editor on your current FixBee database.
-- It removes email-domain restriction and applies the latest booking history,
-- review, and service media updates without changing your current login emails.

begin;

drop trigger if exists enforce_kristujayanti_email on auth.users;
drop trigger if exists enforce_fixbee_email on auth.users;

drop function if exists public.require_kristujayanti_email() cascade;
drop function if exists public.require_fixbee_email() cascade;
drop function if exists public.password_reset_account_exists(text);

alter table public.profiles
  drop constraint if exists profiles_email_domain_check;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

grant usage on schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;

grant usage on schema storage to authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated, service_role;

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

alter table public.bookings
  add column if not exists hidden_for_user boolean not null default false,
  add column if not exists hidden_for_worker boolean not null default false,
  add column if not exists hidden_for_admin boolean not null default false;

drop function if exists public.clear_booking_history_for_current_role(text, text[]);

create or replace function public.clear_booking_history_for_role_items(
  target_role text,
  target_booking_ids uuid[] default null
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
      and coalesce(array_length(target_booking_ids, 1), 0) > 0
      and id = any(target_booking_ids);

    get diagnostics affected_rows = row_count;
    return affected_rows;
  end if;

  if normalized_target_role = 'worker' then
    update public.bookings
    set hidden_for_worker = true,
        updated_at = timezone('utc', now())
    where technician_id = auth.uid()
      and hidden_for_worker = false
      and coalesce(array_length(target_booking_ids, 1), 0) > 0
      and id = any(target_booking_ids);

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
      and coalesce(array_length(target_booking_ids, 1), 0) > 0
      and id = any(target_booking_ids);

    get diagnostics affected_rows = row_count;
    return affected_rows;
  end if;

  raise exception 'Unsupported role value: %', target_role;
end;
$$;

create or replace function public.cancel_booking_for_current_role(
  target_booking_id uuid,
  actor_label text default null,
  cancellation_reason text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  target_booking public.bookings;
  actor_name text;
  actor_role text;
  next_note text := coalesce(nullif(trim(cancellation_reason), ''), 'No cancellation reason was provided.');
  next_meta jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into target_booking
  from public.bookings
  where id = target_booking_id;

  if target_booking.id is null then
    raise exception 'Booking not found.';
  end if;

  if target_booking.status in ('completed', 'cancelled') then
    raise exception 'This booking can no longer be cancelled.';
  end if;

  if target_booking.user_id = auth.uid() then
    actor_role := 'user';
  elsif target_booking.technician_id = auth.uid() then
    actor_role := 'worker';
  elsif public.is_admin() then
    actor_role := 'admin';
  else
    raise exception 'You do not have access to cancel this booking.';
  end if;

  select coalesce(nullif(actor_label, ''), name, initcap(actor_role))
  into actor_name
  from public.profiles
  where id = auth.uid();

  next_meta := coalesce(target_booking.notes::jsonb, '{}'::jsonb);
  next_meta := jsonb_set(
    next_meta,
    '{timeline}',
    coalesce(next_meta -> 'timeline', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'id', public.new_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', coalesce(actor_name, initcap(actor_role)),
        'status', 'cancelled',
        'title', 'Booking cancelled',
        'note', next_note
      )
    ),
    true
  );

  update public.bookings
  set status = 'cancelled',
      notes = next_meta::text,
      updated_at = timezone('utc', now())
  where id = target_booking_id
  returning *
  into target_booking;

  insert into public.notifications (user_id, title, message, type)
  select target_booking.user_id,
         'Booking cancelled',
         case
           when actor_role = 'user' then 'You cancelled this booking. Reason: ' || next_note
           else coalesce(actor_name, initcap(actor_role)) || ' cancelled your booking. Reason: ' || next_note
         end,
         'info'
  where target_booking.user_id is not null;

  insert into public.notifications (user_id, title, message, type)
  select target_booking.technician_id,
         'Booking cancelled',
         case
           when actor_role = 'worker' then 'You cancelled this assignment. Reason: ' || next_note
           else coalesce(actor_name, initcap(actor_role)) || ' cancelled the assignment. Reason: ' || next_note
         end,
         'info'
  where target_booking.technician_id is not null
    and target_booking.technician_id <> target_booking.user_id;

  return target_booking;
end;
$$;

create or replace function public.request_booking_reschedule_for_current_role(
  target_booking_id uuid,
  requested_service_date date,
  requested_service_time text,
  actor_label text default null,
  request_reason text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  target_booking public.bookings;
  actor_name text;
  actor_role text;
  next_note text := coalesce(nullif(trim(request_reason), ''), 'No reschedule reason was provided.');
  next_meta jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into target_booking
  from public.bookings
  where id = target_booking_id;

  if target_booking.id is null then
    raise exception 'Booking not found.';
  end if;

  if target_booking.status in ('completed', 'cancelled') then
    raise exception 'This booking can no longer be rescheduled.';
  end if;

  if target_booking.user_id = auth.uid() then
    actor_role := 'user';
  elsif target_booking.technician_id = auth.uid() then
    actor_role := 'worker';
  else
    raise exception 'You do not have access to request a reschedule for this booking.';
  end if;

  select coalesce(nullif(actor_label, ''), name, initcap(actor_role))
  into actor_name
  from public.profiles
  where id = auth.uid();

  next_meta := coalesce(target_booking.notes::jsonb, '{}'::jsonb);
  next_meta := jsonb_set(
    next_meta,
    '{rescheduleRequest}',
    jsonb_build_object(
      'status', 'pending',
      'requestedBy', actor_role,
      'actorLabel', coalesce(actor_name, initcap(actor_role)),
      'requestedDate', requested_service_date::text,
      'requestedTime', trim(requested_service_time),
      'reason', next_note,
      'requestedAt', timezone('utc', now())::text
    ),
    true
  );

  next_meta := jsonb_set(
    next_meta,
    '{timeline}',
    coalesce(next_meta -> 'timeline', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'id', public.new_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', coalesce(actor_name, initcap(actor_role)),
        'status', 'reschedule_requested',
        'title', 'Reschedule requested',
        'note', 'Requested new slot: ' || requested_service_date::text || ' at ' || trim(requested_service_time) || '. Reason: ' || next_note
      )
    ),
    true
  );

  update public.bookings
  set notes = next_meta::text,
      updated_at = timezone('utc', now())
  where id = target_booking_id
  returning *
  into target_booking;

  insert into public.notifications (user_id, title, message, type)
  select id,
         'Reschedule request',
         coalesce(actor_name, initcap(actor_role)) || ' requested to move ' || target_booking.service || ' to ' || requested_service_date::text || ' at ' || trim(requested_service_time) || '. Reason: ' || next_note,
         'info'
  from public.profiles
  where role = 'admin';

  insert into public.notifications (user_id, title, message, type)
  select target_booking.user_id,
         'Reschedule requested',
         case
           when actor_role = 'user' then 'Your reschedule request was sent to admin for approval.'
           else coalesce(actor_name, initcap(actor_role)) || ' requested a new slot for your booking: ' || requested_service_date::text || ' at ' || trim(requested_service_time) || '.'
         end,
         'info'
  where target_booking.user_id is not null;

  insert into public.notifications (user_id, title, message, type)
  select target_booking.technician_id,
         'Reschedule requested',
         case
           when actor_role = 'worker' then 'Your reschedule request was sent to admin for approval.'
           else coalesce(actor_name, initcap(actor_role)) || ' requested a new slot for this assignment: ' || requested_service_date::text || ' at ' || trim(requested_service_time) || '.'
         end,
         'info'
  where target_booking.technician_id is not null
    and target_booking.technician_id <> target_booking.user_id;

  return target_booking;
end;
$$;

create or replace function public.approve_booking_reschedule_request(
  target_booking_id uuid,
  actor_label text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  target_booking public.bookings;
  actor_name text;
  request_payload jsonb;
  next_meta jsonb;
  next_date date;
  next_time text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  select *
  into target_booking
  from public.bookings
  where id = target_booking_id;

  if target_booking.id is null then
    raise exception 'Booking not found.';
  end if;

  next_meta := coalesce(target_booking.notes::jsonb, '{}'::jsonb);
  request_payload := next_meta -> 'rescheduleRequest';

  if request_payload is null or coalesce(request_payload ->> 'status', '') <> 'pending' then
    raise exception 'No pending reschedule request was found for this booking.';
  end if;

  next_date := (request_payload ->> 'requestedDate')::date;
  next_time := request_payload ->> 'requestedTime';

  select coalesce(nullif(actor_label, ''), name, 'Admin')
  into actor_name
  from public.profiles
  where id = auth.uid();

  next_meta := jsonb_set(
    next_meta,
    '{rescheduleRequest}',
    request_payload || jsonb_build_object(
      'status', 'approved',
      'approvedAt', timezone('utc', now())::text,
      'approvedBy', coalesce(actor_name, 'Admin')
    ),
    true
  );

  next_meta := jsonb_set(
    next_meta,
    '{timeline}',
    coalesce(next_meta -> 'timeline', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'id', public.new_uuid()::text,
        'createdAt', timezone('utc', now())::text,
        'actor', coalesce(actor_name, 'Admin'),
        'status', 'assigned',
        'title', 'Reschedule approved',
        'note', 'Booking moved to ' || next_date::text || ' at ' || next_time || '.'
      )
    ),
    true
  );

  update public.bookings
  set service_date = next_date,
      service_time = next_time,
      notes = next_meta::text,
      updated_at = timezone('utc', now())
  where id = target_booking_id
  returning *
  into target_booking;

  insert into public.notifications (user_id, title, message, type)
  select target_booking.user_id,
         'Reschedule approved',
         'Your booking was moved to ' || next_date::text || ' at ' || next_time || '.',
         'success'
  where target_booking.user_id is not null;

  insert into public.notifications (user_id, title, message, type)
  select target_booking.technician_id,
         'Reschedule approved',
         'This assignment was moved to ' || next_date::text || ' at ' || next_time || '.',
         'success'
  where target_booking.technician_id is not null
    and target_booking.technician_id <> target_booking.user_id;

  return target_booking;
end;
$$;

grant execute on function public.clear_booking_history_for_role_items(text, uuid[]) to authenticated, service_role;
grant execute on function public.cancel_booking_for_current_role(uuid, text, text) to authenticated, service_role;
grant execute on function public.request_booking_reschedule_for_current_role(uuid, date, text, text, text) to authenticated, service_role;
grant execute on function public.approve_booking_reschedule_request(uuid, text) to authenticated, service_role;

drop policy if exists "notifications_delete_own_or_admin" on public.notifications;
create policy "notifications_delete_own_or_admin"
on public.notifications
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

alter table public.services
  add column if not exists image_url text;

alter table public.reviews
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

alter table public.reviews
  add column if not exists booking_id uuid references public.bookings(id) on delete cascade;

create index if not exists idx_reviews_user_id on public.reviews(user_id);
create unique index if not exists idx_reviews_booking_unique
on public.reviews(booking_id)
where booking_id is not null;

insert into storage.buckets (id, name, public)
select 'service-media', 'service-media', true
where not exists (
  select 1
  from storage.buckets
  where id = 'service-media'
);

drop policy if exists "service_media_public_read" on storage.objects;
create policy "service_media_public_read"
on storage.objects
for select
to public
using (bucket_id = 'service-media');

drop policy if exists "service_media_admin_insert" on storage.objects;
create policy "service_media_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'service-media'
  and public.is_admin()
);

drop policy if exists "service_media_admin_update" on storage.objects;
create policy "service_media_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'service-media'
  and public.is_admin()
)
with check (
  bucket_id = 'service-media'
  and public.is_admin()
);

drop policy if exists "service_media_admin_delete" on storage.objects;
create policy "service_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'service-media'
  and public.is_admin()
);

drop policy if exists "reviews_select_authenticated" on public.reviews;
create policy "reviews_select_authenticated"
on public.reviews
for select
to authenticated
using (true);

drop policy if exists "reviews_admin_insert" on public.reviews;
drop policy if exists "reviews_insert_completed_owner_or_admin" on public.reviews;
create policy "reviews_insert_completed_owner_or_admin"
on public.reviews
for insert
to authenticated
with check (
  public.is_admin()
  or (
    user_id = auth.uid()
    and booking_id is not null
    and exists (
      select 1
      from public.bookings
      where id = booking_id
        and user_id = auth.uid()
        and status = 'completed'
        and service = reviews.service
    )
  )
);

create or replace function public.sync_service_rating_from_reviews(target_service text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.services as services
  set rating = case when stats.review_count > 0 then stats.avg_rating else services.rating end,
      reviews_count = stats.review_count,
      updated_at = timezone('utc', now())
  from (
    select
      round(coalesce(avg(reviews.rating), 0)::numeric, 2) as avg_rating,
      count(*)::integer as review_count
    from public.reviews as reviews
    where reviews.service = target_service
  ) as stats
  where services.name = target_service;
end;
$$;

create or replace function public.handle_review_stats_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_service_rating_from_reviews(old.service);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.service is distinct from new.service then
    perform public.sync_service_rating_from_reviews(old.service);
  end if;

  perform public.sync_service_rating_from_reviews(new.service);
  return new;
end;
$$;

drop trigger if exists reviews_sync_service_stats on public.reviews;
create trigger reviews_sync_service_stats
after insert or update or delete on public.reviews
for each row execute procedure public.handle_review_stats_change();

do $$
declare
  service_name text;
begin
  for service_name in select name from public.services loop
    perform public.sync_service_rating_from_reviews(service_name);
  end loop;
end;
$$;

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

  update auth.identities
  set identity_data = jsonb_set(
        jsonb_set(
          coalesce(identity_data, '{}'::jsonb),
          '{email}',
          to_jsonb(normalized_email),
          true
        ),
        '{email_verified}',
        'true'::jsonb,
        true
      ),
      updated_at = timezone('utc', now())
  where user_id = seeded_user_id;

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

commit;
