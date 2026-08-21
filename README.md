# Numa

Numa est une application web d’astrologie personnalisée, conçue pour fournir des lectures compréhensibles, transparentes et non catégoriques.

## Statut

Projet en initialisation — MVP en construction.

Le socle qualité est mis en place avant le développement fonctionnel :

- Documentation Claude Code avec `CLAUDE.md`.
- Tests unitaires associés aux fichiers de logique et composants significatifs.
- CI obligatoire sur les pull requests.
- Vérifications lint, typecheck, tests, couverture et build.
- Protection des données avec Supabase et RLS.

## Stack

- React.
- TypeScript.
- Tailwind CSS.
- Supabase.
- PostgreSQL.
- GitHub Actions.
- Déploiement OVH.

## Démarrage

Les instructions d’installation et les commandes seront ajoutées avec le socle technique.
Consulter `CLAUDE.md` et `docs/claude/` dès qu’ils sont disponibles.

## Workflow Git

- `master` : branche stable.
- `epic/<slug>/main` : branche d’intégration d’une epic.
- `epic/<slug>/issue-<id>-<slug>` : branche de travail d’un ticket.
- Toute modification passe par une pull request.
- Aucun merge automatique.
- La CI doit être verte et une revue humaine est requise avant merge.

## Tests

Chaque nouveau fichier de logique ou composant significatif doit être accompagné de son test dans la même pull request.

Les contrôles prévus sont :

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

## Documentation

- `CLAUDE.md` : règles essentielles pour Claude Code.
- `docs/claude/` : architecture, développement, Git, Supabase, sécurité, IA astrologique et pull requests.

## Confidentialité et sécurité

Aucun secret, clé privée ou donnée personnelle ne doit être commitée dans le dépôt. Les clés et appels sensibles restent côté serveur. Les données utilisateur sont protégées par des politiques RLS.

## Licence

Licence à définir.