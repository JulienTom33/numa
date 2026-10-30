create table public.monthly_horoscopes (
  cache_key text primary key,
  month_start date not null,
  sun_sign text not null,
  ascendant_sign text,
  prompt_version text not null,
  engine_version text not null,
  sections jsonb not null,
  factors jsonb not null,
  provider text not null,
  model text not null,
  created_at timestamptz not null default now(),
  check (extract(day from month_start) = 1)
);

create index monthly_horoscopes_month_start_idx on public.monthly_horoscopes (month_start);

alter table public.monthly_horoscopes enable row level security;
revoke all on public.monthly_horoscopes from anon, authenticated;
