-- Fonction d'incrémentation atomique du compteur d'usage (questions anonymes ou identifiées).
-- security invoker : s'exécute avec les droits de l'appelant, donc les policies RLS de
-- usage_counters (auth.uid() = user_id) s'appliquent normalement.
create or replace function public.increment_usage_counter(p_period_start date)
returns int
language plpgsql
security invoker
as $$
declare
  v_count int;
begin
  insert into public.usage_counters (user_id, period_start, count)
  values (auth.uid(), p_period_start, 1)
  on conflict (user_id, period_start)
  do update set count = usage_counters.count + 1
  returning count into v_count;

  return v_count;
end;
$$;

grant execute on function public.increment_usage_counter(date) to authenticated;
