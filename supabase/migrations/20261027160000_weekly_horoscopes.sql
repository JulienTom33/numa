create table public.weekly_horoscopes (
  cache_key text primary key,
  week_start date not null,
  sun_sign text not null,
  ascendant_sign text,
  prompt_version text not null,
  engine_version text not null,
  sections jsonb not null,
  factors jsonb not null,
  provider text not null,
  model text not null,
  created_at timestamptz not null default now(),
  check (extract(isodow from week_start) = 1)
);

create index weekly_horoscopes_week_start_idx on public.weekly_horoscopes (week_start);

alter table public.weekly_horoscopes enable row level security;
revoke all on public.weekly_horoscopes from anon, authenticated;
