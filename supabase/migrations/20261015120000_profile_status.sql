-- Statut du profil : 'anonymous' (session anonyme) ou 'authenticated' (compte permanent).
-- La conversion d'une session anonyme rattache une identité au même auth.users.id
-- (updateUser / linkIdentity) : toutes les données restent liées au même user_id, seul
-- le statut du profil change. Ce statut est dérivé de auth.users.is_anonymous et n'est
-- jamais modifiable par le client.

alter table public.profiles
  add column status text not null default 'anonymous'
  check (status in ('anonymous', 'authenticated'));

update public.profiles p
set status = case when u.is_anonymous then 'anonymous' else 'authenticated' end
from auth.users u
where u.id = p.id;

-- security definer : le rôle authenticated n'a pas accès à auth.users.
-- Recalculé à chaque insert/update pour qu'un client ne puisse pas forger son statut
-- via les policies insert/update de profiles.
create or replace function public.derive_profile_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_anonymous boolean;
begin
  select u.is_anonymous into v_is_anonymous
  from auth.users u
  where u.id = new.id;

  new.status := case when coalesce(v_is_anonymous, true) then 'anonymous' else 'authenticated' end;
  return new;
end;
$$;

create trigger profiles_derive_status
  before insert or update on public.profiles
  for each row
  execute function public.derive_profile_status();

-- Exécuté par Supabase Auth (rôle supabase_auth_admin) quand l'email de l'utilisateur
-- anonyme est confirmé ou qu'une identité OAuth lui est rattachée.
create or replace function public.sync_profile_status_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set status = case when new.is_anonymous then 'anonymous' else 'authenticated' end
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_anonymous_status_changed
  after update of is_anonymous on auth.users
  for each row
  when (old.is_anonymous is distinct from new.is_anonymous)
  execute function public.sync_profile_status_from_auth();

revoke execute on function public.derive_profile_status() from public, anon, authenticated;
revoke execute on function public.sync_profile_status_from_auth() from public, anon, authenticated;
