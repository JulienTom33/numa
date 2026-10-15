-- Quota de questions protégé côté serveur (issue #27).
--
-- Faille corrigée : les policies insert/update/delete de usage_counters et la fonction
-- increment_usage_counter (security invoker, exécutable par authenticated) laissaient le
-- client écrire, remettre à zéro ou supprimer son propre compteur. Désormais seul le code
-- serveur (Edge Function `chat`, clé secrète → rôle service_role) modifie le compteur ;
-- le client garde la lecture de sa propre ligne.

drop policy "usage_counters_insert_own" on public.usage_counters;
drop policy "usage_counters_update_own" on public.usage_counters;
drop policy "usage_counters_delete_own" on public.usage_counters;
revoke insert, update, delete, truncate on public.usage_counters from authenticated, anon;

drop function public.increment_usage_counter(date);

-- Une question en cours de traitement occupe une place du quota jusqu'à sa validation
-- (réponse du fournisseur) ou sa libération (erreur) : deux requêtes simultanées ne peuvent
-- pas consommer la même place. L'expiration libère une place si la fonction s'interrompt
-- sans libérer ; elle dépasse la durée maximale d'exécution d'une Edge Function (150 s).
create table public.question_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index question_reservations_user_id_idx on public.question_reservations (user_id);

-- RLS sans aucune policy et aucun privilège client : table interne aux fonctions ci-dessous.
alter table public.question_reservations enable row level security;
revoke all on public.question_reservations from anon, authenticated;

-- Le quota anonyme couvre toute la vie de la session, pas une journée : sa ligne dans
-- usage_counters utilise la période '-infinity'.

create or replace function public.reserve_question(p_user_id uuid, p_limit int)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used int;
  v_pending int;
  v_reservation_id uuid;
begin
  insert into public.usage_counters (user_id, period_start, count)
  values (p_user_id, '-infinity', 0)
  on conflict (user_id, period_start) do nothing;

  -- Verrou de ligne : les réservations concurrentes d'un même utilisateur sont sérialisées.
  select count into v_used
  from public.usage_counters
  where user_id = p_user_id and period_start = '-infinity'
  for update;

  delete from public.question_reservations
  where user_id = p_user_id and expires_at <= now();

  select count(*) into v_pending
  from public.question_reservations
  where user_id = p_user_id;

  if v_used + v_pending >= p_limit then
    return null;
  end if;

  insert into public.question_reservations (user_id, expires_at)
  values (p_user_id, now() + interval '5 minutes')
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

create or replace function public.commit_question(p_reservation_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_count int;
begin
  delete from public.question_reservations
  where id = p_reservation_id
  returning user_id into v_user_id;

  if v_user_id is null then
    raise exception 'question reservation not found' using errcode = 'P0002';
  end if;

  update public.usage_counters
  set count = count + 1
  where user_id = v_user_id and period_start = '-infinity'
  returning count into v_count;

  return v_count;
end;
$$;

create or replace function public.release_question(p_reservation_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.question_reservations where id = p_reservation_id;
$$;

create or replace function public.question_count(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select count from public.usage_counters
      where user_id = p_user_id and period_start = '-infinity'),
    0
  );
$$;

-- Les privilèges par défaut de Supabase accordent EXECUTE à PUBLIC, anon et authenticated :
-- ces fonctions acceptent un user_id arbitraire, seul le serveur doit pouvoir les appeler.
revoke execute on function public.reserve_question(uuid, int) from public, anon, authenticated;
revoke execute on function public.commit_question(uuid) from public, anon, authenticated;
revoke execute on function public.release_question(uuid) from public, anon, authenticated;
revoke execute on function public.question_count(uuid) from public, anon, authenticated;

grant execute on function public.reserve_question(uuid, int) to service_role;
grant execute on function public.commit_question(uuid) to service_role;
grant execute on function public.release_question(uuid) to service_role;
grant execute on function public.question_count(uuid) to service_role;
