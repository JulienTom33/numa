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

## 2026-10-16 — Vulnérabilités npm : Vite 6 et Vitest 4, Tailwind 3 conservé (issue #123)

Contexte : `npm audit` remontait 17 vulnérabilités (3 critiques, 9 élevées, 5 modérées), toutes dans des dépendances de développement (`npm audit --omit=dev` : 0). Les critiques venaient de Vitest 2 (`tinypool`, serveur UI, `@vitest/mocker`), les élevées de Vite 5 (`server.fs.deny`, path traversal), de Tailwind 3 (`chokidar` 3 → `micromatch` → `braces`) et de transitifs (`brace-expansion`, `js-yaml`, `source-map-js`).
Décision :
- `npm audit fix` pour les transitifs corrigeables sans montée majeure.
- Vite 5 → 6.4.4 (première version non vulnérable, branche maintenue) ; Vitest et `@vitest/coverage-v8` 2 → 4.1.12 (première ligne corrigeant tous les avis Vitest, compatible Vite 6). `@vitejs/plugin-react` 4.7 et `@storybook/react-vite` 10.6 acceptent déjà Vite 6. Vitest 4 ne compte plus par défaut les fichiers non chargés par les tests : `coverage.include` (`src/**/*.{ts,tsx}`) rétablit le périmètre précédent.
- Tailwind CSS reste en 3.4.19 (dernière 3.x). Les 7 vulnérabilités restantes (`tailwindcss`, `chokidar`, `micromatch`, `braces`, `fast-glob`, `postcss-nested`, `postcss-selector-parser` ; 5 élevées, 2 modérées) sont des dénis de service (complexité, récursion) déclenchés par les motifs glob et sélecteurs fournis à l'outil de build. Ces entrées sont celles du dépôt (`tailwind.config.ts`, CSS), rien n'est exposé à un utilisateur ni embarqué dans le bundle. Aucune version corrigée de `braces` n'existe : seul Tailwind 4 retire cette chaîne.
- Contrôle CI bloquant `npm audit --omit=dev --audit-level=high` (voir `development.md`).
Alternatives écartées : `npm audit fix --force` (Vite 8, Vitest 5 et Tailwind 4 d'un coup ; `@vitejs/plugin-react` 6 exige Vite 8) ; Vite 7 ou 8 (non requis pour corriger, changements de cible navigateur et de bundler) ; Tailwind 4 (configuration CSS-first, `tailwind.config.ts` et tokens à réécrire, rendu à revalider écran par écran : ticket séparé) ; `overrides` npm forçant `postcss-selector-parser` 7 sous Tailwind 3 (majeure non supportée par Tailwind 3, risque de CSS généré différent).

## 2026-10-16 — Inscription et connexion : un seul état d'auth, conversion signalée par user id (issue #14)

Contexte : les écrans d'auth (#75, #76) doivent créer un compte ou s'y connecter, sans perdre les données d'une session anonyme (#15), et l'écran Migration (#86) doit savoir qu'une conversion vient d'aboutir, y compris quand le lien est ouvert dans un autre onglet.
Décision : hook `useAuth()` instancié une fois dans `App` et passé au parcours `AuthFlow`. En session anonyme, l'inscription appelle les fonctions de `accountUpgrade.ts` (même user id) ; la connexion à un compte existant utilise `signInWithOtp` / `signInWithOAuth` après un avertissement (pas de fusion). La conversion en cours est mémorisée par user id dans `localStorage` ; `converted` = utilisateur courant non anonyme avec ce même id. Lien magique avec `shouldCreateUser: true` en inscription comme en connexion, pour ne pas révéler si une adresse a un compte.
Alternatives écartées : `useAccountUpgrade` dans le parcours (sa méthode `upgrade` ne renvoie pas le résultat de l'appel, nécessaire à `MagicLinkScreen`) ; détection de la conversion par transition en mémoire (perdue au rechargement et dans l'onglet ouvert par le lien) ; `shouldCreateUser: false` en connexion (erreur distincte pour une adresse inconnue).

## 2026-10-16 — Moteur astrologique : Astronomy Engine en local (issue #50)

Statut : **décidée** le 2026-10-16 par le mainteneur.
Contexte : #20 (thème natal), #22 (cache) et #80 (ascendant) exigent un fournisseur de calcul. Comparatif détaillé, sources et mesures : `docs/research/api-astrologiques.md`.
Décision :
- **Astronomy Engine** (`astronomy-engine`, MIT, JS pur) exécuté localement dans une Edge Function.
  - Gratuit, sans quota, sans contrainte de licence pour Numa, aucune donnée de naissance envoyée à un tiers.
  - Écart mesuré avec JPL Horizons ≤ 3″ (Soleil, Lune) sur 5 profils de référence.
  - Ascendant et MC calculés par formule depuis le temps sidéral et l'obliquité ; identiques à Swiss Ephemeris à 0,1″ près.
- Maisons :
  - Placidus et les autres systèmes sont à coder nous-mêmes à partir de formules publiques, puis à valider sur les profils de référence.
  - Le repli aux latitudes polaires est à définir.
- Swiss Ephemeris n'est pas retenu (AGPL refusée). Il ne sert que de référence de validation dans des tests exécutés hors dépôt, sans dépendance du projet.
- Pas de fournisseur de secours : aucune API hébergée n'est retenue. Réévaluation possible plus tard.
- Conversion horaire côté serveur :
  - fuseau IANA + `resolveUtcOffset` ;
  - avant l'heure légale, décalage = longitude / 15. La base tz donne le LMT de la ville de référence, d'où 2,7° d'erreur d'ascendant mesurée sur un profil de 1879.
- La version du moteur est enregistrée avec chaque thème et entre dans la clé de cache (#22).
Alternatives écartées :
- Swiss Ephemeris via `sweph-wasm` : plus précis (≤ 0,3″), 25 systèmes de maisons, mais AGPL-3.0 imposée à tout Numa, ou licence professionnelle à 700 CHF.
- AstrologyAPI, FreeAstrologyAPI, Prokerala — clé et facturation, données de naissance envoyées à un tiers soumis au droit indien, fuseau en décalage numérique (FreeAstrologyAPI), cache limité à 24 h sans archivage (Prokerala), stockage non traité (autres) ; non testées faute de clé.

## 2026-10-15 — Internationalisation : react-i18next (issue #118)

Contexte : les textes de l'interface étaient écrits en dur dans les composants (review du mainteneur : « il va falloir mettre en place du i18n pour des trad »). Plusieurs écrans sont en cours (#105, #108–#112) : sans infrastructure commune, chaque écran aurait accumulé de nouvelles chaînes à migrer.
Décision : `i18next` + `react-i18next`.
- Français seul pour l'instant (`lng` et `fallbackLng` : `fr`), structure prête pour l'anglais (un dossier `locales/<langue>/` typé par `Translations`).
- Ressources JSON embarquées dans le bundle (aucun chargement réseau, init synchrone `initAsync: false`) : volume faible, pas de flash de clés au démarrage, rendu immédiat en test et dans Storybook.
- Un namespace par écran ou domaine (`common`, `welcome`, `auth`, `ui`, `astrology`…).
- Typage strict des clés via `CustomTypeOptions` (`strictKeyChecks`) : une clé inexistante casse le typecheck.
- Nombres et dates via `Intl` avec la langue courante (`src/i18n/format.ts`).
- Règle ESLint `i18next/no-literal-string` (mode `jsx-text-only`) en erreur sur `src/**` hors tests, stories et `src/docs/**`.
Alternatives écartées : `react-intl` / FormatJS (syntaxe ICU plus lourde pour les traducteurs, typage des clés moins direct) ; LinguiJS (étape de compilation des catalogues et macros supplémentaires) ; dictionnaire maison (pluriels, interpolation et changement de langue à réimplémenter). Chargement des traductions par HTTP (`i18next-http-backend`) écarté tant qu'il n'y a qu'une ou deux langues.

## 2026-10-15 — Review automatique des PR par Claude en CI (issue #116)

Contexte : le mainteneur est seul à relire les PR. Une première passe automatique doit vérifier les conventions du dépôt et faire corriger les écarts avant la review humaine, sans jamais remplacer celle-ci.
Décision : workflow `claude-review.yml` avec `anthropics/claude-code-action` épinglée par SHA (v1.0.248). Verdict en sortie structurée JSON, traduit en labels `claude-review:ok` / `claude-review:changes` et en notifications Discord. Retours publiés en commentaires inline et en review de type commentaire, jamais `APPROVE` ni `REQUEST_CHANGES` : la review Claude ne bloque ni ne débloque un merge, qui reste manuel. Boucle de correction automatique bornée à 3 itérations par PR (compteur : commentaires marqués postés par `github-actions[bot]`), puis « intervention humaine requise ». Pas d'exécution sur les forks ni les brouillons ; workflow inactif sans `ANTHROPIC_API_KEY` ni `CLAUDE_CODE_OAUTH_TOKEN`. Les corrections sont poussées par la GitHub App Claude, dont les pushes relancent CI et review (le `GITHUB_TOKEN` ne le ferait pas).
Coût : une review par push sur une PR (≤ 40 tours d'agent), plus au plus 3 corrections par PR (≤ 60 tours). Avec `ANTHROPIC_API_KEY`, facturation à l'usage ; avec `CLAUDE_CODE_OAUTH_TOKEN`, consommation du quota de l'abonnement. Durée bornée par `timeout-minutes` (20 min review, 30 min correction).
Limites : un LLM peut manquer un défaut ou en signaler à tort ; la review humaine reste obligatoire. Le contenu d'une PR peut tenter une injection de prompt : risque limité aux contributeurs ayant un accès en écriture (forks exclus) et aux outils autorisés (lecture seule pour la review, push vers la seule branche de la PR pour la correction). La GitHub App ne peut pas modifier `.github/workflows/`, donc les écarts dans les workflows sont signalés mais pas corrigés. Le workflow n'a pas pu être testé de bout en bout avant configuration des secrets.
Alternatives écartées : `REQUEST_CHANGES` / `APPROVE` par le bot (bloquerait ou simulerait une décision humaine) ; correction via le `GITHUB_TOKEN` (le push ne relancerait ni CI ni review) ; déclenchement sur `workflow_run` après CI (exécute la version `master` du workflow et complique le lien avec la PR).

## 2026-10-16 — Heure locale moyenne du lieu avant l'heure légale (issue #125)

Contexte : avant l'adoption d'une heure légale, la base tz renvoie l'heure locale moyenne (LMT) de la **ville de référence** du fuseau (Berlin +0:53:28 pour `Europe/Berlin`), pas celle du lieu de naissance. L'étude #50 mesure 2,7° d'erreur d'ascendant pour Ulm 1879 (LMT d'Ulm +0:39:56).
Décision :
- `resolveUtcOffset(local, timeZone, longitude?)` : si la longitude est fournie et que l'instant tombe dans la période LMT du fuseau, décalage = longitude × 240 s (longitude / 15 h, arrondi à la seconde), `utc` à la seconde, statut `localMeanTime` avec `offsetSeconds` (`offsetMinutes` arrondi). Sans longitude ou hors période LMT, résultat identique à l'existant.
- Détection de la période LMT : le premier décalage de la base tz (lu via `Intl` au 1er janvier 1000, à la seconde) est le LMT de la ville de référence ; l'instant est en période LMT si son décalage est égal à celui-ci, à la seconde. Un fuseau dont le premier décalage est un multiple du quart d'heure (`UTC`, `Etc/GMT±N`, zones Antarctique `-00`) n'a pas de LMT. Comparaison à la seconde plutôt que « décalage non aligné sur le quart d'heure » : ce dernier critère confondrait le LMT avec les heures légales à la seconde postérieures (Paris PMT 1891-1911, Moscou MMT 1880-1916…) et ne verrait pas les LMT tombant par hasard sur la minute (Varsovie +1:24).
- `Intl` ne voit pas les transitions sans changement de décalage : quand le fuseau passe du LMT à une heure légale de même décalage (temps moyen de la ville de référence rendu légal : Paris 16/03/1891, Moscou 1880, Rome 1866…), la date de début de cette heure légale est tabulée dans `src/lib/legalMeanTime.ts` (72 fuseaux et liens). Table générée depuis les sources tzdata (`eggert/tz` : `Zone` dont la première ligne `LMT` est suivie d'une ligne de même décalage sans règle ; liens `Link` inclus), contrôlée par `legalMeanTime.test.ts` (même décalage de part et d'autre, décalage non standard).
Limites :
- Données tz antérieures à 1970 non garanties par le projet tz ; pays ayant utilisé des heures locales intermédiaires absentes de la base (heure de la gare, de la capitale régionale, usages locaux non officiels) : le LMT du lieu est appliqué jusqu'à la première heure légale connue de la base.
- Fuseaux liés (`Europe/Amsterdam` → `Europe/Brussels`…) : la période LMT est celle du fuseau cible ; l'heure légale propre à la ville liée avant 1970 n'est pas reproduite.
- La table est figée sur la version tzdata utilisée à sa génération ; à régénérer si une version de la base modifie ces dates.
- Naissance dans les minutes qui entourent l'adoption de l'heure légale : l'appartenance à la période LMT est évaluée à l'instant UTC calculé avec la longitude du lieu, alors que la loi fixait la bascule en heure de la ville de référence.
- Appelants : aucun appelant de production n'existe encore ; l'onboarding (#79) et le calcul de thème (#20) doivent passer la longitude du lieu enregistré.
Alternatives écartées : `timeZoneName: "longOffset"` seul (même information que le calcul à la seconde, mêmes transitions invisibles) ; recherche dichotomique de la première transition (coût supérieur, mêmes transitions invisibles) ; embarquer une bibliothèque tz complète (taille du bundle).

## 2026-10-15 — Lieu de naissance : Open-Meteo Geocoding et fuseau via la base tz (issue #19)

Contexte : l'onboarding (#79) doit proposer des villes dès 2 caractères, enregistrer latitude/longitude et déterminer le fuseau horaire historique applicable à la date de naissance, sans exposer de clé côté client.
Décision :
- Géocodage via **Open-Meteo Geocoding API** (`geocoding-api.open-meteo.com/v1/search`), appelée depuis l'Edge Function `geocode` (JWT obligatoire, CORS `ALLOWED_ORIGINS`). Aucune clé requise, résultats localisés en français (`language=fr` : « États-Unis », « Île-de-France »), données GeoNames (CC BY 4.0) incluant pour chaque lieu le **fuseau IANA** déterminé à partir de ses coordonnées : pas de bibliothèque de recherche de fuseau à embarquer. Seules les localités habitées (codes GeoNames `PPL*`) sont renvoyées, 8 par défaut, 10 au maximum ; timeout fournisseur de 5 s. Aucune requête n'est journalisée (la ville de naissance est une donnée personnelle) ; seule la saisie de recherche est transmise au fournisseur, sans identifiant utilisateur.
- Décalage UTC à la date et l'heure de naissance calculé par une fonction pure (`src/lib/utcOffset.ts`) à partir de la base tz embarquée dans le moteur JavaScript (`Intl.DateTimeFormat`, ICU) : historique et heure d'été inclus (ex. pas d'heure d'été en France en 1975, réintroduite en 1976). Heure répétée (retour à l'heure d'hiver) : première occurrence retenue, statut `ambiguous` ; heure sautée : décalage d'avant le saut, statut `nonexistent`.
Limites :
- Conditions Open-Meteo : API gratuite réservée à l'usage non commercial, environ 10 000 appels/jour partagés par adresse IP (les Edge Functions partagent leurs IP de sortie). Avant une mise en production commerciale : abonnement Open-Meteo (clé à ajouter en secret Edge Function) ou bascule vers GeoNames (compte gratuit, usage commercial autorisé). Le fournisseur est isolé dans `supabase/functions/geocode/places.ts`.
- La précision du décalage dépend de la version de la base tz du navigateur. Pour les calculs astrologiques côté serveur (#20), recalculer le décalage côté fonction plutôt que de faire confiance à la valeur envoyée par le client.
Alternatives écartées : GeoNames (compte et nom d'utilisateur à gérer en secret, limite horaire de 1 000 appels) ; Nominatim/OpenStreetMap (pas d'autocomplétion autorisée par sa politique d'usage, pas de fuseau horaire) ; API Google/Mapbox (payantes, clé et facturation) ; bibliothèque de fuseau par coordonnées (`tz-lookup`, `geo-tz`) redondante avec le fuseau fourni par GeoNames.

## 2026-10-15 — Quota de questions anonymes protégé côté serveur (issue #27)

Contexte : le quota de deux questions anonymes reposait sur `increment_usage_counter`, fonction `security invoker` exécutable par `authenticated`, et sur des policies `insert` / `update` / `delete` de `usage_counters` ouvertes au propriétaire. Une session anonyme pouvait donc remettre son compteur à 0 (`update`), le supprimer (`delete`) ou simplement ne jamais appeler l'incrément : la limite était contournable.
Décision :
- `usage_counters` est en lecture seule pour le client (policies d'écriture supprimées, privilèges `insert` / `update` / `delete` révoqués) ; `increment_usage_counter` est supprimée.
- Le quota anonyme couvre toute la session (ligne `period_start = '-infinity'`), pas une journée.
- Seule l'Edge Function `chat` (clé secrète, rôle `service_role`) le modifie, via des fonctions `security definer` à `search_path` vide, non exécutables par `anon` / `authenticated` : `reserve_question` (réservation atomique sous verrou de ligne, refus si utilisées + en cours ≥ limite), `commit_question` (après réponse réussie du fournisseur), `release_question` (erreur fournisseur : rien n'est décompté), `question_count` (lecture).
- Les réservations (`question_reservations`, RLS sans policy) expirent après 5 minutes, au-delà de la durée maximale d'une fonction, pour qu'une exécution interrompue ne bloque pas la session.
- La limite (2) est définie une seule fois, dans la fonction ; le client lit le compteur via `GET chat` et ne le calcule jamais.
- Le fournisseur IA est injecté (`QuestionProvider`) : réponse fixe tant que #26 n'est pas livré. Les comptes identifiés ne sont pas soumis à ce quota (rate limiting à traiter avec #26).
Alternatives écartées : vérification côté client ou via policy RLS (`with check (count <= 2)`) — contournable par suppression de ligne et sans lien avec le succès de l'appel fournisseur ; incrément avant l'appel fournisseur sans réservation — une erreur fournisseur consommerait une question ; incrément après l'appel sans réservation — deux requêtes simultanées dépasseraient la limite.

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
- Contraintes à respecter : 2 s de CPU par requête (les attentes réseau ne comptent pas), 150 s de durée maximale sur le plan Free (400 s sur les plans payants), 256 Mo de mémoire. Les appels IA longs se font en streaming. Le calcul astrologique est local, dans une Edge Function avec Astronomy Engine (décision du 2026-10-16, #50) : environ 0,2 ms par thème mesuré en local.
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
