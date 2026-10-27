alter table public.daily_horoscopes
  add column sections jsonb,
  add column factors jsonb,
  add column prompt_version text,
  add column provider text,
  add column model text,
  add constraint daily_horoscopes_traceability_check check (
    (
      sections is null
      and factors is null
      and prompt_version is null
      and provider is null
      and model is null
    )
    or (
      sections is not null
      and factors is not null
      and prompt_version is not null
      and provider is not null
      and model is not null
    )
  );

drop policy "daily_horoscopes_insert_own" on public.daily_horoscopes;
drop policy "daily_horoscopes_update_own" on public.daily_horoscopes;

revoke insert, update on public.daily_horoscopes from authenticated;
