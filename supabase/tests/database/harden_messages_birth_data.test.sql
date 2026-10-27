create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

insert into auth.users (id, email) values
  ('abababab-abab-abab-abab-abababababab', 'user-harden@test.local');

insert into public.conversations (id, user_id, title) values
  ('abababab-0000-0000-0000-00000000000c', 'abababab-abab-abab-abab-abababababab', 'Durcissement');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"abababab-abab-abab-abab-abababababab","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.messages (conversation_id, role, content)
    values ('abababab-0000-0000-0000-00000000000c', 'user', 'Question valide')$$,
  'messages: une question de taille normale est acceptée'
);

select throws_ok(
  $$insert into public.messages (conversation_id, role, content)
    values ('abababab-0000-0000-0000-00000000000c', 'user', repeat('a', 20001))$$,
  '23514', null,
  'messages: un contenu de plus de 20000 caractères est refusé'
);

select throws_ok(
  $$insert into public.messages (conversation_id, role, content)
    values ('abababab-0000-0000-0000-00000000000c', 'user', '')$$,
  '23514', null,
  'messages: un contenu vide est refusé'
);

select throws_ok(
  $$insert into public.messages (conversation_id, role, content)
    values ('abababab-0000-0000-0000-00000000000c', 'assistant', 'forgé')$$,
  '42501', null,
  'messages: le client ne peut pas insérer un rôle autre que user'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone)
    values ('abababab-abab-abab-abab-abababababab', '1990-01-01', 'Paris', 90.5, 2.35, 'Europe/Paris')$$,
  '23514', null,
  'birth_data: latitude hors de [-90, 90] refusée'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone)
    values ('abababab-abab-abab-abab-abababababab', '1990-01-01', 'Paris', 48.85, 180.5, 'Europe/Paris')$$,
  '23514', null,
  'birth_data: longitude hors de [-180, 180] refusée'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone)
    values ('abababab-abab-abab-abab-abababababab', '1990-01-01', repeat('p', 201), 48.85, 2.35, 'Europe/Paris')$$,
  '23514', null,
  'birth_data: lieu de plus de 200 caractères refusé'
);

select throws_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone)
    values ('abababab-abab-abab-abab-abababababab', '1990-01-01', 'Paris', 48.85, 2.35, repeat('z', 65))$$,
  '23514', null,
  'birth_data: fuseau de plus de 64 caractères refusé'
);

select lives_ok(
  $$insert into public.birth_data (user_id, birth_date, birth_place, latitude, longitude, timezone)
    values ('abababab-abab-abab-abab-abababababab', '1990-01-01', 'Paris', 48.85, 2.35, 'Europe/Paris')$$,
  'birth_data: des données valides sont acceptées'
);

select * from finish();

rollback;
