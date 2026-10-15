-- Tests onboarding (#18) : isolation des brouillons (RLS), contraintes de
-- précision de l'heure et finalisation via complete_onboarding.

create extension if not exists pgtap with schema extensions;

begin;

select plan(17);

-- Même convention que rls_policies.test.sql : "permission denied" vaut "0 ligne visible".
create or replace function pg_temp.visible_count(query text) returns int
language plpgsql as $$
declare
  n int;
begin
  execute query into n;
  return n;
exception when insufficient_privilege then
  return 0;
end;
$$;

insert into auth.users (id, email) values
  ('55555555-5555-5555-5555-555555555555', 'user-e@test.local'),
  ('66666666-6666-6666-6666-666666666666', 'user-f@test.local');

insert into public.profiles (id) values
  ('55555555-5555-5555-5555-555555555555'),
  ('66666666-6666-6666-6666-666666666666');

insert into public.onboarding_drafts (user_id, current_step, first_name) values
  ('66666666-6666-6666-6666-666666666666', 2, 'Fanny');

-- Contraintes birth_data (rôle postgres, hors RLS).
select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_time, birth_place, latitude, longitude, timezone)
    values ('55555555-5555-5555-5555-555555555555', '1990-01-01', '10:00', 'Paris', 48.85, 2.35, 'Europe/Paris')$$,
  '23514',
  null,
  'birth_data: une heure fournie sans précision déclarée est refusée'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_time, time_precision, birth_place, latitude, longitude, timezone)
    values ('55555555-5555-5555-5555-555555555555', '1990-01-01', '10:00', 'approximate', 'Paris', 48.85, 2.35, 'Europe/Paris')$$,
  '23514',
  null,
  'birth_data: une heure approximative sans marge est refusée'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone)
    values ('55555555-5555-5555-5555-555555555555', '1850-01-01', 'Paris', 48.85, 2.35, 'Europe/Paris')$$,
  '23514',
  null,
  'birth_data: une année de naissance non plausible est refusée'
);

-- En tant que User E (session anonyme ou permanente : rôle authenticated).
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

select throws_ok(
  $$select public.complete_onboarding()$$,
  'P0002',
  null,
  'complete_onboarding: refusé sans brouillon'
);

select lives_ok(
  $$insert into public.onboarding_drafts (user_id, current_step, first_name, birth_date)
    values ('55555555-5555-5555-5555-555555555555', 3, 'Émile', '1990-03-12')$$,
  'onboarding_drafts: User E crée son brouillon'
);

select results_eq(
  $$select user_id from public.onboarding_drafts$$,
  $$values ('55555555-5555-5555-5555-555555555555'::uuid)$$,
  'onboarding_drafts: User E ne voit que son propre brouillon'
);

select throws_ok(
  $$insert into public.onboarding_drafts (user_id, first_name)
    values ('77777777-7777-7777-7777-777777777777', 'intrusion')$$,
  '42501',
  null,
  'onboarding_drafts: User E ne peut pas créer de brouillon pour un autre utilisateur'
);

select lives_ok(
  $$update public.onboarding_drafts set first_name = 'hack' where user_id = '66666666-6666-6666-6666-666666666666'$$,
  'onboarding_drafts: la modification du brouillon de User F ne lève pas d''erreur (0 ligne visible)'
);

select throws_ok(
  $$update public.onboarding_drafts set time_precision = 'vague' where user_id = '55555555-5555-5555-5555-555555555555'$$,
  '23514',
  null,
  'onboarding_drafts: une précision d''heure inconnue du domaine est refusée'
);

select throws_ok(
  $$select public.complete_onboarding()$$,
  '22023',
  null,
  'complete_onboarding: refusé tant que le brouillon est incomplet'
);

update public.onboarding_drafts
set current_step = 5,
    time_precision = 'unknown',
    birth_time = '08:15',
    time_margin = 'over_2_h',
    birth_place = 'Lyon, France',
    latitude = 45.764043,
    longitude = 4.835659,
    timezone = 'Europe/Paris'
where user_id = '55555555-5555-5555-5555-555555555555';

select isnt(
  (select public.complete_onboarding()),
  null,
  'complete_onboarding: une heure inconnue ne bloque pas la finalisation'
);

select results_eq(
  $$select birth_date, birth_time, time_precision, time_margin, birth_place from public.birth_data$$,
  $$values ('1990-03-12'::date, null::time, 'unknown'::text, null::text, 'Lyon, France'::text)$$,
  'complete_onboarding: heure et marge ignorées quand l''heure est inconnue'
);

select is(
  (select display_name from public.profiles),
  'Émile',
  'complete_onboarding: le prénom est enregistré dans le profil'
);

update public.onboarding_drafts
set time_precision = 'approximate', birth_time = '14:30', time_margin = 'under_30_min'
where user_id = '55555555-5555-5555-5555-555555555555';

select lives_ok(
  $$select public.complete_onboarding()$$,
  'complete_onboarding: une nouvelle finalisation après modification réussit'
);

select results_eq(
  $$select birth_time, time_precision, time_margin from public.birth_data$$,
  $$values ('14:30'::time, 'approximate'::text, 'under_30_min'::text)$$,
  'complete_onboarding: la nouvelle finalisation met à jour la même ligne'
);

-- Vérifié hors RLS : User F n'est pas affecté.
reset role;

select is(
  (select first_name from public.onboarding_drafts where user_id = '66666666-6666-6666-6666-666666666666'),
  'Fanny',
  'onboarding_drafts: le brouillon de User F est intact (vérifié hors RLS)'
);

set local role anon;
set local request.jwt.claim.sub = '';

select is(
  pg_temp.visible_count('select count(*) from public.onboarding_drafts'),
  0,
  'onboarding_drafts: le rôle anon (non authentifié) ne voit aucune ligne'
);

reset role;

select * from finish();

rollback;
