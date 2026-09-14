-- Le rôle authenticated a besoin des privilèges SQL de base sur les tables
-- user-data pour que les policies RLS (USING / WITH CHECK) s'appliquent :
-- sans GRANT, PostgreSQL refuse l'accès avant même d'évaluer les policies.
-- Le rôle anon n'a volontairement aucun privilège sur ces tables : les
-- sessions anonymes Supabase s'authentifient avec le rôle authenticated
-- (auth.users.is_anonymous = true), pas avec le rôle anon.

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.birth_data to authenticated;
grant select, insert, update, delete on public.natal_charts to authenticated;
grant select, insert, update, delete on public.daily_horoscopes to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.usage_counters to authenticated;
