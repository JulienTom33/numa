create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

select has_column('public', 'profiles', 'language', 'profiles.language existe');
select has_column('public', 'profiles', 'tone', 'profiles.tone existe');

insert into auth.users (id, email, is_anonymous) values
  ('77777777-7777-7777-7777-777777777777', 'user-g@test.local', false);

insert into public.profiles (id, display_name) values
  ('77777777-7777-7777-7777-777777777777', 'User G');

select is(
  (select language from public.profiles where id = '77777777-7777-7777-7777-777777777777'),
  'fr',
  'la langue par défaut est fr'
);

select is(
  (select tone from public.profiles where id = '77777777-7777-7777-7777-777777777777'),
  'balanced',
  'le ton par défaut est balanced'
);

set local role authenticated;
set local request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';

select lives_ok(
  $$update public.profiles set tone = 'direct', language = 'fr' where id = '77777777-7777-7777-7777-777777777777'$$,
  'le propriétaire modifie ses préférences'
);

select is(
  (select tone from public.profiles where id = '77777777-7777-7777-7777-777777777777'),
  'direct',
  'le ton est enregistré'
);

select throws_ok(
  $$update public.profiles set tone = 'sarcastic' where id = '77777777-7777-7777-7777-777777777777'$$,
  '23514',
  null,
  'un ton inconnu est refusé'
);

select throws_ok(
  $$update public.profiles set language = 'xx' where id = '77777777-7777-7777-7777-777777777777'$$,
  '23514',
  null,
  'une langue non supportée est refusée'
);

select * from finish();

rollback;
