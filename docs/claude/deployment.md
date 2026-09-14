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

## Secrets GitHub Actions requis

Configurés dans Settings → Secrets and variables → Actions (environnement `production`) :

| Secret | Contenu |
|---|---|
| `SSH_HOST` | IP ou hostname du VPS |
| `SSH_USER` | Utilisateur de déploiement (`ubuntu`, avec accès Docker) |
| `SSH_PRIVATE_KEY` | Clé privée SSH dédiée au déploiement (jamais celle d'un compte personnel) |
| `SITE_ADDRESS` | Domaine ou sous-domaine sslip.io servi par Caddy |
| `VITE_SUPABASE_URL` | URL du projet Supabase (build-time, injectée dans le bundle) |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase (build-time, injectée dans le bundle) |

Ces variables ne sont jamais commitées : elles vivent uniquement dans les secrets GitHub et dans `/opt/numa/.env` sur le serveur (généré par le workflow à chaque déploiement).

## Déploiement

Déclenché automatiquement à chaque push sur `master` (donc après merge d'une PR) :

1. Synchronisation des fichiers du dépôt vers `/opt/numa` sur le VPS (`rsync`, hors `node_modules`/`dist`/`.git`).
2. Écriture du fichier `/opt/numa/.env` à partir des secrets GitHub.
3. `docker compose up -d --build --remove-orphans` sur le serveur.
4. Nettoyage des images Docker obsolètes.

Déclenchement manuel possible depuis l'onglet Actions → workflow `Deploy` → `Run workflow`.

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
