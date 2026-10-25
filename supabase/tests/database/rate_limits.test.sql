-- Tests du rate limiting (issue #182) : seul le serveur (service_role) consomme un compteur,
-- le client n'y a aucun accès, la fenêtre fixe plafonne les appels par clé et les clés sont
-- indépendantes.

create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

select has_table('public', 'rate_limits', 'rate_limits: la table existe');

select row_security_is_enabled('public', 'rate_limits', 'rate_limits: RLS activée');

select is(
  public.consume_rate_limit('test:a', 2, 60), true,
  'consume_rate_limit: 1er appel autorisé'
);
select is(
  public.consume_rate_limit('test:a', 2, 60), true,
  'consume_rate_limit: 2e appel autorisé (limite atteinte)'
);
select is(
  public.consume_rate_limit('test:a', 2, 60), false,
  'consume_rate_limit: 3e appel refusé'
);
select is(
  public.consume_rate_limit('test:b', 2, 60), true,
  'consume_rate_limit: une autre clé a son propre compteur'
);

select is(
  (select count from public.rate_limits where key = 'test:a'), 3,
  'rate_limits: les appels refusés restent comptés dans la fenêtre'
);

insert into public.rate_limits (key, window_start, count)
values ('test:old', now() - interval '2 days', 99);

select is(
  public.consume_rate_limit('test:old', 1, 60), true,
  'consume_rate_limit: une fenêtre expirée repart de zéro'
);
select is(
  (select count(*)::int from public.rate_limits where key = 'test:old'), 1,
  'consume_rate_limit: les fenêtres expirées de la clé sont purgées'
);

select throws_ok(
  $$select public.consume_rate_limit('test:bad', 0, 60)$$,
  '22023', null,
  'consume_rate_limit: une limite invalide est rejetée'
);

set local role authenticated;

select throws_ok(
  $$select public.consume_rate_limit('test:client', 1, 60)$$,
  '42501', null,
  'consume_rate_limit: le client authentifié ne peut pas l''appeler'
);

select throws_ok(
  $$select * from public.rate_limits$$,
  '42501', null,
  'rate_limits: le client authentifié ne peut pas lire la table'
);

select * from finish();

rollback;
