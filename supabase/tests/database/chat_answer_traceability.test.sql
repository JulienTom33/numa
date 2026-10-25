create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

insert into auth.users (id, email) values
  ('88888888-8888-8888-8888-888888888888', 'user-h@test.local'),
  ('99999999-9999-9999-9999-999999999999', 'user-i@test.local');

select has_column('public', 'messages', 'factors', 'messages.factors existe');
select has_column('public', 'messages', 'prompt_version', 'messages.prompt_version existe');
select has_column('public', 'messages', 'provider', 'messages.provider existe');
select has_column('public', 'messages', 'model', 'messages.model existe');

create temp table recorded as
select public.record_answer(
  '88888888-8888-8888-8888-888888888888', null, 'Question H', 'Réponse H',
  '{"bodies":[{"body":"sun","sign":"leo"}]}'::jsonb, 'numa-chat-v2', 'mistral', 'mistral-small-latest'
) as result;

grant select on recorded to authenticated;

select is(
  (select count(*)::int from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.user_id = '88888888-8888-8888-8888-888888888888'),
  2,
  'record_answer enregistre la question et la réponse'
);

select is(
  (select factors->'bodies'->0->>'sign' from public.messages where role = 'assistant'),
  'leo',
  'les facteurs, la version du prompt, le fournisseur et le modèle sont conservés'
);

select throws_ok(
  $$insert into public.messages (conversation_id, role, content)
    select id, 'assistant', 'sans trace' from public.conversations$$,
  '23514', null,
  'une réponse assistant sans facteurs ni version est refusée'
);

select throws_ok(
  $$select public.record_answer(
    '99999999-9999-9999-9999-999999999999',
    (select (result->>'conversation_id')::uuid from recorded),
    'Q', 'R', '{}'::jsonb, 'v', 'p', 'm')$$,
  'P0002', 'conversation_not_found',
  'record_answer refuse la conversation d''un autre utilisateur'
);

set local role authenticated;
set local request.jwt.claim.sub = '88888888-8888-8888-8888-888888888888';

select is(
  (select count(*)::int from public.messages),
  2,
  'le propriétaire lit ses messages'
);

select is(
  (select prompt_version from public.messages where role = 'assistant'),
  'numa-chat-v2',
  'le propriétaire lit la version du prompt'
);

select throws_ok(
  $$insert into public.messages (conversation_id, role, content)
    select id, 'assistant', 'forgé' from public.conversations$$,
  '42501', null,
  'le client ne peut pas écrire une réponse assistant'
);

select throws_ok(
  $$update public.messages set content = 'modifié'$$,
  '42501', null,
  'le client ne peut pas modifier un message'
);

select throws_ok(
  $$select public.record_answer(
    '88888888-8888-8888-8888-888888888888', null, 'Q', 'R', '{}'::jsonb, 'v', 'p', 'm')$$,
  '42501', null,
  'le client ne peut pas appeler record_answer'
);

set local request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';

select is(
  (select count(*)::int from public.messages),
  0,
  'un autre utilisateur ne voit aucun message'
);

select * from finish();

rollback;
