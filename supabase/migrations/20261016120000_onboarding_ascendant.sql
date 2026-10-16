alter table public.birth_data
  add column declared_ascendant_sign text
    check (declared_ascendant_sign in (
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
    )),
  add column ascendant_source text
    check (ascendant_source in ('computed', 'declared')),
  add constraint birth_data_ascendant_source_matches_sign
    check (coalesce(ascendant_source = 'declared', false) = (declared_ascendant_sign is not null));

alter table public.onboarding_drafts
  add column declared_ascendant_sign text
    check (declared_ascendant_sign in (
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
    )),
  add column ascendant_source text
    check (ascendant_source in ('computed', 'declared')),
  add constraint onboarding_drafts_ascendant_source_matches_sign
    check (coalesce(ascendant_source = 'declared', false) = (declared_ascendant_sign is not null));

alter table public.onboarding_drafts
  drop constraint onboarding_drafts_current_step_check,
  add constraint onboarding_drafts_current_step_check check (current_step between 1 and 6);

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
        timezone = v_draft.timezone,
        declared_ascendant_sign = v_draft.declared_ascendant_sign,
        ascendant_source = v_draft.ascendant_source
    where id = v_draft.birth_data_id
    returning id into v_birth_data_id;
  end if;

  if v_birth_data_id is null then
    insert into public.birth_data (
      user_id, birth_date, birth_time, time_precision, time_margin,
      birth_place, latitude, longitude, timezone,
      declared_ascendant_sign, ascendant_source
    )
    values (
      auth.uid(), v_draft.birth_date, v_birth_time, v_draft.time_precision, v_margin,
      v_draft.birth_place, v_draft.latitude, v_draft.longitude, v_draft.timezone,
      v_draft.declared_ascendant_sign, v_draft.ascendant_source
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
