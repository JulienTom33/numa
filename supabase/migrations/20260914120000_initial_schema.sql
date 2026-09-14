-- Schéma initial Numa : profils, données de naissance, thèmes natals,
-- horoscopes quotidiens, conversations, messages et compteurs d'usage.
-- Toutes les tables portant des données utilisateur sont protégées par RLS.

-- Fonction utilitaire : maintien automatique de la colonne updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles : profil applicatif, une ligne par utilisateur (y compris sessions anonymes).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- birth_data : données de naissance déclarées par l'utilisateur.
create table public.birth_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  birth_date date not null,
  birth_time time,
  birth_place text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  timezone text not null,
  created_at timestamptz not null default now()
);

create index birth_data_user_id_idx on public.birth_data (user_id);

alter table public.birth_data enable row level security;

create policy "birth_data_select_own"
  on public.birth_data for select
  using (auth.uid() = user_id);

create policy "birth_data_insert_own"
  on public.birth_data for insert
  with check (auth.uid() = user_id);

create policy "birth_data_update_own"
  on public.birth_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "birth_data_delete_own"
  on public.birth_data for delete
  using (auth.uid() = user_id);

-- natal_charts : thème natal calculé à partir d'un birth_data.
create table public.natal_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  birth_data_id uuid not null references public.birth_data (id) on delete cascade,
  chart_data jsonb not null,
  created_at timestamptz not null default now()
);

create index natal_charts_user_id_idx on public.natal_charts (user_id);
create index natal_charts_birth_data_id_idx on public.natal_charts (birth_data_id);

alter table public.natal_charts enable row level security;

create policy "natal_charts_select_own"
  on public.natal_charts for select
  using (auth.uid() = user_id);

create policy "natal_charts_insert_own"
  on public.natal_charts for insert
  with check (auth.uid() = user_id);

create policy "natal_charts_update_own"
  on public.natal_charts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "natal_charts_delete_own"
  on public.natal_charts for delete
  using (auth.uid() = user_id);

-- daily_horoscopes : lecture générée pour un utilisateur à une date donnée.
create table public.daily_horoscopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  natal_chart_id uuid not null references public.natal_charts (id) on delete cascade,
  horoscope_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, horoscope_date)
);

create index daily_horoscopes_user_id_idx on public.daily_horoscopes (user_id);
create index daily_horoscopes_natal_chart_id_idx on public.daily_horoscopes (natal_chart_id);

alter table public.daily_horoscopes enable row level security;

create policy "daily_horoscopes_select_own"
  on public.daily_horoscopes for select
  using (auth.uid() = user_id);

create policy "daily_horoscopes_insert_own"
  on public.daily_horoscopes for insert
  with check (auth.uid() = user_id);

create policy "daily_horoscopes_update_own"
  on public.daily_horoscopes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_horoscopes_delete_own"
  on public.daily_horoscopes for delete
  using (auth.uid() = user_id);

-- conversations : fils de discussion avec l'assistant astrologique.
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_id_idx on public.conversations (user_id);

alter table public.conversations enable row level security;

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row
  execute function public.set_updated_at();

create policy "conversations_select_own"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "conversations_insert_own"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "conversations_update_own"
  on public.conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "conversations_delete_own"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- messages : messages d'une conversation (utilisateur ou assistant).
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id);

alter table public.messages enable row level security;

create policy "messages_select_own"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "messages_insert_own"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "messages_update_own"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "messages_delete_own"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- usage_counters : compteurs d'usage (quota) par utilisateur et par période.
create table public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, period_start)
);

create index usage_counters_user_id_idx on public.usage_counters (user_id);

alter table public.usage_counters enable row level security;

create policy "usage_counters_select_own"
  on public.usage_counters for select
  using (auth.uid() = user_id);

create policy "usage_counters_insert_own"
  on public.usage_counters for insert
  with check (auth.uid() = user_id);

create policy "usage_counters_update_own"
  on public.usage_counters for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "usage_counters_delete_own"
  on public.usage_counters for delete
  using (auth.uid() = user_id);
