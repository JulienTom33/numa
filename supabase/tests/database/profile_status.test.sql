-- Conversion d'une session anonyme en compte (issue #15) : le statut du profil suit
-- auth.users.is_anonymous, n'est pas forgeable par le client, et les données restent
-- rattachées au même user_id.

create extension if not exists pgtap with schema extensions;

begin;

select plan(10);

select has_column('public', 'profiles', 'status', 'profiles.status existe');

insert into auth.users (id, email, is_anonymous) values
  ('55555555-5555-5555-5555-555555555555', null, true),
  ('66666666-6666-6666-6666-666666666666', 'user-f@test.local', false);

insert into public.profiles (id, display_name) values
  ('55555555-5555-5555-5555-555555555555', 'Anonyme E'),
  ('66666666-6666-6666-6666-666666666666', 'User F');

insert into public.birth_data (id, user_id, birth_date, birth_place, latitude, longitude, timezone) values
  ('a5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '1990-01-01', 'Paris', 48.856613, 2.352222, 'Europe/Paris');

insert into public.conversations (id, user_id, title) values
  ('e5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Conv E');

insert into public.messages (conversation_id, role, content) values
  ('e5555555-5555-5555-5555-555555555555', 'user', 'Question E');

select is(
  (select status from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  'anonymous',
  'profil d''une session anonyme : statut anonymous'
);

select is(
  (select status from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'authenticated',
  'profil d''un compte permanent : statut authenticated'
);

-- Un utilisateur anonyme ne peut pas se déclarer authenticated lui-même.
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

update public.profiles set status = 'authenticated' where id = '55555555-5555-5555-5555-555555555555';

select is(
  (select status from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  'anonymous',
  'le client ne peut pas forger son statut via update'
);

reset role;

-- Conversion : Supabase Auth passe is_anonymous à false sur le même auth.users.id.
update auth.users
set is_anonymous = false, email = 'user-e@test.local'
where id = '55555555-5555-5555-5555-555555555555';

select is(
  (select status from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  'authenticated',
  'après conversion : statut authenticated'
);

select is(
  (select display_name from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  'Anonyme E',
  'après conversion : profil conservé'
);

select is(
  (select status from public.profiles where id = '66666666-6666-6666-6666-666666666666'),
  'authenticated',
  'la conversion d''un utilisateur ne touche pas les autres profils'
);

-- Après conversion, l'utilisateur retrouve ses données via RLS, sans ressaisie.
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

select is(
  (select count(*)::int from public.birth_data),
  1,
  'après conversion : données de naissance toujours visibles'
);

select is(
  (select count(*)::int from public.messages),
  1,
  'après conversion : conversations et messages toujours visibles'
);

-- Isolation : User F ne voit pas les données converties de l'utilisateur E.
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';

select is(
  (select count(*)::int from public.conversations),
  0,
  'un autre utilisateur ne voit pas les conversations du compte converti'
);

reset role;

select * from finish();

rollback;
