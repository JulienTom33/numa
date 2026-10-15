# Journal de décisions

Décisions d'architecture et règles évolutives du projet Numa. Ajouter une entrée à chaque décision structurante, la plus récente en premier.

## Format d'entrée

```
## AAAA-MM-JJ — Titre de la décision

Contexte : pourquoi la question se posait.
Décision : ce qui a été choisi.
Alternatives écartées : le cas échéant.
```

## Entrées

## 2026-10-15 — Lieu de naissance : Open-Meteo Geocoding et fuseau via la base tz (issue #19)

Contexte : l'onboarding (#79) doit proposer des villes dès 2 caractères, enregistrer latitude/longitude et déterminer le fuseau horaire historique applicable à la date de naissance, sans exposer de clé côté client.
Décision :
- Géocodage via **Open-Meteo Geocoding API** (`geocoding-api.open-meteo.com/v1/search`), appelée depuis l'Edge Function `geocode` (JWT obligatoire, CORS `ALLOWED_ORIGINS`). Aucune clé requise, résultats localisés en français (`language=fr` : « États-Unis », « Île-de-France »), données GeoNames (CC BY 4.0) incluant pour chaque lieu le **fuseau IANA** déterminé à partir de ses coordonnées : pas de bibliothèque de recherche de fuseau à embarquer. Seules les localités habitées (codes GeoNames `PPL*`) sont renvoyées, 8 par défaut, 10 au maximum ; timeout fournisseur de 5 s. Aucune requête n'est journalisée (la ville de naissance est une donnée personnelle) ; seule la saisie de recherche est transmise au fournisseur, sans identifiant utilisateur.
- Décalage UTC à la date et l'heure de naissance calculé par une fonction pure (`src/lib/utcOffset.ts`) à partir de la base tz embarquée dans le moteur JavaScript (`Intl.DateTimeFormat`, ICU) : historique et heure d'été inclus (ex. pas d'heure d'été en France en 1975, réintroduite en 1976). Heure répétée (retour à l'heure d'hiver) : première occurrence retenue, statut `ambiguous` ; heure sautée : décalage d'avant le saut, statut `nonexistent`.
Limites :
- Conditions Open-Meteo : API gratuite réservée à l'usage non commercial, environ 10 000 appels/jour partagés par adresse IP (les Edge Functions partagent leurs IP de sortie). Avant une mise en production commerciale : abonnement Open-Meteo (clé à ajouter en secret Edge Function) ou bascule vers GeoNames (compte gratuit, usage commercial autorisé). Le fournisseur est isolé dans `supabase/functions/geocode/places.ts`.
- La précision du décalage dépend de la version de la base tz du navigateur ; avant l'adoption d'une heure légale (Paris avant 1911), la base donne le temps moyen local, arrondi à la minute. Pour les calculs astrologiques côté serveur (#20), recalculer le décalage côté fonction plutôt que de faire confiance à la valeur envoyée par le client.
Alternatives écartées : GeoNames (compte et nom d'utilisateur à gérer en secret, limite horaire de 1 000 appels) ; Nominatim/OpenStreetMap (pas d'autocomplétion autorisée par sa politique d'usage, pas de fuseau horaire) ; API Google/Mapbox (payantes, clé et facturation) ; bibliothèque de fuseau par coordonnées (`tz-lookup`, `geo-tz`) redondante avec le fuseau fourni par GeoNames.

## 2026-10-15 — Conversion d'une session anonyme en compte : même user id (issue #15)

Contexte : l'utilisateur produit des données (profil, naissance, thème, conversations) en session anonyme ; à l'inscription, il doit les retrouver sans ressaisie.
Décision : on **rattache une identité à l'utilisateur anonyme existant** (approche officielle Supabase) au lieu de créer un nouvel utilisateur : `auth.updateUser({ email })` (lien de confirmation, puis `updateUser({ password })`) ou `auth.linkIdentity({ provider })` pour l'OAuth. Le `auth.users.id` ne change pas, donc aucune donnée n'est copiée ni réattribuée. API client : `src/lib/accountUpgrade.ts` (`upgradeAnonymousAccount`, `resendUpgradeConfirmation`, `linkAnonymousAccountWithProvider`, `setAccountPassword`, `readUpgradeRedirectError`) et hook `useAccountUpgrade`. Erreurs normalisées (`UpgradeError` : `code`, `message` affichable, `retryable`).
- `profiles.status` (`anonymous` | `authenticated`) est **dérivé** de `auth.users.is_anonymous` : trigger `after update of is_anonymous` sur `auth.users` + trigger `before insert or update` sur `profiles` qui recalcule la valeur, pour qu'un client ne puisse pas la forger via ses policies.
- Email déjà utilisé par un autre compte : refus (`email_already_used`), sans fusion automatique. Les données anonymes d'un utilisateur qui se connecte à un compte existant ne sont pas transférées (fusion de comptes hors périmètre).
- Config Supabase requise : `enable_manual_linking = true` pour `linkIdentity` ; URL de retour du lien listée dans les redirect URLs ; la confirmation email (Auth → Email) détermine si la conversion est immédiate ou attend le clic.
Alternatives écartées : créer un nouvel utilisateur puis migrer les lignes par `user_id` (fonction serveur privilégiée, risque de perte partielle, nouvelles sessions à gérer) ; statut stocké librement par le client (forgeable).

## 2026-10-15 — Code serveur : Supabase Edge Functions (issue #98)

Contexte : l'app est un site statique (build Vite servi par Caddy) ; tout code exécuté dans le navigateur est public. Les appels aux API astrologique (#20) et IA (#26), dont les clés doivent rester secrètes, et le quota de questions anonymes (#27), qui ne doit pas être contournable, exigent du code serveur. Constat associé : les policies actuelles de `usage_counters` autorisent l'utilisateur à modifier ou supprimer son propre compteur, donc le quota géré côté client est contournable.
Décision : le code serveur est écrit en **Supabase Edge Functions** (Deno), dans `supabase/functions/`.
- Authentification : `verify_jwt = true` pour toute fonction appelée depuis l'app. La plateforme rejette les requêtes sans JWT valide (compte ou session anonyme, anciennes clés HS256 comme nouvelles clés asymétriques), puis la fonction relit l'appelant via `auth.getClaims()` (`sub`, `is_anonymous`) dans `_shared/auth.ts`. `verify_jwt = false` uniquement pour les webhooks entrants, avec vérification de signature dans le code.
- Les écritures sensibles (compteurs de quota, résultats de calcul, réponses IA) sont faites par les fonctions ; les tables concernées ne seront plus modifiables par le client (à appliquer dans #27).
- Secrets : variables d'environnement des fonctions (`supabase secrets set`), jamais `VITE_*`. La plateforme fournit `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` et `SUPABASE_SECRET_KEYS`.
- Clés API : utiliser les nouvelles clés `sb_publishable_…` / `sb_secret_…`. Les clés `anon` / `service_role` cessent de fonctionner fin 2026 (migration du client à faire avant cette date).
- Contraintes à respecter : 2 s de CPU par requête (les attentes réseau ne comptent pas), 150 s de durée maximale sur le plan Free (400 s sur les plans payants), 256 Mo de mémoire. Les appels IA longs se font en streaming ; aucun calcul astrologique lourd dans la fonction (délégué à l'API externe, cf. #50).
- Socle commun : CORS limité à `ALLOWED_ORIGINS`, erreurs JSON `{ error: { code, message } }` sans détail interne, journalisation sans donnée personnelle.
- Déploiement : workflow `deploy-functions.yml` sur push `master`, inactif tant que le projet Supabase distant n'est pas configuré.
Alternatives écartées : API Node conteneurisée sur le VPS OVH (serveur, mises à jour, TLS et supervision supplémentaires à maintenir, vérification des JWT Supabase à réimplémenter) ; Cloudflare Workers (nouveau fournisseur et nouveaux secrets hors de l'écosystème Supabase, sans accès direct au Postgres du projet) ; n8n (hors chemin critique, cf. 2026-09-14).

## 2026-10-15 — Workflow Git simplifié : une branche par ticket vers `master` (issue #91)

Contexte : le workflow documenté (`master` → `epic/<slug>/main` → `epic/<slug>/issue-<id>-<slug>`) n'a jamais été appliqué : les 11 PRs de l'epic fondations ont toutes ciblé `master` directement, et aucune branche `epic/*/main` n'a été créée. La documentation contredisait la pratique.
Décision : une branche `issue-<id>-<slug>` par ticket, créée depuis `master`, PR directe vers `master`. Les epics regroupent les tickets dans GitHub (labels `type:epic`, GitHub Project) sans branche d'intégration. Les garde-fous restent : PR obligatoire, CI obligatoire, aucun merge automatique. Aucune approbation n'est exigée par GitHub (0 approbation requise) : avec un seul mainteneur, une approbation obligatoire bloquerait tout merge puisque GitHub interdit d'approuver sa propre PR ; la relecture et le merge restent des actions manuelles du mainteneur.
Alternatives écartées : appliquer réellement les branches `epic/*/main` — surcoût (double PR par ticket, synchronisation des branches) sans bénéfice pour un projet à un seul développeur où chaque ticket est livrable isolément.

## 2026-09-14 — Usage de n8n (issue #44)

Contexte : n8n était listé dans la stack (`architecture.md`) sans périmètre défini. Besoin de clarifier sa place avant que des workflows soient ajoutés au fil de l'eau.
Décision : n8n reste **hors chemin critique**. Auth, chat et calcul astrologique restent implémentés directement dans l'application (Supabase + backend applicatif), jamais derrière un workflow n8n. Aucune tâche asynchrone ne justifie n8n au stade actuel du MVP (pas de file d'attente, pas d'intégration tierce en place) ; n8n n'est donc **pas installé** sur OVH pour l'instant. S'il devient nécessaire (ex. notifications planifiées, intégration tierce non critique), l'installation se fera en conteneur Docker séparé de l'application principale, avec : sauvegardes régulières du volume de données n8n, accès exposé exclusivement en HTTPS (Caddy, comme pour l'app — voir `deployment.md`), et accès administrateur n8n protégé par identifiants dédiés hors dépôt (secret GitHub Actions ou `.env` serveur, jamais commité). Tout webhook n8n exposé publiquement devra être signé/authentifié avant traitement.
Alternatives écartées : installer n8n dès maintenant "au cas où" — écarté (pas de besoin identifié, ajouterait de la surface d'attaque et de maintenance sans valeur MVP).

## 2026-09-14 — Déploiement OVH (issue #43)

Contexte : besoin d'un déploiement HTTPS reproductible sur le VPS OVH (Ubuntu 22.04), avec secrets hors dépôt et redémarrages/logs gérés (issue #43). Aucun nom de domaine disponible au moment du déploiement.
Décision : conteneurisation Docker (build multi-stage Vite → image Caddy servant le statique) ; Caddy comme reverse proxy avec HTTPS automatique (Let's Encrypt) ; en l'absence de domaine, `SITE_ADDRESS` pointe sur un sous-domaine `sslip.io` résolvant vers l'IP du VPS (permet un certificat TLS valide sans domaine propre, migration ultérieure = simple changement de secret) ; déploiement automatisé via `.github/workflows/deploy.yml` (rsync + `docker compose up --build` en SSH) déclenché sur push `master` ; secrets (accès SSH, clés Supabase, adresse du site) exclusivement dans les secrets GitHub Actions et le fichier `.env` généré côté serveur, jamais commités ; accès serveur par clé SSH dédiée au déploiement (pas de mot de passe) ; `ufw` restreint le VPS aux ports 22/80/443.
Alternatives écartées : Nginx + Certbot (renouvellement TLS manuel à gérer, plus de configuration) au profit de Caddy (HTTPS automatique intégré) ; déploiement sans conteneurisation (build direct sur le serveur) écarté au profit de Docker pour la reproductibilité et la gestion des redémarrages/logs.

## 2026-08-21 — Stratégie de tests et CI (issue #59)

Contexte : besoin de rendre chaque changement testable et de bloquer le merge en cas d'échec qualité (issue #59). Le dépôt ne contenait encore aucun code d'application.
Décision : scaffold minimal Vite + React + TypeScript + Tailwind ; Vitest + React Testing Library (`jsdom`) pour les tests ; seuil de couverture initial fixé à 70 % (lignes, statements, fonctions, branches) ; workflow GitHub Actions `.github/workflows/ci.yml` exécutant lint/typecheck/test:coverage/build sur PR et push vers `master` et `epic/*/main`, plus un job dédié aux migrations Supabase (`supabase db reset`, ignoré tant que `supabase/migrations` n'existe pas) ; `master` protégée via branch protection classique, `epic/*/main` via un repository ruleset (pattern glob, actif avant même la création de la branche) — check CI obligatoire, branche à jour, 1 review humaine, force-push et suppression interdits.
Alternatives écartées : seuil de couverture à 0 % (pas de garde-fou) ou à 100 % (trop rigide en phase de démarrage) — 70 % retenu comme compromis initial, révisable.

## 2026-08-21 — Structuration de CLAUDE.md

Contexte : besoin d'encadrer Claude Code sans concentrer toute la documentation dans un seul fichier long (issue #58).
Décision : `CLAUDE.md` court à la racine + documents spécialisés sous `docs/claude/` (architecture, git-workflow, development, supabase, ai-astrology, security, pull-requests, decision-log), indexés depuis `CLAUDE.md`.
Alternatives écartées : un unique fichier `CLAUDE.md` exhaustif — jugé moins maintenable dans la durée.
