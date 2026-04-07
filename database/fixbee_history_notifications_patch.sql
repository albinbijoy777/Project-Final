-- FixBee history + notifications patch
-- Run this on your current Supabase project after fixbee_final_reset.sql.
-- It adds per-role booking history cleanup and notification clear support.

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

grant execute on function public.clear_booking_history_for_role_items(text, uuid[]) to authenticated, service_role;

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

grant execute on function public.cancel_booking_for_current_role(uuid, text, text) to authenticated, service_role;

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

grant execute on function public.request_booking_reschedule_for_current_role(uuid, date, text, text, text) to authenticated, service_role;

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

grant execute on function public.approve_booking_reschedule_request(uuid, text) to authenticated, service_role;

drop policy if exists "notifications_delete_own_or_admin" on public.notifications;
create policy "notifications_delete_own_or_admin"
on public.notifications
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());
