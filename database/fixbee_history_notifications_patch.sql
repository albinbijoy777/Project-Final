-- FixBee history + notifications patch
-- Run this on your current Supabase project after fixbee_final_reset.sql.
-- It adds per-role booking history cleanup and notification clear support.

alter table public.bookings
  add column if not exists hidden_for_user boolean not null default false,
  add column if not exists hidden_for_worker boolean not null default false,
  add column if not exists hidden_for_admin boolean not null default false;

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

grant execute on function public.clear_booking_history_for_current_role(text, text[]) to authenticated, service_role;

drop policy if exists "notifications_delete_own_or_admin" on public.notifications;
create policy "notifications_delete_own_or_admin"
on public.notifications
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());
