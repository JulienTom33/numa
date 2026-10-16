-- Tests ascendant d'onboarding (#80) : contraintes de signe et de source,
-- étape 6 du brouillon et recopie par complete_onboarding.

create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

insert into auth.users (id, email) values
  ('88888888-8888-8888-8888-888888888888', 'user-g@test.local');

insert into public.profiles (id) values
  ('88888888-8888-8888-8888-888888888888');

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone, ascendant_source, declared_ascendant_sign)
    values ('88888888-8888-8888-8888-888888888888', '1990-01-01', 'Paris', 48.85, 2.35, 'Europe/Paris', 'declared', 'ophiuchus')$$,
  '23514',
  null,
  'birth_data: un signe hors des douze signes est refusé'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone, ascendant_source)
    values ('88888888-8888-8888-8888-888888888888', '1990-01-01', 'Paris', 48.85, 2.35, 'Europe/Paris', 'declared')$$,
  '23514',
  null,
  'birth_data: une source déclarée sans signe est refusée'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone, ascendant_source, declared_ascendant_sign)
    values ('88888888-8888-8888-8888-888888888888', '1990-01-01', 'Paris', 48.85, 2.35, 'Europe/Paris', 'computed', 'leo')$$,
  '23514',
  null,
  'birth_data: un signe déclaré avec une source calculée est refusé'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone, ascendant_source)
    values ('88888888-8888-8888-8888-888888888888', '1990-01-01', 'Paris', 48.85, 2.35, 'Europe/Paris', 'guess')$$,
  '23514',
  null,
  'birth_data: une source inconnue est refusée'
);

select throws_ok(
  $$insert into public.onboarding_drafts (user_id, current_step, ascendant_source)
    values ('88888888-8888-8888-8888-888888888888', 6, 'declared')$$,
  '23514',
  null,
  'onboarding_drafts: une source déclarée sans signe est refusée'
);

select throws_ok(
  $$insert into public.onboarding_drafts (user_id, current_step)
    values ('88888888-8888-8888-8888-888888888888', 7)$$,
  '23514',
  null,
  'onboarding_drafts: l''étape 7 est refusée'
);

set local role authenticated;
set local request.jwt.claim.sub = '88888888-8888-8888-8888-888888888888';

select lives_ok(
  $$insert into public.onboarding_drafts (
      user_id, current_step, first_name, birth_date, time_precision, birth_time,
      birth_place, latitude, longitude, timezone, ascendant_source, declared_ascendant_sign
    ) values (
      '88888888-8888-8888-8888-888888888888', 6, 'Gaëlle', '1990-03-12', 'exact', '14:30',
      'Lyon, France', 45.764043, 4.835659, 'Europe/Paris', 'declared', 'scorpio'
    )$$,
  'onboarding_drafts: l''étape 6 avec un ascendant déclaré est acceptée'
);

select isnt(
  (select public.complete_onboarding()),
  null,
  'complete_onboarding: finalisation avec ascendant déclaré'
);

select results_eq(
  $$select ascendant_source, declared_ascendant_sign from public.birth_data$$,
  $$values ('declared'::text, 'scorpio'::text)$$,
  'complete_onboarding: la source et le signe déclaré sont recopiés dans birth_data'
);

select * from finish();

rollback;
