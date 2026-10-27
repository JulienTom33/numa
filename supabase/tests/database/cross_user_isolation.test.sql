-- Tests d'isolation des données (issue #35) : complètent rls_policies.test.sql et les tests
-- par fonctionnalité en couvrant les accès croisés manquants (écriture sur les données d'un
-- autre utilisateur, identifiant modifié, jeton sans identité, anon en écriture et en RPC).

create extension if not exists pgtap with schema extensions;

begin;

select * from no_plan();

-- Nombre de lignes affectées par une instruction ; un refus de privilège ou de policy
-- (SQLSTATE 42501) équivaut à 0 ligne affectée : dans les deux cas rien n'est modifié.
create or replace function pg_temp.affected_rows(query text) returns int
language plpgsql as $$
declare
  n int;
begin
  execute query;
  get diagnostics n = row_count;
  return n;
exception when insufficient_privilege then
  return 0;
end;
$$;

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
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'iso-a@test.local'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'iso-b@test.local');

insert into public.profiles (id, display_name) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Iso A'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Iso B');

insert into public.birth_data (id, user_id, birth_date, birth_place, latitude, longitude, timezone) values
  ('aaaaaaaa-1000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', '1990-01-01', 'Paris', 48.856613, 2.352222, 'Europe/Paris'),
  ('bbbbbbbb-1000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-00000000000b', '1991-02-02', 'Lyon', 45.764043, 4.835659, 'Europe/Paris');

insert into public.natal_charts (id, user_id, birth_data_id, chart_data, cache_key) values
  ('aaaaaaaa-2000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-1000-0000-0000-00000000000a', '{}', repeat('a', 64)),
  ('bbbbbbbb-2000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-1000-0000-0000-00000000000b', '{}', repeat('b', 64));

insert into public.daily_horoscopes (id, user_id, natal_chart_id, horoscope_date, content) values
  ('aaaaaaaa-3000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-2000-0000-0000-00000000000a', '2026-01-01', 'Contenu A'),
  ('bbbbbbbb-3000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-2000-0000-0000-00000000000b', '2026-01-01', 'Contenu B');

insert into public.conversations (id, user_id, title) values
  ('aaaaaaaa-4000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', 'Conv A'),
  ('bbbbbbbb-4000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-00000000000b', 'Conv B');

insert into public.messages (id, conversation_id, role, content) values
  ('aaaaaaaa-5000-0000-0000-00000000000a', 'aaaaaaaa-4000-0000-0000-00000000000a', 'user', 'Message A'),
  ('bbbbbbbb-5000-0000-0000-00000000000b', 'bbbbbbbb-4000-0000-0000-00000000000b', 'user', 'Message B');

insert into public.usage_counters (id, user_id, period_start, count) values
  ('aaaaaaaa-6000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', '2026-01-01', 1),
  ('bbbbbbbb-6000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-00000000000b', '2026-01-01', 1);

insert into public.onboarding_drafts (user_id, first_name) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Draft A'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Draft B');

insert into public.question_reservations (id, user_id, expires_at) values
  ('bbbbbbbb-7000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-00000000000b', now() + interval '5 minutes');

insert into public.rate_limits (key, window_start, count) values
  ('iso:b', now(), 1);

select is(
  (select count(*)::int
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0,
  'catalogue: toutes les tables du schéma public ont la RLS activée'
);

select is(
  (select count(*)::int from pg_policies
   where schemaname = 'public' and (qual = 'true' or with_check = 'true')),
  0,
  'catalogue: aucune policy permissive inconditionnelle sur le schéma public'
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-00000000000a';

select is(
  pg_temp.affected_rows($$update public.birth_data set birth_place = 'Paris' where id = 'aaaaaaaa-1000-0000-0000-00000000000a'$$),
  1,
  'témoin: User A modifie ses propres données de naissance'
);

select is(
  pg_temp.affected_rows($$insert into public.messages (conversation_id, role, content) values ('aaaaaaaa-4000-0000-0000-00000000000a', 'user', 'Question A2')$$),
  1,
  'témoin: User A pose une question dans sa propre conversation'
);

select is(pg_temp.visible_count($$select count(*) from public.birth_data where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'birth_data: User A ne lit pas les données de User B, même en filtrant sur son user_id');
select is(pg_temp.visible_count($$select count(*) from public.birth_data where id = 'bbbbbbbb-1000-0000-0000-00000000000b'$$), 0,
  'birth_data: lecture par identifiant modifié refusée');
select is(pg_temp.visible_count($$select count(*) from public.natal_charts where id = 'bbbbbbbb-2000-0000-0000-00000000000b'$$), 0,
  'natal_charts: lecture par identifiant modifié refusée');
select is(pg_temp.visible_count($$select count(*) from public.daily_horoscopes where id = 'bbbbbbbb-3000-0000-0000-00000000000b'$$), 0,
  'daily_horoscopes: lecture par identifiant modifié refusée');
select is(pg_temp.visible_count($$select count(*) from public.conversations where id = 'bbbbbbbb-4000-0000-0000-00000000000b'$$), 0,
  'conversations: lecture par identifiant modifié refusée');
select is(pg_temp.visible_count($$select count(*) from public.messages where conversation_id = 'bbbbbbbb-4000-0000-0000-00000000000b'$$), 0,
  'messages: lecture par conversation_id modifié refusée');
select is(pg_temp.visible_count($$select count(*) from public.usage_counters where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'usage_counters: User A ne lit pas le compteur de User B');
select is(pg_temp.visible_count($$select count(*) from public.onboarding_drafts where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'onboarding_drafts: User A ne lit pas le brouillon de User B');
select is(pg_temp.visible_count($$select count(*) from public.question_reservations$$), 0,
  'question_reservations: inaccessible au client');
select is(pg_temp.visible_count($$select count(*) from public.rate_limits$$), 0,
  'rate_limits: inaccessible au client');

select is(pg_temp.affected_rows($$update public.profiles set display_name = 'hack' where id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'profiles: modification du profil de User B sans effet');
select is(pg_temp.affected_rows($$delete from public.profiles where id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'profiles: suppression du profil de User B sans effet');
select is(pg_temp.affected_rows($$insert into public.profiles (id, display_name) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'usurpation')$$), 0,
  'profiles: création d''un profil pour User B refusée');
select is(pg_temp.affected_rows($$update public.birth_data set birth_place = 'hack' where id = 'bbbbbbbb-1000-0000-0000-00000000000b'$$), 0,
  'birth_data: modification des données de User B sans effet');
select is(pg_temp.affected_rows($$delete from public.birth_data where id = 'bbbbbbbb-1000-0000-0000-00000000000b'$$), 0,
  'birth_data: suppression des données de User B sans effet');
select is(pg_temp.affected_rows($$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone) values ('bbbbbbbb-0000-0000-0000-00000000000b', '1990-01-01', 'Intrus', 0, 0, 'UTC')$$), 0,
  'birth_data: insertion au nom de User B refusée');
select is(pg_temp.affected_rows($$insert into public.natal_charts (user_id, birth_data_id, chart_data, cache_key) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-1000-0000-0000-00000000000b', '{}', repeat('c', 64))$$), 0,
  'natal_charts: insertion au nom de User B refusée');
select is(pg_temp.affected_rows($$delete from public.natal_charts where id = 'bbbbbbbb-2000-0000-0000-00000000000b'$$), 0,
  'natal_charts: suppression du thème de User B sans effet');
select is(pg_temp.affected_rows($$insert into public.daily_horoscopes (user_id, natal_chart_id, horoscope_date, content) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-2000-0000-0000-00000000000b', '2026-02-02', 'Intrus')$$), 0,
  'daily_horoscopes: insertion au nom de User B refusée');
select is(pg_temp.affected_rows($$update public.daily_horoscopes set content = 'hack' where id = 'bbbbbbbb-3000-0000-0000-00000000000b'$$), 0,
  'daily_horoscopes: modification de l''horoscope de User B sans effet');
select is(pg_temp.affected_rows($$update public.conversations set title = 'hack' where id = 'bbbbbbbb-4000-0000-0000-00000000000b'$$), 0,
  'conversations: modification de la conversation de User B sans effet');
select is(pg_temp.affected_rows($$delete from public.conversations where id = 'bbbbbbbb-4000-0000-0000-00000000000b'$$), 0,
  'conversations: suppression de la conversation de User B sans effet');
select is(pg_temp.affected_rows($$insert into public.conversations (user_id, title) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'Intrus')$$), 0,
  'conversations: création au nom de User B refusée');
select is(pg_temp.affected_rows($$update public.messages set content = 'hack' where id = 'bbbbbbbb-5000-0000-0000-00000000000b'$$), 0,
  'messages: modification du message de User B sans effet');
select is(pg_temp.affected_rows($$delete from public.messages where id = 'bbbbbbbb-5000-0000-0000-00000000000b'$$), 0,
  'messages: suppression du message de User B sans effet');
select is(pg_temp.affected_rows($$update public.usage_counters set count = 0 where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'usage_counters: modification du compteur de User B sans effet');
select is(pg_temp.affected_rows($$delete from public.usage_counters where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'usage_counters: suppression du compteur de User B sans effet');
select is(pg_temp.affected_rows($$update public.onboarding_drafts set first_name = 'hack' where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'onboarding_drafts: modification du brouillon de User B sans effet');
select is(pg_temp.affected_rows($$delete from public.onboarding_drafts where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$$), 0,
  'onboarding_drafts: suppression du brouillon de User B sans effet');
select is(pg_temp.affected_rows($$insert into public.onboarding_drafts (user_id, first_name) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'Intrus')$$), 0,
  'onboarding_drafts: insertion au nom de User B refusée');
select is(pg_temp.affected_rows($$delete from public.question_reservations$$), 0,
  'question_reservations: suppression refusée au client');
select is(pg_temp.affected_rows($$delete from public.rate_limits$$), 0,
  'rate_limits: suppression refusée au client');

select throws_ok(
  $$update public.conversations set user_id = 'bbbbbbbb-0000-0000-0000-00000000000b' where id = 'aaaaaaaa-4000-0000-0000-00000000000a'$$,
  '42501', null,
  'conversations: User A ne peut pas transférer sa conversation à User B'
);
select throws_ok(
  $$update public.birth_data set user_id = 'bbbbbbbb-0000-0000-0000-00000000000b' where id = 'aaaaaaaa-1000-0000-0000-00000000000a'$$,
  '42501', null,
  'birth_data: User A ne peut pas transférer ses données à User B'
);
select throws_ok(
  $$update public.profiles set id = 'bbbbbbbb-0000-0000-0000-00000000000b' where id = 'aaaaaaaa-0000-0000-0000-00000000000a'$$,
  '42501', null,
  'profiles: User A ne peut pas prendre l''identifiant de User B'
);

reset role;

select is((select count(*)::int from public.profiles where id = 'bbbbbbbb-0000-0000-0000-00000000000b' and display_name = 'Iso B'), 1,
  'hors RLS: le profil de User B est intact');
select is((select count(*)::int from public.birth_data where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b' and birth_place = 'Lyon'), 1,
  'hors RLS: les données de naissance de User B sont intactes et uniques');
select is((select count(*)::int from public.natal_charts where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'), 1,
  'hors RLS: le thème natal de User B est intact et unique');
select is((select count(*)::int from public.daily_horoscopes where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b' and content = 'Contenu B'), 1,
  'hors RLS: l''horoscope de User B est intact et unique');
select is((select count(*)::int from public.conversations where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b' and title = 'Conv B'), 1,
  'hors RLS: la conversation de User B est intacte et unique');
select is((select count(*)::int from public.messages where conversation_id = 'bbbbbbbb-4000-0000-0000-00000000000b' and content = 'Message B'), 1,
  'hors RLS: le message de User B est intact et unique');
select is((select count from public.usage_counters where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b'), 1,
  'hors RLS: le compteur de User B est intact');
select is((select count(*)::int from public.onboarding_drafts where user_id = 'bbbbbbbb-0000-0000-0000-00000000000b' and first_name = 'Draft B'), 1,
  'hors RLS: le brouillon de User B est intact et unique');
select is((select count(*)::int from public.question_reservations), 1,
  'hors RLS: la réservation de question est intacte');
select is((select count(*)::int from public.rate_limits where key = 'iso:b'), 1,
  'hors RLS: le compteur de rate limit est intact');
select is((select count(*)::int from public.conversations where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a'), 1,
  'hors RLS: la conversation de User A n''a pas été transférée');

set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-00000000000b';

select is(pg_temp.visible_count($$select count(*) from public.messages where content like '%A%'$$), 0,
  'messages: User B ne voit aucun message de User A, y compris celui ajouté par A');
select is(pg_temp.visible_count($$select count(*) from public.birth_data where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$$), 0,
  'birth_data: symétrie, User B ne lit pas les données de User A');
select is(pg_temp.affected_rows($$delete from public.conversations where id = 'aaaaaaaa-4000-0000-0000-00000000000a'$$), 0,
  'conversations: symétrie, User B ne supprime pas la conversation de User A');

reset role;

set local role authenticated;
set local request.jwt.claim.sub = '';

select is(pg_temp.visible_count('select count(*) from public.profiles'), 0, 'jeton sans identité: profiles invisible');
select is(pg_temp.visible_count('select count(*) from public.birth_data'), 0, 'jeton sans identité: birth_data invisible');
select is(pg_temp.visible_count('select count(*) from public.natal_charts'), 0, 'jeton sans identité: natal_charts invisible');
select is(pg_temp.visible_count('select count(*) from public.daily_horoscopes'), 0, 'jeton sans identité: daily_horoscopes invisible');
select is(pg_temp.visible_count('select count(*) from public.conversations'), 0, 'jeton sans identité: conversations invisible');
select is(pg_temp.visible_count('select count(*) from public.messages'), 0, 'jeton sans identité: messages invisible');
select is(pg_temp.visible_count('select count(*) from public.usage_counters'), 0, 'jeton sans identité: usage_counters invisible');
select is(pg_temp.visible_count('select count(*) from public.onboarding_drafts'), 0, 'jeton sans identité: onboarding_drafts invisible');
select is(pg_temp.affected_rows($$insert into public.conversations (user_id, title) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'Intrus')$$), 0,
  'jeton sans identité: création de conversation refusée');

reset role;
set local role anon;
set local request.jwt.claim.sub = '';

select is(pg_temp.visible_count('select count(*) from public.onboarding_drafts'), 0, 'anon: onboarding_drafts invisible');
select is(pg_temp.visible_count('select count(*) from public.question_reservations'), 0, 'anon: question_reservations invisible');
select is(pg_temp.visible_count('select count(*) from public.rate_limits'), 0, 'anon: rate_limits invisible');

select is(pg_temp.affected_rows($$update public.profiles set display_name = 'hack'$$), 0, 'anon: modification de profiles sans effet');
select is(pg_temp.affected_rows($$delete from public.profiles$$), 0, 'anon: suppression de profiles sans effet');
select is(pg_temp.affected_rows($$update public.birth_data set birth_place = 'hack'$$), 0, 'anon: modification de birth_data sans effet');
select is(pg_temp.affected_rows($$delete from public.birth_data$$), 0, 'anon: suppression de birth_data sans effet');
select is(pg_temp.affected_rows($$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone) values ('aaaaaaaa-0000-0000-0000-00000000000a', '1990-01-01', 'Intrus', 0, 0, 'UTC')$$), 0,
  'anon: insertion dans birth_data refusée');
select is(pg_temp.affected_rows($$delete from public.natal_charts$$), 0, 'anon: suppression de natal_charts sans effet');
select is(pg_temp.affected_rows($$delete from public.daily_horoscopes$$), 0, 'anon: suppression de daily_horoscopes sans effet');
select is(pg_temp.affected_rows($$update public.conversations set title = 'hack'$$), 0, 'anon: modification de conversations sans effet');
select is(pg_temp.affected_rows($$delete from public.conversations$$), 0, 'anon: suppression de conversations sans effet');
select is(pg_temp.affected_rows($$insert into public.conversations (user_id, title) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'Intrus')$$), 0,
  'anon: insertion dans conversations refusée');
select is(pg_temp.affected_rows($$delete from public.messages$$), 0, 'anon: suppression de messages sans effet');
select is(pg_temp.affected_rows($$insert into public.messages (conversation_id, role, content) values ('aaaaaaaa-4000-0000-0000-00000000000a', 'user', 'Intrus')$$), 0,
  'anon: insertion dans messages refusée');
select is(pg_temp.affected_rows($$update public.usage_counters set count = 0$$), 0, 'anon: modification de usage_counters sans effet');
select is(pg_temp.affected_rows($$delete from public.usage_counters$$), 0, 'anon: suppression de usage_counters sans effet');
select is(pg_temp.affected_rows($$delete from public.onboarding_drafts$$), 0, 'anon: suppression de onboarding_drafts sans effet');
select is(pg_temp.affected_rows($$insert into public.onboarding_drafts (user_id, first_name) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'Intrus')$$), 0,
  'anon: insertion dans onboarding_drafts refusée');
select is(pg_temp.affected_rows($$delete from public.question_reservations$$), 0, 'anon: suppression de question_reservations sans effet');
select is(pg_temp.affected_rows($$delete from public.rate_limits$$), 0, 'anon: suppression de rate_limits sans effet');

select throws_ok($$select public.commit_question('bbbbbbbb-7000-0000-0000-00000000000b')$$, '42501', null,
  'commit_question: non exécutable par le rôle anon');
select throws_ok($$select public.release_question('bbbbbbbb-7000-0000-0000-00000000000b')$$, '42501', null,
  'release_question: non exécutable par le rôle anon');
select throws_ok($$select public.question_count('bbbbbbbb-0000-0000-0000-00000000000b')$$, '42501', null,
  'question_count: non exécutable par le rôle anon');
select throws_ok($$select public.consume_rate_limit('iso:anon', 1, 60)$$, '42501', null,
  'consume_rate_limit: non exécutable par le rôle anon');
select throws_ok(
  $$select public.record_answer('bbbbbbbb-0000-0000-0000-00000000000b', null, 'q', 'r', '{}'::jsonb, 'v', 'p', 'm')$$,
  '42501', null,
  'record_answer: non exécutable par le rôle anon'
);
select throws_ok($$select public.complete_onboarding()$$, '42501', null,
  'complete_onboarding: non exécutable par le rôle anon');

reset role;

select is((select count(*)::int from public.profiles), 2, 'hors RLS: aucun profil créé ni supprimé par anon ou par un jeton sans identité');
select is((select count(*)::int from public.birth_data), 2, 'hors RLS: aucune donnée de naissance créée ni supprimée');
select is((select count(*)::int from public.conversations), 2, 'hors RLS: aucune conversation créée ni supprimée');
select is((select count(*)::int from public.messages), 3, 'hors RLS: seuls les 2 messages initiaux et la question de User A existent');
select is((select count(*)::int from public.onboarding_drafts), 2, 'hors RLS: aucun brouillon créé ni supprimé');

select * from finish();

rollback;
