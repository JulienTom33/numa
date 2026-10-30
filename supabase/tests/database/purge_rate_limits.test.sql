-- Tests de la purge quotidienne de rate_limits (issue #246).

create extension if not exists pgtap with schema extensions;

begin;

select plan(6);

select has_extension('pg_cron', 'purge_rate_limits: pg_cron est installée');

select is(
  (select schedule from cron.job where jobname = 'purge-rate-limits'), '17 3 * * *',
  'purge_rate_limits: la tâche quotidienne est planifiée'
);

select is(
  (select command from cron.job where jobname = 'purge-rate-limits'),
  'select public.purge_rate_limits()',
  'purge_rate_limits: la tâche appelle la fonction de purge'
);

insert into public.rate_limits (key, window_start, count) values
  ('purge:old', now() - interval '3 days', 5),
  ('purge:recent', now() - interval '1 day', 5);

select public.purge_rate_limits();

select is(
  (select count(*)::int from public.rate_limits where key = 'purge:old'), 0,
  'purge_rate_limits: une fenêtre de plus de 2 jours est supprimée'
);
select is(
  (select count(*)::int from public.rate_limits where key = 'purge:recent'), 1,
  'purge_rate_limits: une fenêtre récente est conservée'
);

set local role authenticated;

select throws_ok(
  $$select public.purge_rate_limits()$$,
  '42501', null,
  'purge_rate_limits: le client authentifié ne peut pas l''appeler'
);

select * from finish();

rollback;
