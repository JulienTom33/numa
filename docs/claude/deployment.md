# Déploiement (OVH)

## Infrastructure

- VPS OVH Ubuntu 22.04 LTS (Strasbourg), Docker + Docker Compose plugin installés.
- Reverse proxy et TLS gérés par **Caddy** (certificat HTTPS automatique via Let's Encrypt, renouvellement géré par Caddy lui-même).
- Application buildée en statique (Vite) et servie par Caddy dans un unique conteneur.
- Domaine : tant qu'aucun nom de domaine n'est acheté, `SITE_ADDRESS` pointe vers un sous-domaine `sslip.io` qui résout automatiquement vers l'IP du VPS (ex. `164-132-107-30.sslip.io`), ce qui permet à Let's Encrypt de délivrer un certificat valide sans domaine propre. Migration vers un domaine réel : changer uniquement la valeur du secret `SITE_ADDRESS`.

## Fichiers

- `Dockerfile` : build multi-stage (Node → build Vite, puis image Caddy servant `dist/`).
- `Caddyfile` : configuration du reverse proxy, HTTPS automatique, headers de sécurité, logs d'accès.
- `docker-compose.yml` : orchestration du conteneur `app`, volumes persistants pour les certificats Caddy (`caddy_data`, `caddy_config`), rotation des logs Docker.
- `.github/workflows/deploy.yml` : déploiement automatique sur push vers `master` (ou déclenchement manuel).

## En-têtes de sécurité HTTP

Le `Caddyfile` pose `Content-Security-Policy` (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`), `Strict-Transport-Security`, `Permissions-Policy`, `X-Content-Type-Options`, `X-Frame-Options` et `Referrer-Policy`. Aucun domaine n'est écrit en dur.

- `connect-src` autorise `'self'` et l'URL du projet Supabase via la variable d'environnement Caddy `SUPABASE_URL`, alimentée par `docker-compose.yml` depuis `VITE_SUPABASE_URL` (déjà présente dans `/opt/numa/.env`). Elle doit être définie : vide, la CSP bloquerait Auth et les Edge Functions.
- Polices (Manrope, Inter) via `@fontsource`, inlinées en `data:` par Vite : `font-src 'self' data:`. Pas de script ni de style inline : toute nouvelle ressource externe exige d'étendre la CSP dans le `Caddyfile`.
- Storybook n'est pas servi par Caddy : la CSP ne s'y applique pas.
- Vérification : `e2e/specs/csp.spec.ts` rejoue la CSP du `Caddyfile` sur le build et échoue sur toute violation.

## Secrets GitHub Actions requis

Configurés dans Settings → Secrets and variables → Actions (environnement `production`) :

| Secret | Contenu |
|---|---|
| `SSH_HOST` | IP ou hostname du VPS |
| `SSH_USER` | Utilisateur de déploiement (`ubuntu`, avec accès Docker) |
| `SSH_PRIVATE_KEY` | Clé privée SSH dédiée au déploiement (jamais celle d'un compte personnel) |
| `SITE_ADDRESS` | Domaine ou sous-domaine sslip.io servi par Caddy |
| `VITE_SUPABASE_URL` | URL du projet Supabase (build-time, injectée dans le bundle) |

Variable GitHub Actions (non secrète, la valeur est publique dans le bundle) :

| Variable | Contenu |
|---|---|
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publishable Supabase `sb_publishable_…` (build-time, injectée dans le bundle). Le workflow refuse de déployer si elle est absente ou ne commence pas par `sb_publishable_`. |

Ces valeurs ne sont jamais commitées : elles vivent dans les secrets et variables GitHub et dans `/opt/numa/.env` sur le serveur (généré par le workflow à chaque déploiement).

## Déploiement

Déclenché automatiquement à chaque push sur `master` (donc après merge d'une PR) :

1. Synchronisation des fichiers du dépôt vers `/opt/numa` sur le VPS (`rsync`, hors `node_modules`/`dist`/`.git`).
2. Écriture du fichier `/opt/numa/.env` à partir des secrets GitHub.
3. `docker compose up -d --build --remove-orphans` sur le serveur.
4. Nettoyage des images Docker obsolètes.

Déclenchement manuel possible depuis l'onglet Actions → workflow `Deploy` → `Run workflow`.

## Migrations et Edge Functions (Supabase)

Les fonctions ne sont pas hébergées sur le VPS. Le workflow `.github/workflows/deploy-supabase.yml` (remplace `deploy-functions.yml`) applique les migrations et déploie les fonctions sur les projets Supabase, sans aucun `supabase db push` manuel.

Déclenchement : fin réussie du workflow `CI` sur `master` (donc après merge, CI verte), ou manuel (`workflow_dispatch`). Deux jobs enchaînés :

1. `staging` (environnement GitHub `staging`) : `supabase link`, `supabase db push --dry-run` (liste des migrations en attente, visible dans le run), `supabase db push`, mise à jour du secret `ALLOWED_ORIGINS`, `supabase functions deploy`.
2. `production` (environnement GitHub `production`, `needs: staging`) : mêmes étapes. Un échec sur staging bloque la production ; une protection « Required reviewers » sur l'environnement `production` permet d'ajouter une validation humaine.

Un groupe de concurrence unique sérialise les déploiements, sans annulation d'un run en cours.

Configuration requise, à définir dans chacun des environnements `staging` et `production` (valeurs distinctes, projets Supabase distincts) :

| Nom | Type | Contenu |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | secret | Jeton personnel Supabase (Account → Access Tokens) dédié au déploiement |
| `SUPABASE_PROJECT_REF` | secret | Référence du projet Supabase de l'environnement |
| `SUPABASE_DB_PASSWORD` | secret | Mot de passe de la base de l'environnement (requis par `supabase db push`) |
| `ALLOWED_ORIGINS` | variable | Origines autorisées en CORS, séparées par des virgules |

Si l'un des quatre manque pour `staging`, le job se termine sans déployer (avertissement dans le résumé du run) et la production n'est pas déployée non plus. Les autres secrets des fonctions (clés API astrologique, IA) se définissent avec `supabase secrets set --project-ref <ref>` et ne transitent pas par GitHub.

### Étapes manuelles (une seule fois)

1. Supabase : créer un second projet `numa-staging`, région UE (même région que la production), puis relever sa référence et son mot de passe de base.
2. Supabase : appliquer sur staging la configuration Auth listée dans `supabase.md` (connexion anonyme, URL de redirection de l'environnement).
3. GitHub : Settings → Environments → créer `staging` (l'environnement `production` existe déjà).
4. GitHub : renseigner dans chaque environnement les secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` et la variable `ALLOWED_ORIGINS`. Les secrets `SUPABASE_*` ne doivent plus rester au niveau dépôt.
5. GitHub : optionnel, activer « Required reviewers » sur `production`.
6. Après le merge de la PR qui ajoute le workflow : lancer une première fois `Deploy Supabase` manuellement et vérifier le `--dry-run` de chaque job.
7. Pour une base de production déjà migrée à la main : vérifier avec `supabase migration list --linked` que l'historique distant correspond au dépôt avant le premier run.

## Logs et redémarrages

- Logs applicatifs (Caddy) : `docker compose logs -f app` sur le serveur, ou fichier `access.log` dans le volume `caddy_data` (rotation automatique, 10 Mo × 5 fichiers).
- Logs Docker : rotation configurée (`json-file`, 10 Mo × 3 fichiers) pour éviter la saturation disque.
- Redémarrage automatique du conteneur en cas de crash (`restart: unless-stopped`).
- Redémarrage manuel : `cd /opt/numa && docker compose restart`.
- Statut des conteneurs : `docker compose ps`.

## Firewall

`ufw` actif sur le VPS : SSH (22), HTTP (80, requis pour le challenge Let's Encrypt), HTTPS (443). Tout le reste est bloqué par défaut.

## Accès serveur

Connexion SSH par clé uniquement (authentification par mot de passe non utilisée pour le déploiement). La clé privée de déploiement n'est jamais commitée ni partagée hors du secret GitHub `SSH_PRIVATE_KEY`.
