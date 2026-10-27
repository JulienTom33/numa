create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'user-j@test.local'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'user-k@test.local');

insert into public.birth_data (id, user_id, birth_date, birth_place, latitude, longitude, timezone) values
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', '1990-01-01', 'Paris', 48.85, 2.35, 'Europe/Paris');

insert into public.natal_charts (id, user_id, birth_data_id, chart_data, cache_key) values
  ('c0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-00000000000a', '{}', repeat('j', 64));

select has_column('public', 'daily_horoscopes', 'sections', 'daily_horoscopes.sections existe');
select has_column('public', 'daily_horoscopes', 'factors', 'daily_horoscopes.factors existe');
select has_column('public', 'daily_horoscopes', 'prompt_version', 'daily_horoscopes.prompt_version existe');
select has_column('public', 'daily_horoscopes', 'provider', 'daily_horoscopes.provider existe');
select has_column('public', 'daily_horoscopes', 'model', 'daily_horoscopes.model existe');

select lives_ok(
  $$insert into public.daily_horoscopes
      (user_id, natal_chart_id, horoscope_date, content, sections, factors, prompt_version, provider, model)
    values (
      'aaaaaaaa-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', '2026-10-27',
      'Texte', '{"general":"a","relations":"b","work":"c","energy":"d"}', '{"transits":{}}',
      'sidera-horoscope-v1', 'mistral', 'mistral-small-latest')$$,
  'une lecture complète est enregistrée avec sa date et sa version'
);

select throws_ok(
  $$insert into public.daily_horoscopes
      (user_id, natal_chart_id, horoscope_date, content, sections)
    values (
      'aaaaaaaa-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', '2026-10-28',
      'Texte', '{}')$$,
  '23514', null,
  'une lecture sans version, fournisseur ni facteurs est refusée'
);

select throws_ok(
  $$insert into public.daily_horoscopes
      (user_id, natal_chart_id, horoscope_date, content, sections, factors, prompt_version, provider, model)
    values (
      'aaaaaaaa-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', '2026-10-27',
      'Doublon', '{}', '{}', 'v', 'p', 'm')$$,
  '23505', null,
  'une seule lecture par utilisateur et par date'
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-00000000000a';

select is(
  (select prompt_version from public.daily_horoscopes),
  'sidera-horoscope-v1',
  'le propriétaire lit la version du prompt de sa lecture'
);

select throws_ok(
  $$insert into public.daily_horoscopes (user_id, natal_chart_id, horoscope_date, content)
    values ('aaaaaaaa-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', '2026-10-29', 'forgé')$$,
  '42501', null,
  'le client ne peut pas écrire de lecture'
);

select throws_ok(
  $$update public.daily_horoscopes set content = 'modifié'$$,
  '42501', null,
  'le client ne peut pas modifier une lecture'
);

set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-00000000000b';

select is(
  (select count(*)::int from public.daily_horoscopes),
  0,
  'un autre utilisateur ne voit aucune lecture'
);

select * from finish();

rollback;
