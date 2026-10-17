---
paths:
  - "supabase/migrations/**"
  - "supabase/tests/**"
  - "supabase/config.toml"
---

# Base de données Supabase

- Référence : `docs/claude/supabase.md` et `docs/claude/security.md`.
- RLS activée sur toute table contenant des données utilisateur, avec une politique explicite par opération ; aucune politique `using (true)` sur une table utilisateur.
- Une migration = un changement cohérent, nom horodaté, jamais modifiée après merge ; corriger par une nouvelle migration.
- Tout objet ajouté est couvert par un test pgTAP dans `supabase/tests/` (RLS comprise).
- Valider : `supabase db reset` puis `supabase test db`.
- Aucun secret, jeton ou donnée personnelle dans une migration ou un seed.
- Les types TypeScript de la base sont générés, jamais écrits à la main.
