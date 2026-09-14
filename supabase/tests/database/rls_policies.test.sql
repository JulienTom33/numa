-- Tests RLS : un utilisateur ne doit jamais lire/modifier les données d'un
-- autre utilisateur, y compris en tant qu'utilisateur anonyme ou non authentifié.
-- Exécuté via `supabase test db` (pgTAP).

create extension if not exists pgtap with schema extensions;

begin;

select plan(23);

-- Deux utilisateurs de test, créés directement (bypass RLS, rôle postgres).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user-a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@test.local');

insert into public.profiles (id, display_name) values
  ('11111111-1111-1111-1111-111111111111', 'User A'),
  ('22222222-2222-2222-2222-222222222222', 'User B');

insert into public.birth_data (id, user_id, birth_date, birth_place, latitude, longitude, timezone) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '1990-01-01', 'Paris', 48.856613, 2.352222, 'Europe/Paris'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '1991-02-02', 'Lyon', 45.764043, 4.835659, 'Europe/Paris');

insert into public.natal_charts (id, user_id, birth_data_id, chart_data) values
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '{}'),
  ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '{}');

insert into public.daily_horoscopes (id, user_id, natal_chart_id, horoscope_date, content) values
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '2026-01-01', 'Contenu A'),
  ('d2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', '2026-01-01', 'Contenu B');

insert into public.conversations (id, user_id, title) values
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Conv A'),
  ('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Conv B');

insert into public.messages (id, conversation_id, role, content) values
  ('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'user', 'Message A'),
  ('f2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'user', 'Message B');

insert into public.usage_counters (id, user_id, period_start, count) values
  ('11111111-aaaa-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-01-01', 1),
  ('22222222-bbbb-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '2026-01-01', 1);

-- En tant que User A : accès nominal (ses propres données) + accès interdit (données de User B).
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$select id from public.profiles order by id$$,
  $$values ('11111111-1111-1111-1111-111111111111'::uuid)$$,
  'profiles: User A ne voit que son propre profil'
);

select results_eq(
  $$select id from public.birth_data order by id$$,
  $$values ('a1111111-1111-1111-1111-111111111111'::uuid)$$,
  'birth_data: User A ne voit que ses propres données de naissance'
);

select results_eq(
  $$select id from public.natal_charts order by id$$,
  $$values ('c1111111-1111-1111-1111-111111111111'::uuid)$$,
  'natal_charts: User A ne voit que son propre thème natal'
);

select results_eq(
  $$select id from public.daily_horoscopes order by id$$,
  $$values ('d1111111-1111-1111-1111-111111111111'::uuid)$$,
  'daily_horoscopes: User A ne voit que son propre horoscope'
);

select results_eq(
  $$select id from public.conversations order by id$$,
  $$values ('e1111111-1111-1111-1111-111111111111'::uuid)$$,
  'conversations: User A ne voit que sa propre conversation'
);

select results_eq(
  $$select id from public.messages order by id$$,
  $$values ('f1111111-1111-1111-1111-111111111111'::uuid)$$,
  'messages: User A ne voit que les messages de sa propre conversation'
);

select results_eq(
  $$select id from public.usage_counters order by id$$,
  $$values ('11111111-aaaa-1111-1111-111111111111'::uuid)$$,
  'usage_counters: User A ne voit que son propre compteur'
);

-- Écriture interdite sur les données de User B (filtrée par USING, 0 ligne affectée, pas d'erreur).
select lives_ok(
  $$update public.profiles set display_name = 'hack' where id = '22222222-2222-2222-2222-222222222222'$$,
  'profiles: la tentative de modification du profil de User B ne lève pas d''erreur (0 ligne visible)'
);

select is(
  (select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222' and display_name = 'hack'),
  null,
  'profiles: la tentative de modification du profil de User B n''a rien changé'
);

select throws_ok(
  $$insert into public.messages (conversation_id, role, content) values ('e2222222-2222-2222-2222-222222222222', 'user', 'intrusion')$$,
  '42501',
  null,
  'messages: User A ne peut pas insérer un message dans la conversation de User B'
);

select lives_ok(
  $$delete from public.daily_horoscopes where id = 'd2222222-2222-2222-2222-222222222222'$$,
  'daily_horoscopes: la tentative de suppression de l''horoscope de User B ne lève pas d''erreur (0 ligne visible)'
);

-- Vérifié hors RLS (rôle postgres) : la ligne de User B, invisible à User A,
-- doit persister après la tentative de suppression ci-dessus.
reset role;

select is(
  (select count(*)::int from public.daily_horoscopes where id = 'd2222222-2222-2222-2222-222222222222'),
  1,
  'daily_horoscopes: l''horoscope de User B existe toujours (vérifié hors RLS)'
);

-- Reset : impersonation de User B pour vérifier la symétrie de l'isolation.
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select results_eq(
  $$select id from public.profiles order by id$$,
  $$values ('22222222-2222-2222-2222-222222222222'::uuid)$$,
  'profiles: User B ne voit que son propre profil'
);

select results_eq(
  $$select id from public.conversations order by id$$,
  $$values ('e2222222-2222-2222-2222-222222222222'::uuid)$$,
  'conversations: User B ne voit que sa propre conversation'
);

select results_eq(
  $$select id from public.messages order by id$$,
  $$values ('f2222222-2222-2222-2222-222222222222'::uuid)$$,
  'messages: User B ne voit que les messages de sa propre conversation'
);

-- Rôle Postgres anon (appel API non authentifié, sans session) : aucun GRANT
-- sur les tables user-data, donc refus net (permission denied), pas juste
-- filtré par RLS. Les "sessions anonymes" Numa (découverte sans compte)
-- s'authentifient avec le rôle authenticated (auth.users.is_anonymous = true)
-- et sont déjà couvertes par les policies testées ci-dessus (User A / User B).
reset role;
set local role anon;

select throws_ok(
  $$select count(*) from public.profiles$$,
  '42501', null,
  'profiles: le rôle anon (non authentifié) n''a aucun accès'
);

select throws_ok(
  $$select count(*) from public.birth_data$$,
  '42501', null,
  'birth_data: le rôle anon (non authentifié) n''a aucun accès'
);

select throws_ok(
  $$select count(*) from public.natal_charts$$,
  '42501', null,
  'natal_charts: le rôle anon (non authentifié) n''a aucun accès'
);

select throws_ok(
  $$select count(*) from public.daily_horoscopes$$,
  '42501', null,
  'daily_horoscopes: le rôle anon (non authentifié) n''a aucun accès'
);

select throws_ok(
  $$select count(*) from public.conversations$$,
  '42501', null,
  'conversations: le rôle anon (non authentifié) n''a aucun accès'
);

select throws_ok(
  $$select count(*) from public.messages$$,
  '42501', null,
  'messages: le rôle anon (non authentifié) n''a aucun accès'
);

select throws_ok(
  $$select count(*) from public.usage_counters$$,
  '42501', null,
  'usage_counters: le rôle anon (non authentifié) n''a aucun accès'
);

select throws_ok(
  $$insert into public.profiles (id, display_name) values ('33333333-3333-3333-3333-333333333333', 'intrusion anonyme')$$,
  '42501',
  null,
  'profiles: le rôle anon ne peut pas créer de profil'
);

reset role;

select * from finish();

rollback;
