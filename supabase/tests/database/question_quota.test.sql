-- Tests du quota de questions (issue #27) : le client ne peut ni écrire ni réinitialiser son
-- compteur, seules les fonctions serveur (service_role) réservent, valident ou libèrent une
-- question, une erreur fournisseur ne consomme rien et la 3e question est refusée.

create extension if not exists pgtap with schema extensions;

begin;

select plan(22);

insert into auth.users (id, email) values
  ('55555555-5555-5555-5555-555555555555', 'user-e@test.local'),
  ('66666666-6666-6666-6666-666666666666', 'user-f@test.local');

insert into public.usage_counters (user_id, period_start, count) values
  ('55555555-5555-5555-5555-555555555555', '-infinity', 0);

select hasnt_function(
  'public', 'increment_usage_counter', array['date'],
  'increment_usage_counter: la fonction appelable par le client a été supprimée'
);

-- Le client (session anonyme = rôle authenticated) ne peut pas toucher au compteur.
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

select throws_ok(
  $$update public.usage_counters set count = 0 where user_id = '55555555-5555-5555-5555-555555555555'$$,
  '42501', null,
  'usage_counters: le client ne peut pas modifier son compteur'
);

select throws_ok(
  $$delete from public.usage_counters where user_id = '55555555-5555-5555-5555-555555555555'$$,
  '42501', null,
  'usage_counters: le client ne peut pas supprimer (réinitialiser) son compteur'
);

select throws_ok(
  $$insert into public.usage_counters (user_id, period_start, count)
    values ('55555555-5555-5555-5555-555555555555', '2026-01-01', 0)$$,
  '42501', null,
  'usage_counters: le client ne peut pas créer de compteur'
);

select throws_ok(
  $$select public.reserve_question('55555555-5555-5555-5555-555555555555', 100)$$,
  '42501', null,
  'reserve_question: non exécutable par le client'
);

select throws_ok(
  $$select public.commit_question(gen_random_uuid())$$,
  '42501', null,
  'commit_question: non exécutable par le client'
);

select throws_ok(
  $$select public.release_question(gen_random_uuid())$$,
  '42501', null,
  'release_question: non exécutable par le client'
);

select throws_ok(
  $$select public.question_count('55555555-5555-5555-5555-555555555555')$$,
  '42501', null,
  'question_count: non exécutable par le client'
);

select throws_ok(
  $$select count(*) from public.question_reservations$$,
  '42501', null,
  'question_reservations: table inaccessible au client'
);

reset role;
set local role anon;

select throws_ok(
  $$select public.reserve_question('55555555-5555-5555-5555-555555555555', 100)$$,
  '42501', null,
  'reserve_question: non exécutable par le rôle anon'
);

reset role;

-- Parcours serveur (Edge Function avec la clé secrète).
set local role service_role;

select set_config('test.r1', public.reserve_question('55555555-5555-5555-5555-555555555555', 2)::text, true);

select isnt(current_setting('test.r1'), '', 'reserve_question: 1re question réservée');

select is(
  public.commit_question(current_setting('test.r1')::uuid), 1,
  'commit_question: la 1re réponse réussie compte 1 question'
);

-- Erreur fournisseur : la réservation est libérée, aucune question consommée.
select set_config('test.r2', public.reserve_question('55555555-5555-5555-5555-555555555555', 2)::text, true);
select lives_ok(
  format('select public.release_question(%L::uuid)', current_setting('test.r2')),
  'release_question: libère la réservation après une erreur fournisseur'
);

select is(
  public.question_count('55555555-5555-5555-5555-555555555555'), 1,
  'question_count: une erreur fournisseur ne consomme pas de question'
);

select set_config('test.r3', public.reserve_question('55555555-5555-5555-5555-555555555555', 2)::text, true);
select is(
  public.commit_question(current_setting('test.r3')::uuid), 2,
  'commit_question: la 2e réponse est validée'
);

select is(
  public.reserve_question('55555555-5555-5555-5555-555555555555', 2), null,
  'reserve_question: la 3e question est refusée'
);

select throws_ok(
  format('select public.commit_question(%L::uuid)', current_setting('test.r3')),
  'P0002', null,
  'commit_question: une réservation ne peut pas être validée deux fois'
);

-- Requêtes simultanées : deux réservations en cours occupent les deux places.
select isnt(
  public.reserve_question('66666666-6666-6666-6666-666666666666', 2), null,
  'reserve_question: 1re réservation simultanée acceptée'
);
select isnt(
  public.reserve_question('66666666-6666-6666-6666-666666666666', 2), null,
  'reserve_question: 2e réservation simultanée acceptée'
);
select is(
  public.reserve_question('66666666-6666-6666-6666-666666666666', 2), null,
  'reserve_question: une 3e réservation simultanée est refusée'
);

reset role;

-- Une réservation abandonnée (fonction interrompue) expire et libère sa place.
update public.question_reservations
set expires_at = now() - interval '1 second'
where user_id = '66666666-6666-6666-6666-666666666666';

set local role service_role;
select isnt(
  public.reserve_question('66666666-6666-6666-6666-666666666666', 2), null,
  'reserve_question: une réservation expirée libère sa place'
);
reset role;

-- Le client lit toujours son propre compteur (affichage).
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

select is(
  (select count from public.usage_counters
    where user_id = '55555555-5555-5555-5555-555555555555' and period_start = '-infinity'),
  2,
  'usage_counters: le client lit son compteur'
);

reset role;

select * from finish();

rollback;
