delete from public.natal_charts;

alter table public.natal_charts
  add column cache_key text not null check (cache_key ~ '^[0-9a-f]{64}$'),
  add column computed_at timestamptz not null default now(),
  add constraint natal_charts_birth_data_cache_key_key unique (birth_data_id, cache_key);

drop policy "natal_charts_insert_own" on public.natal_charts;
drop policy "natal_charts_update_own" on public.natal_charts;
drop policy "natal_charts_delete_own" on public.natal_charts;

revoke insert, update, delete on public.natal_charts from authenticated;
