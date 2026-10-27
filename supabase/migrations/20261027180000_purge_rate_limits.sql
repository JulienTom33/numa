create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.purge_rate_limits()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.rate_limits where window_start < now() - interval '2 days';
$$;

revoke execute on function public.purge_rate_limits() from public, anon, authenticated;

select cron.schedule(
  'purge-rate-limits',
  '17 3 * * *',
  $$select public.purge_rate_limits()$$
);
