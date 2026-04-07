-- FixBee extra worker accounts
-- Run this after fixbee_final_reset.sql on the same Supabase project.

select public.seed_auth_user('worker.one@kristujayanti.com', 'Worker@12345', 'Arun Das', 'worker');
select public.seed_auth_user('worker.two@kristujayanti.com', 'Worker@12345', 'Meera Joseph', 'worker');
select public.seed_auth_user('worker.three@kristujayanti.com', 'Worker@12345', 'Rafi Paul', 'worker');

insert into public.notifications (user_id, title, message, type)
select id, 'Worker account ready', 'You are ready to receive and complete assigned service requests.', 'info'
from public.profiles
where email in (
  'worker.one@kristujayanti.com',
  'worker.two@kristujayanti.com',
  'worker.three@kristujayanti.com'
);
