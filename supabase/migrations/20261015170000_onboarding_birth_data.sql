-- Onboarding (#18) : précision de l'heure de naissance et brouillon d'onboarding
-- repris après rechargement. Toutes les données restent rattachées à auth.uid(),
-- session anonyme comprise (rôle authenticated, is_anonymous = true).

-- Précision de l'heure : conservée pour l'écran résultat, qui doit nuancer
-- ascendant et maisons quand l'heure est approximative ou inconnue.
-- Défaut 'unknown' : les lignes existantes sans heure restent valides, et une
-- insertion qui fournit une heure doit déclarer explicitement sa précision.
alter table public.birth_data
  add column time_precision text not null default 'unknown'
    check (time_precision in ('exact', 'approximate', 'unknown')),
  add column time_margin text
    check (time_margin in ('under_30_min', 'between_30_min_and_2_h', 'over_2_h'));

update public.birth_data set time_precision = 'exact' where birth_time is not null;

alter table public.birth_data
  add constraint birth_data_time_matches_precision
    check ((time_precision = 'unknown') = (birth_time is null)),
  add constraint birth_data_margin_matches_precision
    check ((time_precision = 'approximate') = (time_margin is not null)),
  add constraint birth_data_birth_date_plausible
    check (birth_date >= date '1900-01-01');

-- onboarding_drafts : saisie en cours, une ligne par utilisateur. Champs
-- nullables car l'utilisateur remplit les étapes une à une ; la complétude
-- n'est exigée qu'à la finalisation (complete_onboarding).
create table public.onboarding_drafts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_step smallint not null default 1 check (current_step between 1 and 5),
  first_name text check (char_length(first_name) <= 50),
  birth_date date check (birth_date >= date '1900-01-01'),
  birth_time time,
  time_precision text check (time_precision in ('exact', 'approximate', 'unknown')),
  time_margin text check (time_margin in ('under_30_min', 'between_30_min_and_2_h', 'over_2_h')),
  birth_place text check (char_length(birth_place) <= 200),
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  timezone text check (char_length(timezone) <= 64),
  -- Lien vers la ligne produite à la finalisation : une nouvelle finalisation
  -- (après « Modifier ») met à jour cette ligne au lieu d'en créer une autre.
  birth_data_id uuid references public.birth_data (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.onboarding_drafts enable row level security;

create trigger onboarding_drafts_set_updated_at
  before update on public.onboarding_drafts
  for each row
  execute function public.set_updated_at();

create policy "onboarding_drafts_select_own"
  on public.onboarding_drafts for select
  using (auth.uid() = user_id);

create policy "onboarding_drafts_insert_own"
  on public.onboarding_drafts for insert
  with check (auth.uid() = user_id);

create policy "onboarding_drafts_update_own"
  on public.onboarding_drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "onboarding_drafts_delete_own"
  on public.onboarding_drafts for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.onboarding_drafts to authenticated;

-- Finalise l'onboarding de l'appelant en une transaction : prénom dans le profil,
-- données de naissance dans birth_data. security invoker : les policies RLS de
-- l'appelant s'appliquent à chaque lecture et écriture.
create or replace function public.complete_onboarding()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_draft public.onboarding_drafts;
  v_birth_time time;
  v_margin text;
  v_birth_data_id uuid;
begin
  select * into v_draft
  from public.onboarding_drafts
  where user_id = auth.uid()
  for update;

  if not found then
    raise exception 'onboarding_draft_missing' using errcode = 'P0002';
  end if;

  if coalesce(btrim(v_draft.first_name), '') = ''
    or v_draft.birth_date is null
    or v_draft.time_precision is null
    or (v_draft.time_precision <> 'unknown' and v_draft.birth_time is null)
    or (v_draft.time_precision = 'approximate' and v_draft.time_margin is null)
    or v_draft.birth_place is null
    or v_draft.latitude is null
    or v_draft.longitude is null
    or v_draft.timezone is null
  then
    raise exception 'onboarding_incomplete' using errcode = '22023';
  end if;

  if v_draft.birth_date > current_date then
    raise exception 'birth_date_in_future' using errcode = '22023';
  end if;

  v_birth_time := case when v_draft.time_precision = 'unknown' then null else v_draft.birth_time end;
  v_margin := case when v_draft.time_precision = 'approximate' then v_draft.time_margin else null end;

  insert into public.profiles (id, display_name)
  values (auth.uid(), btrim(v_draft.first_name))
  on conflict (id) do update set display_name = excluded.display_name;

  if v_draft.birth_data_id is not null then
    update public.birth_data
    set birth_date = v_draft.birth_date,
        birth_time = v_birth_time,
        time_precision = v_draft.time_precision,
        time_margin = v_margin,
        birth_place = v_draft.birth_place,
        latitude = v_draft.latitude,
        longitude = v_draft.longitude,
        timezone = v_draft.timezone
    where id = v_draft.birth_data_id
    returning id into v_birth_data_id;
  end if;

  if v_birth_data_id is null then
    insert into public.birth_data (
      user_id, birth_date, birth_time, time_precision, time_margin,
      birth_place, latitude, longitude, timezone
    )
    values (
      auth.uid(), v_draft.birth_date, v_birth_time, v_draft.time_precision, v_margin,
      v_draft.birth_place, v_draft.latitude, v_draft.longitude, v_draft.timezone
    )
    returning id into v_birth_data_id;

    update public.onboarding_drafts
    set birth_data_id = v_birth_data_id
    where user_id = auth.uid();
  end if;

  return v_birth_data_id;
end;
$$;

revoke execute on function public.complete_onboarding() from public, anon;
grant execute on function public.complete_onboarding() to authenticated;
