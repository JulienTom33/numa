alter table public.messages
  add column factors jsonb,
  add column prompt_version text,
  add column provider text,
  add column model text,
  add constraint messages_assistant_traceability_check check (
    role <> 'assistant'
    or (
      factors is not null
      and prompt_version is not null
      and provider is not null
      and model is not null
    )
  );

drop policy "messages_insert_own" on public.messages;
drop policy "messages_update_own" on public.messages;

create policy "messages_insert_own_question"
  on public.messages for insert
  with check (
    role = 'user'
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

revoke update on public.messages from authenticated;
revoke insert on public.messages from authenticated;
grant insert (conversation_id, role, content) on public.messages to authenticated;

create or replace function public.record_answer(
  p_user_id uuid,
  p_conversation_id uuid,
  p_question text,
  p_answer text,
  p_factors jsonb,
  p_prompt_version text,
  p_provider text,
  p_model text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid := p_conversation_id;
  v_message_id uuid;
begin
  if v_conversation_id is null then
    insert into public.conversations (user_id)
    values (p_user_id)
    returning id into v_conversation_id;
  elsif not exists (
    select 1 from public.conversations
    where id = v_conversation_id and user_id = p_user_id
  ) then
    raise exception 'conversation_not_found' using errcode = 'P0002';
  end if;

  insert into public.messages (conversation_id, role, content)
  values (v_conversation_id, 'user', p_question);

  insert into public.messages (conversation_id, role, content, factors, prompt_version, provider, model)
  values (v_conversation_id, 'assistant', p_answer, p_factors, p_prompt_version, p_provider, p_model)
  returning id into v_message_id;

  update public.conversations set updated_at = now() where id = v_conversation_id;

  return jsonb_build_object('conversation_id', v_conversation_id, 'message_id', v_message_id);
end;
$$;

revoke execute on function public.record_answer(uuid, uuid, text, text, jsonb, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_answer(uuid, uuid, text, text, jsonb, text, text, text)
  to service_role;
