# Runbook : déploiement, exploitation et restauration

Ce document décrit uniquement ce qui existe dans le dépôt. Le détail de l'infrastructure reste dans `docs/claude/deployment.md`. Les écarts constatés entre la pratique souhaitable et l'état réel sont listés en fin de document.

Aucune valeur de secret n'est écrite ici : seuls les noms sont cités.

## 1. Vue d'ensemble

| Couche | Où | Déployée par |
|---|---|---|
| Front statique (Vite) servi par Caddy, conteneur `app` | VPS OVH, `/opt/numa` | `.github/workflows/deploy.yml` |
| Base PostgreSQL, Auth, migrations | Projets Supabase `staging` puis `production` | `.github/workflows/deploy-supabase.yml` |
| Edge Functions (`supabase/functions/`) | Projets Supabase | `.github/workflows/deploy-supabase.yml` |

Les deux workflows sont indépendants : `Deploy` part à chaque push sur `master`, `Deploy Supabase` part à la fin réussie de `CI` sur `master`. Aucun ordre n'est garanti entre eux (voir écarts).

## 2. Variables d'environnement et secrets

| Nom | Type | Où | Rôle |
|---|---|---|---|
| `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS` | secrets (env. `production`) | GitHub | Accès SSH au VPS |
| `SITE_ADDRESS` | secret | GitHub puis `/opt/numa/.env` | Domaine ou sous-domaine `sslip.io` servi par Caddy |
| `VITE_SUPABASE_URL` | secret | GitHub puis `/opt/numa/.env` | URL Supabase, injectée au build et dans la CSP (`SUPABASE_URL`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | variable | GitHub puis `/opt/numa/.env` | Clé `sb_publishable_…`, jamais la clé secrète |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` | secrets (env. `staging` et `production`) | GitHub | CLI Supabase |
| `ALLOWED_ORIGINS` | variable (env. `staging` et `production`) | GitHub puis secret de fonctions | CORS des Edge Functions |
| `AI_PROVIDERS`, `AI_DAILY_LIMIT`, `AI_PROVIDER_STUB`, clés des fournisseurs IA | secrets de fonctions | Supabase uniquement | Lus par `chat` et `horoscope` |

`/opt/numa/.env` est réécrit à chaque déploiement par le workflow : ne pas l'éditer à la main de façon durable. Un modèle sans valeur est dans `.env.example`.

Les secrets de fonctions (hors `ALLOWED_ORIGINS`) se gèrent par `supabase secrets set --project-ref <ref> NOM=…` depuis un poste de confiance, puis `supabase secrets list --project-ref <ref>` pour vérifier les noms. Ils ne transitent pas par GitHub.

## 3. Déploiement

### 3.1 Front (VPS)

Automatique à chaque push sur `master`, ou manuel : Actions, workflow `Deploy`, `Run workflow`.

Étapes du workflow : contrôle de `VITE_SUPABASE_PUBLISHABLE_KEY` (doit commencer par `sb_publishable_`), `rsync` vers `/opt/numa`, écriture de `.env`, `docker compose up -d --build --remove-orphans`, `docker image prune -f`, `docker compose ps`.

Vérification après déploiement :

1. Le run est vert.
2. Sur le VPS : `cd /opt/numa && docker compose ps` montre `app` à l'état `healthy`.
3. Ouvrir `https://<SITE_ADDRESS>` : la page se charge, la connexion anonyme fonctionne (pas d'erreur CSP dans la console).

### 3.2 Migrations et Edge Functions

Automatique après `CI` verte sur `master`, ou manuel : workflow `Deploy Supabase`, `Run workflow`. Enchaînement `staging` puis `production`. Chaque job lance `supabase db push --dry-run` (lisible dans le run), `supabase db push`, la mise à jour de `ALLOWED_ORIGINS`, puis `supabase functions deploy`.

Si un des quatre éléments de configuration manque dans un environnement, le job s'arrête sans déployer (notice dans le run) : la production n'est alors pas déployée si c'est `staging` qui manque.

Vérification : relire le `--dry-run` avant `db push`, puis `supabase migration list --linked` (après `supabase link --project-ref <ref>`) pour confirmer que l'historique distant correspond au dépôt.

### 3.3 Premier déploiement d'un VPS vierge

Prérequis (non automatisés, à faire une fois) : Ubuntu 22.04, Docker et plugin Compose, utilisateur de déploiement dans le groupe `docker`, répertoire `/opt/numa` accessible en écriture, `ufw` ouvrant 22, 80, 443 uniquement, clé publique de déploiement dans `authorized_keys`, secrets GitHub renseignés. Lancer ensuite `Deploy` manuellement. Les étapes manuelles Supabase (projet staging, Auth, environnements GitHub) sont dans `docs/claude/deployment.md`.

## 4. Redémarrage

Sur le VPS, dans `/opt/numa` :

- Redémarrer : `docker compose restart`.
- Recréer sans rebuild : `docker compose up -d --force-recreate`.
- Statut : `docker compose ps`.

Le conteneur redémarre seul après un crash (`restart: unless-stopped`). Les Edge Functions n'ont pas de redémarrage : redéployer via `Deploy Supabase`.

## 5. Logs

| Source | Commande ou lieu | Rétention |
|---|---|---|
| Sortie Caddy et Docker | `docker compose logs -f app` | `json-file`, 10 Mo × 3 |
| Accès Caddy | `/data/access.log` dans le volume `caddy_data` | 10 Mo × 5 |
| Edge Functions | Tableau de bord Supabase, Logs, Edge Functions | Selon l'offre Supabase |
| Base | Tableau de bord Supabase, Logs, Postgres | Selon l'offre Supabase |
| Runs de déploiement | Onglet Actions de GitHub | Politique GitHub |

Les journaux d'accès contiennent des adresses IP : ne pas les copier hors du serveur ni les conserver au-delà de la rotation.

## 6. Sauvegardes Supabase

Le dépôt ne contient aucune automatisation de sauvegarde. Ce qui est disponible :

1. Sauvegardes quotidiennes gérées par Supabase (tableau de bord, Database, Backups). La durée de rétention et la restauration à un instant donné (PITR) dépendent de l'offre du projet : à vérifier et noter pour le projet `production` avant la bêta.
2. Export manuel, depuis un poste de confiance après `supabase link --project-ref <ref>` :
   - `supabase db dump -f schema.sql` (schéma)
   - `supabase db dump --data-only -f data.sql` (données)

   Les fichiers produits contiennent des données personnelles (dates et lieux de naissance, messages) : les stocker chiffrés, hors dépôt, jamais commités, et les supprimer après usage.
3. Le schéma est reproductible depuis `supabase/migrations/` : la structure se reconstruit sans sauvegarde, seules les données en dépendent.

Avant toute migration destructive ou risquée en production : déclencher un export manuel (point 2) et noter l'heure.

## 7. Restauration

### 7.1 Base de données

1. Décider de la cible : restauration sur place (écrase l'état actuel) ou sur un projet neuf (préférable pour comparer avant bascule).
2. Via Supabase : tableau de bord, Database, Backups, choisir la sauvegarde (ou le point PITR si l'offre l'inclut), lancer la restauration. L'application est indisponible pendant l'opération.
3. Via un export manuel sur un projet neuf : `supabase link --project-ref <nouveau-ref>`, `supabase db push` pour recréer le schéma, puis charger les données avec `psql` sur l'URL de connexion du projet (mot de passe pris dans le gestionnaire de secrets, jamais en clair dans l'historique du shell).
4. Vérifier : `supabase migration list --linked` cohérent, RLS actives (contrôle dans le tableau de bord), connexion anonyme et un parcours de lecture fonctionnels.
5. Si le projet a changé : mettre à jour `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGINS`, refaire la configuration Auth (`docs/claude/supabase.md`), republier les secrets de fonctions, puis lancer `Deploy Supabase` et `Deploy` (le front embarque l'URL au build).

### 7.2 Serveur applicatif

Le VPS ne contient aucune donnée métier : l'état durable est dans `caddy_data` (certificats TLS, journaux). En cas de perte du VPS : recréer un VPS selon 3.3, mettre à jour `SSH_HOST` et `SSH_KNOWN_HOSTS`, faire pointer `SITE_ADDRESS` (si `sslip.io`, la valeur change avec l'IP), relancer `Deploy`. Caddy réémet un certificat automatiquement. Limite Let's Encrypt : éviter les réémissions répétées en peu de temps.

## 8. Retour arrière

### 8.1 Front

Aucun retour arrière automatique. Procédure :

1. Identifier le dernier commit sain sur `master`.
2. Créer une PR de revert (`git revert <sha>`), la faire relire et merger : le push sur `master` redéploie.
3. Aucune image versionnée n'est conservée de façon fiable (`docker image prune -f` supprime les images inutilisées) : passer par la PR de revert.

Aucun force-push ni écriture directe sur `master`.

### 8.2 Migrations

`supabase db push` n'a pas de retour arrière. Corriger par une nouvelle migration compensatoire (jamais en modifiant une migration déjà appliquée). Pour une migration destructive : restauration selon 7.1.

### 8.3 Edge Functions

Revert du code via PR, puis `Deploy Supabase`. Un secret de fonction erroné se corrige avec `supabase secrets set`.

## 9. Rotation des secrets

| Secret | Procédure |
|---|---|
| Clé SSH de déploiement | Générer une nouvelle paire dédiée, ajouter la clé publique dans `authorized_keys`, mettre à jour `SSH_PRIVATE_KEY`, lancer `Deploy`, puis retirer l'ancienne clé publique |
| `SSH_KNOWN_HOSTS` | Mettre à jour après tout changement de clé d'hôte ou de VPS (empreinte vérifiée hors bande) |
| `SUPABASE_ACCESS_TOKEN` | Créer un nouveau jeton (Account, Access Tokens), mettre à jour dans les environnements GitHub, lancer `Deploy Supabase`, révoquer l'ancien |
| `SUPABASE_DB_PASSWORD` | Changer dans Supabase (Database settings), mettre à jour le secret GitHub de l'environnement, relancer `Deploy Supabase` |
| Clés API Supabase (publishable/secrète) | Régénérer dans Supabase, mettre à jour `VITE_SUPABASE_PUBLISHABLE_KEY` (variable) puis relancer `Deploy` (la clé est dans le bundle) |
| Clés des fournisseurs IA, autres secrets de fonctions | Créer la nouvelle clé chez le fournisseur, `supabase secrets set …`, vérifier une réponse du chat, révoquer l'ancienne |
| Webhook Discord | Voir `docs/claude/pull-requests.md` |

Toute fuite présumée (secret dans un commit, un log ou une PR) : révoquer d'abord, faire la rotation ensuite, puis nettoyer l'historique si nécessaire.

## 10. Procédures d'urgence

| Situation | Action immédiate |
|---|---|
| Site inaccessible | `docker compose ps` et `docker compose logs --tail=200 app` sur le VPS, puis `docker compose restart` ; vérifier `ufw` (80/443) et le certificat |
| Déploiement front cassé en production | Revert par PR (8.1) |
| Écran blanc ou Auth qui échoue | Contrôler `VITE_SUPABASE_URL` dans `/opt/numa/.env` (une valeur vide casse la CSP) et la console navigateur |
| Erreurs CORS des fonctions | Vérifier la variable `ALLOWED_ORIGINS` de l'environnement et relancer `Deploy Supabase` |
| Migration défaillante | Arrêter les déploiements, migration compensatoire ou restauration (7.1) |
| Fuite de secret | Rotation (section 9), en commençant par la révocation |
| Données personnelles exposées | Couper l'accès concerné, restaurer si nécessaire, suivre `docs/claude/security.md` |
| Suspension du déploiement automatique | Désactiver les workflows dans l'onglet Actions ; aucune autre protection n'est codée |

## 11. Écarts constatés avec l'état réel du dépôt

1. `docs/claude/deployment.md` indique que le déploiement épingle l'hôte via `SSH_KNOWN_HOSTS`, mais `deploy.yml` utilise `ssh-keyscan -H` et ne lit pas ce secret : la vérification d'hôte n'est pas effective.
2. Aucune sauvegarde automatisée ni test de restauration dans le dépôt : la rétention réelle dépend de l'offre Supabase et n'est pas documentée.
3. Aucun retour arrière automatisé ni image versionnée côté VPS.
4. `deploy.yml` se déclenche sur push `master` sans attendre `CI`, et indépendamment de `deploy-supabase.yml` : un front peut être publié avant ses migrations ou fonctions.
5. `deploy.yml` ne vérifie la santé qu'avec `docker compose ps` (sans échec si le conteneur est `unhealthy`), sans appel HTTP.
6. `deploy-supabase.yml` installe la CLI Supabase en `version: latest` : comportement non reproductible.
7. Aucun domaine propre n'est configuré : `sslip.io` change avec l'IP du VPS.
8. `.env.example` ne liste que les variables du front ; les secrets de fonctions sont inventoriés uniquement ici, à partir du code (`AI_PROVIDERS`, `AI_DAILY_LIMIT`, `AI_PROVIDER_STUB`, `ALLOWED_ORIGINS`, clés Supabase).
