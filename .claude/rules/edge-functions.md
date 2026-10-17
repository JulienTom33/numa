---
paths:
  - "supabase/functions/**"
---

# Edge Functions (Deno)

- Référence : `docs/claude/architecture.md` (Code serveur) et `docs/claude/security.md`.
- Toute fonction passe par `createHandler` (authentification obligatoire) et lève des `HttpError` pour les erreurs attendues ; déclarée dans `supabase/config.toml`.
- Clés d'API astrologiques ou IA uniquement ici, via les secrets de la fonction, jamais dans le bundle client (`VITE_*`).
- Logique métier en fonctions pures avec `*_test.ts` à côté.
- Valider les entrées du corps de requête ; ne jamais logguer de donnée personnelle.
- Valider : dans `supabase/functions/`, `deno fmt --check`, `deno lint`, `deno task check`, `deno task test`.
- Aucun commentaire.
