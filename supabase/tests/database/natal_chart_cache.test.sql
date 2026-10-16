create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

insert into auth.users (id, email) values
  ('c1000000-0000-0000-0000-000000000001', 'cache-a@test.local'),
  ('c2000000-0000-0000-0000-000000000002', 'cache-b@test.local');

insert into public.birth_data (id, user_id, birth_date, birth_place, latitude, longitude, timezone) values
  ('c1100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '1990-01-01', 'Paris', 48.85, 2.35, 'Europe/Paris'),
  ('c2200000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', '1991-02-02', 'Lyon', 45.76, 4.83, 'Europe/Paris');

insert into public.natal_charts (id, user_id, birth_data_id, chart_data, cache_key) values
  ('c1110000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', '{"a": 1}', repeat('a', 64)),
  ('c2220000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'c2200000-0000-0000-0000-000000000002', '{"b": 1}', repeat('b', 64));

select throws_ok(
  $$insert into public.natal_charts (user_id, birth_data_id, chart_data, cache_key)
    values ('c1000000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', '{}', repeat('a', 64))$$,
  '23505',
  null,
  'natal_charts: une même clé de cache ne peut exister qu''une fois par donnée de naissance'
);

select throws_ok(
  $$insert into public.natal_charts (user_id, birth_data_id, chart_data, cache_key)
    values ('c1000000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', '{}', 'not-a-hash')$$,
  '23514',
  null,
  'natal_charts: une clé qui n''est pas un SHA-256 hexadécimal est refusée'
);

select throws_ok(
  $$insert into public.natal_charts (user_id, birth_data_id, chart_data)
    values ('c1000000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', '{}')$$,
  '23502',
  null,
  'natal_charts: la clé de cache est obligatoire'
);

select is(
  (select computed_at is not null from public.natal_charts where id = 'c1110000-0000-0000-0000-000000000001'),
  true,
  'natal_charts: computed_at est renseigné par défaut'
);

set local role authenticated;
set local request.jwt.claim.sub = 'c1000000-0000-0000-0000-000000000001';

select results_eq(
  $$select id from public.natal_charts order by id$$,
  $$values ('c1110000-0000-0000-0000-000000000001'::uuid)$$,
  'natal_charts: un utilisateur ne lit que ses propres thèmes'
);

select throws_ok(
  $$insert into public.natal_charts (user_id, birth_data_id, chart_data, cache_key)
    values ('c1000000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', '{}', repeat('c', 64))$$,
  '42501',
  null,
  'natal_charts: un utilisateur ne peut pas écrire directement'
);

select throws_ok(
  $$update public.natal_charts set chart_data = '{"forged": true}'$$,
  '42501',
  null,
  'natal_charts: un utilisateur ne peut pas modifier un thème'
);

select throws_ok(
  $$delete from public.natal_charts$$,
  '42501',
  null,
  'natal_charts: un utilisateur ne peut pas supprimer un thème'
);

reset role;

select is(
  (select count(*) from public.natal_charts),
  2::bigint,
  'natal_charts: aucune écriture cliente n''a abouti'
);

select * from finish();

rollback;
