create extension if not exists pgtap with schema extensions;

begin;

select plan(7);

select has_table('public', 'weekly_horoscopes', 'weekly_horoscopes existe');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.weekly_horoscopes'::regclass),
  'la RLS est activée'
);
select ok(
  not has_table_privilege('authenticated', 'public.weekly_horoscopes', 'select'),
  'authenticated ne lit pas le cache directement'
);
select ok(
  not has_table_privilege('anon', 'public.weekly_horoscopes', 'insert'),
  'anon ne peut pas écrire dans le cache'
);

select lives_ok(
  $$insert into public.weekly_horoscopes
      (cache_key, week_start, sun_sign, ascendant_sign, prompt_version, engine_version, sections, factors, provider, model)
    values ('2026-W44:leo:virgo:v1:e1', '2026-10-26', 'leo', 'virgo', 'v1', 'e1', '{}', '{}', 'stub', 'stub')$$,
  'une lecture hebdomadaire commençant un lundi est enregistrée'
);

select throws_ok(
  $$insert into public.weekly_horoscopes
      (cache_key, week_start, sun_sign, prompt_version, engine_version, sections, factors, provider, model)
    values ('autre', '2026-10-27', 'leo', 'v1', 'e1', '{}', '{}', 'stub', 'stub')$$,
  '23514', null,
  'une semaine ne commence pas un autre jour que lundi'
);

select throws_ok(
  $$insert into public.weekly_horoscopes
      (cache_key, week_start, sun_sign, prompt_version, engine_version, sections, factors, provider, model)
    values ('2026-W44:leo:virgo:v1:e1', '2026-10-26', 'leo', 'v1', 'e1', '{}', '{}', 'stub', 'stub')$$,
  '23505', null,
  'la clé de cache est unique'
);

select * from finish();

rollback;
