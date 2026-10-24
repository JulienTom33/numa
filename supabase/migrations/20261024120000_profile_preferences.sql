alter table public.profiles
  add column language text not null default 'fr'
    check (language in ('fr')),
  add column tone text not null default 'balanced'
    check (tone in ('gentle', 'balanced', 'direct'));
