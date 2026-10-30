create extension if not exists pgtap with schema extensions;

begin;

select plan(7);

select has_table('public', 'monthly_horoscopes', 'monthly_horoscopes existe');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.monthly_horoscopes'::regclass),
  'la RLS est activée'
);
select ok(
  not has_table_privilege('authenticated', 'public.monthly_horoscopes', 'select'),
  'authenticated ne lit pas le cache directement'
);
select ok(
  not has_table_privilege('anon', 'public.monthly_horoscopes', 'insert'),
  'anon ne peut pas écrire dans le cache'
);

select lives_ok(
  $$insert into public.monthly_horoscopes
      (cache_key, month_start, sun_sign, ascendant_sign, prompt_version, engine_version, sections, factors, provider, model)
    values ('2026-10:leo:virgo:v1:e1', '2026-10-01', 'leo', 'virgo', 'v1', 'e1', '{}', '{}', 'stub', 'stub')$$,
  'une lecture mensuelle commençant le premier du mois est enregistrée'
);

select throws_ok(
  $$insert into public.monthly_horoscopes
      (cache_key, month_start, sun_sign, prompt_version, engine_version, sections, factors, provider, model)
    values ('autre', '2026-10-15', 'leo', 'v1', 'e1', '{}', '{}', 'stub', 'stub')$$,
  '23514', null,
  'un mois ne commence pas un autre jour que le premier'
);

select throws_ok(
  $$insert into public.monthly_horoscopes
      (cache_key, month_start, sun_sign, prompt_version, engine_version, sections, factors, provider, model)
    values ('2026-10:leo:virgo:v1:e1', '2026-10-01', 'leo', 'v1', 'e1', '{}', '{}', 'stub', 'stub')$$,
  '23505', null,
  'la clé de cache est unique'
);

select * from finish();

rollback;
