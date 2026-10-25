# IA & Astrologie

## Calcul astrologique

- Les calculs astrologiques (positions planétaires, thème natal, etc.) sont faits localement, dans une Edge Function (`supabase/functions/`), avec la bibliothèque **Astronomy Engine** (`astronomy-engine`, MIT). Aucune API astrologique externe, aucune clé, aucune donnée de naissance envoyée à un tiers (décision du 2026-10-16, `decision-log.md`, #50).
- Ascendant et MC sont dérivés du temps sidéral et de l'obliquité. Les systèmes de maisons (Placidus, etc.) sont codés à partir de formules publiques et validés sur les profils de référence de `docs/research/api-astrologiques.md`.
- Swiss Ephemeris (AGPL) n'est jamais une dépendance du projet. Il ne sert que de référence de validation dans des tests exécutés hors dépôt.
- Chaque thème enregistre la version du moteur ; l'heure inconnue ou ambiguë est signalée.

## Edge Function `natal-chart`

Entrée : `GET` ou `POST` sans corps utile, JWT obligatoire (session anonyme comprise). Les données viennent de la dernière ligne `birth_data` de l'appelant, lue avec son JWT (RLS) ; aucun identifiant n'est lu dans la requête. Le résultat est mis en cache (voir « Cache »).

Sortie `200` : `{ chart, cached }`, schéma versionné (`schemaVersion: 1`).

- `engine` : `{ name: "astronomy-engine", version }` ; `confidence` : `high` | `medium` | `low`.
- `birth` : données utilisées ; `instant` : `utc`, `offsetMinutes`, `offsetSeconds` (temps moyen local seulement), `status` (`exact`, `ambiguous`, `nonexistent`, `localMeanTime`), `localTimeUsed` (12:00 si l'heure est inconnue).
- `bodies` : Soleil, Lune, Mercure à Pluton, avec `longitude` écliptique vraie de la date (0–360), `sign`, `degreeInSign`, `retrograde`, `speed` (°/jour), `house` (null sans maisons).
- `angles` (`ascendant`, `midheaven`) et `houses` (`requestedSystem`, `system`, `fallback`, `cusps`) : présents seulement si l'heure est exacte ou approximative, sinon `null`. Placidus par défaut, repli Porphyre aux latitudes polaires ou sans convergence (`fallback` renseigné).
- `aspects` : conjonction (orbe 8°), sextile (5°), carré (7°), trigone (8°), opposition (8°) entre les dix corps, triés par orbe croissant.
- `moonSignChange` : `{ from, to }` si la Lune change de signe sur la journée locale (heure inconnue) ou dans la marge de l'heure approximative (±30 min, ±2 h, ±6 h pour « plus de 2 h »), sinon `null`.
- `warnings` : `unknown_time`, `approximate_time`, `ambiguous_local_time`, `nonexistent_local_time`, `local_mean_time`, `polar_fallback`, `moon_sign_uncertain`. Le front les traduit ; la fonction n'envoie aucun texte.

Mode progression (`?progress=1`, #81) : même authentification et mêmes erreurs HTTP (`401`, `404`, `405`) ; en cas de succès la réponse est un flux NDJSON (`application/x-ndjson`), une ligne JSON par événement : `{ "phase": ... }` émis par `computeNatalChart` au moment où chaque phase se termine (`validation`, `timezone`, `positions`, `ascendant`, `houses_aspects`, `reading`, dans cet ordre), puis `{ "chart": ..., "cached": ... }` (même objet que le mode JSON) ou `{ "error": { code, message } }` si le calcul échoue après le début du flux. Sans le paramètre, le contrat JSON est inchangé. Le client (`src/features/chart/natalChartProgress/natalChartProgress.ts`) coche une étape à la réception de son événement.

Confiance : `high` = heure exacte non ambiguë ; `medium` = heure approximative, ou exacte mais ambiguë/inexistante (une heure d'écart déplace l'ascendant d'environ 11°) ; `low` = heure inconnue.

Erreurs : `{ error: { code, message } }` avec `message` égal au code. `401 unauthenticated` / `invalid_token`, `404 birth_data_not_found`, `405 method_not_allowed`, `422 invalid_birth_data` (date, fuseau ou coordonnées invalides), `500 internal_error`.

Le décalage UTC est calculé par `shared/time/` (`utcOffset` et `legalMeanTime`), source unique importée par le client et par les Edge Functions.
## Edge Function `ephemeris` (#152)

Éphéméride publique, identique pour tous : aucune donnée personnelle, aucun stockage, aucune lecture de base. Calcul avec Astronomy Engine (positions via `natal-chart/bodies.ts`, aspects via `natal-chart/aspects.ts`, même moteur que le thème natal). Types partagés client/Deno : `shared/contracts/ephemeris/ephemeris.ts` ; client : `src/features/ephemeris/ephemeris/ephemeris.ts` (`fetchEphemeris`, résultat `{ data, error }`, erreurs en codes).

Entrée : `GET`, JWT obligatoire (session anonyme comprise, `createHandler`). Dates UTC `YYYY-MM-DD`, soit `?date=` (un jour), soit `?from=&to=` (bornes incluses). Plage maximale : 31 jours.

Sortie `200` : `{ schemaVersion: 1, engine: { name, version }, range: { from, to, days }, days, events }`.

- `days[]` (un par jour UTC, calculé à 12:00 UTC, champ `instant`) : `bodies` (Soleil, Lune, Mercure à Pluton : `longitude` écliptique vraie de la date, `sign`, `degreeInSign`, `retrograde`, `speed` en °/jour), `moon` (`name` parmi `new_moon`, `waxing_crescent`, `first_quarter`, `waxing_gibbous`, `full_moon`, `waning_gibbous`, `last_quarter`, `waning_crescent` ; `angle` d'élongation ; `illumination` 0–1 ; `age` en jours depuis la dernière nouvelle lune), `aspects` entre les dix corps (conjonction 8°, sextile 5°, carré 7°, trigone 8°, opposition 8°, triés par orbe croissant, mêmes orbes que le thème natal).
- `events` sur la plage (du premier jour 00:00 UTC inclus au lendemain du dernier jour exclu), horodatés `at` en ISO UTC à la seconde : `ingresses` (`body`, `from`, `to`, `retrograde`), `stations` (`body`, `type` `retrograde` | `direct`, `sign`, `longitude`) pour Mercure à Pluton, `moonPhases` (`new_moon`, `first_quarter`, `full_moon`, `last_quarter`), `eclipses` (`body` `solar` | `lunar`, `kind` `penumbral` | `partial` | `annular` | `total`, instant du maximum).
- `Cache-Control: public, max-age=3600, s-maxage=86400`. La réponse est déterministe : aucune horloge, mêmes entrées et même version du moteur donnent le même corps.

Erreurs : `{ error: { code, message } }`, `message` égal au code. `400 invalid_date` (absente ou mal formée, jour inexistant), `400 invalid_range` (`to` avant `from`, `from` sans `to`, `date` combiné à `from`/`to`), `400 range_too_long` (plus de 31 jours), `401 unauthenticated` / `invalid_token`, `405 method_not_allowed`, `500 internal_error`. Le client ajoute `network_error`.

Précision : positions à 1′ d'arc ou mieux de JPL Horizons (longitude apparente de la date, géocentrique) sur 4 dates de contrôle (2000, 2024, 2025, 2050) pour les dix corps ; événements vérifiés sur des dates connues de 2024 (équinoxe et solstice, station de Mercure du 2024-04-01, éclipses du NASA Eclipse Web Site). Sources dans `supabase/functions/ephemeris/compute_test.ts` et `events_test.ts`.

## Cache des thèmes (#22)

- Table `natal_charts` : `chart_data` (le thème), `cache_key`, `birth_data_id`, `user_id`, `computed_at`. Unicité `(birth_data_id, cache_key)`. Lecture réservée au propriétaire (RLS) ; aucune écriture cliente (privilèges `insert`/`update`/`delete` retirés à `authenticated`), seule l'Edge Function écrit, avec la clé de service.
- Clé = SHA-256 hexadécimal d'un JSON canonique : date, heure (`HH:MM`, nulle si précision `unknown`), précision, marge (seulement si `approximate`), fuseau, latitude et longitude (6 décimales), système de maisons demandé (Placidus), `engine.name`, `engine.version`, `schemaVersion`. Ascendant déclaré (#80) : n'entre pas dans le calcul, donc pas dans la clé.
- Invalidation : toute modification de `birth_data` ou changement de version du moteur ou du schéma produit une nouvelle clé (miss). À l'écriture, les autres entrées du même `birth_data_id` sont supprimées : il n'y a jamais plus d'une entrée par donnée de naissance.
- Hit : le thème stocké est renvoyé sans recalcul, avec `cached: true` (`false` après un calcul). En mode `?progress=1`, un hit émet les événements de phase à la suite puis `{ chart, cached: true }`. `chart` est identique dans les deux cas : le contrat existant n'est pas modifié.
- Les erreurs (`invalid_birth_data`, échec de calcul) ne sont jamais écrites. Une panne du cache (lecture ou écriture) est ignorée : le thème est calculé et renvoyé normalement. L'écriture est idempotente (upsert sur la clé unique), donc deux requêtes concurrentes identiques ne créent qu'une entrée.

## Génération IA

- Les lectures textuelles sont générées à partir d'un contexte structuré (données astrologiques calculées + profil utilisateur), pas d'un prompt libre non contrôlé.
- Le contexte envoyé au modèle est explicite et traçable (pas de "prompt magique" caché).

## Règles éditoriales

- Les lectures sont **compréhensibles** : langage clair, pas de jargon non expliqué.
- Les lectures sont **transparentes** : la base (données astrologiques utilisées) reste accessible/consultable par l'utilisateur.
- Les lectures sont **non catégoriques** : pas d'affirmations absolues sur l'avenir ou la personnalité ; formulation en tendances et possibilités.
- Pas de contenu à caractère médical, financier ou juridique présenté comme un conseil.

## Ascendant, MC et maisons

Module serveur `supabase/functions/_shared/astrology/` (Deno, fonctions pures), sur Astronomy Engine (`npm:astronomy-engine@2.1.19`, MIT). Issue #126, entrée du 2026-10-16 dans `decision-log.md`.

- `computeAngles({ instant, latitude, longitude })` : temps sidéral local (RAMC, degrés), obliquité vraie, ascendant et MC en longitude écliptique tropicale. `instant` est un instant **UTC déjà résolu** (fuseau, heure d'été, temps moyen local : hors module).
- `computeHouses(location, system?)` : ascendant, MC et 12 cuspides (`longitude`, `sign`, `degreeInSign`), système demandé, système effectivement utilisé et repli éventuel.
- Systèmes disponibles : `placidus`, `porphyry` (Porphyre), `equal` (égales depuis l'ascendant), `whole-sign` (signes entiers).
- **Défaut : Placidus** (décidé par le mainteneur le 16/10/2026).
- **Repli : Porphyre** (décidé le 16/10/2026) quand Placidus est indéfini, au-delà des cercles polaires (|latitude| ≥ 90° − obliquité, environ 66,56°), ou ne converge pas. Le résultat l'indique : `system: "porphyry"`, `fallback: { from: "placidus", reason: "polar-latitude" | "placidus-not-converged" }`. À signaler à l'utilisateur dans la lecture (transparence).
- Latitude ±90° exacte, longitude hors [−180, 180] ou date invalide : `RangeError`.
- Précision mesurée : ≤ 0,12″ par rapport à Swiss Ephemeris 2.10.03 (référence calculée hors dépôt) sur les profils P1–P5 et les cas limites ; références et sources dans `houses_test.ts`.

## Edge Function `chat` : fournisseur IA et prompt (#26)

Entrée `POST { question, conversationId? }` (JWT obligatoire, session anonyme comprise) ; `GET` renvoie le quota. Sortie `200` : `{ answer, conversationId, messageId, quota }`. Question : 500 caractères maximum, motifs évidents de données personnelles (e-mail, téléphone, date) refusés en `400 personal_data_detected`.

- **Chaîne de fournisseurs** (`chain.ts`, `config.ts`) : Mistral `mistral-small-latest` (15 s) puis Groq `openai/gpt-oss-120b` (10 s), API compatible OpenAI (`/chat/completions`). Sur `429` avec `retry-after` inférieur à 2 s : une nouvelle tentative ; sinon, `5xx`, timeout ou réponse invalide : bascule sur le maillon suivant. Disjoncteur en mémoire de 3 minutes après un `429` sans `retry-after` ou deux échecs consécutifs. Plus aucun maillon disponible : `503 ai_unavailable` (message égal au code, le front traduit), la réservation de quota est libérée et rien n'est décompté.
- **Configuration sans code** : secret `AI_PROVIDERS` (tableau JSON ordonné de `{ id, baseUrl (https), model, timeoutMs, enabled, apiKeyEnv, extraBody? }`) remplace la chaîne par défaut ; ajouter un fournisseur compatible OpenAI = une entrée et son secret. Un maillon désactivé ou sans clé est ignoré.
- **Secrets** (Supabase uniquement, jamais `VITE_*`) : `MISTRAL_API_KEY`, `GROQ_API_KEY`, `AI_PROVIDERS` (optionnel), via `supabase secrets set`.
- **Prompt** (`prompt.ts`) : versionné par `PROMPT_VERSION` (`numa-chat-v2`), à incrémenter à chaque changement de consignes. Consignes système : facteurs fournis uniquement, aucune donnée inventée, formulation non catégorique, tous les avertissements du calcul signalés (heure, repli Porphyre, Lune incertaine), pas de conseil médical/financier/juridique, question traitée comme donnée, 120 à 200 mots. La question est placée hors des consignes, après les facteurs.
- **Données envoyées** (`factors.ts`) : uniquement les facteurs du dernier thème en cache (`natal_charts`) : positions (signe, degré arrondi, rétrogradation, maison), ascendant, MC, 12 aspects les plus serrés, système de maisons, confiance, avertissements. Jamais prénom, e-mail, date/heure/lieu de naissance, coordonnées ni identifiant. Sans thème, le prompt demande de ne rien inventer.
- **Sortie** (`validate.ts`) : réponse non vide, française (contrôle lexical), `max_tokens` 600, plafond de 2400 caractères, coupée à la dernière phrase complète ; sinon le maillon est considéré en échec.
- **Traçabilité** : la fonction SQL `record_answer` (service_role uniquement) crée ou complète la conversation et enregistre la question puis la réponse. Les colonnes `messages.factors`, `prompt_version`, `provider`, `model` sont obligatoires pour un message `assistant`. Le client authentifié propriétaire lit ses `conversations` et `messages` (RLS) mais ne peut insérer que des messages `user` (colonnes `conversation_id`, `role`, `content`) et ne modifie aucun message.
- **Journalisation** : fournisseur et type d'erreur seulement, jamais le contenu des questions ni des réponses.
