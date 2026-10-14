-- Tests de la fonction increment_usage_counter : incrémentation atomique, isolation par
-- utilisateur (RLS toujours appliquée car security invoker).

create extension if not exists pgtap with schema extensions;

begin;

select plan(4);

insert into auth.users (id, email) values
  ('33333333-3333-3333-3333-333333333333', 'user-c@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'user-d@test.local');

insert into public.profiles (id, display_name) values
  ('33333333-3333-3333-3333-333333333333', 'User C'),
  ('44444444-4444-4444-4444-444444444444', 'User D');

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (select public.increment_usage_counter('2026-02-01'::date)),
  1,
  'increment_usage_counter: première question du jour renvoie 1'
);

select is(
  (select public.increment_usage_counter('2026-02-01'::date)),
  2,
  'increment_usage_counter: deuxième question du jour renvoie 2'
);

select is(
  (select count from public.usage_counters
    where user_id = '33333333-3333-3333-3333-333333333333' and period_start = '2026-02-01'),
  2,
  'increment_usage_counter: le compteur persisté vaut 2'
);

-- Isolation : le compteur de User C n'affecte pas celui de User D.
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select is(
  (select public.increment_usage_counter('2026-02-01'::date)),
  1,
  'increment_usage_counter: le compteur de User D démarre indépendamment à 1'
);

reset role;

select * from finish();

rollback;
