# Architecture

## Stack

- **React** : composants fonctionnels, TypeScript strict (pas de `any`).
- **TypeScript** : typage strict activé sur tout le code applicatif.
- **Tailwind CSS** : styling utilitaire, pas de CSS custom sauf nécessité justifiée.
- **i18n** : `i18next` + `react-i18next`, ressources embarquées dans `src/i18n/`. Voir `development.md` (section Internationalisation).
- **Supabase** : Auth, base PostgreSQL, RLS. Voir `supabase.md`.
- **OVH** : hébergement/déploiement de l'application.
- **n8n** : non utilisé pour l'instant (voir `decision-log.md`, issue #44). Hors chemin critique par principe — jamais pour Auth, chat ou calcul astrologique. À installer en Docker sur OVH seulement si un besoin asynchrone concret apparaît.

## Code serveur

L'application est un site statique (build Vite servi par Caddy) : tout code exécuté dans le navigateur est public.

- Les appels aux API astrologique et IA, et toute vérification qui ne doit pas être contournable (quota de questions anonymes, rate limiting), se font côté serveur.
- Le code serveur est écrit en **Supabase Edge Functions** (Deno) dans `supabase/functions/` (décision du 2026-10-15, `decision-log.md`).

```
supabase/functions/
  deno.json            # tâches check / test, config fmt et lint
  _shared/             # modules communs, préfixe `_` : jamais déployés comme fonction
    auth.ts            # authenticate() : appelant (userId, isAnonymous) depuis le JWT
    cors.ts            # en-têtes CORS limités à ALLOWED_ORIGINS
    handler.ts         # createHandler() : préflight, méthode, auth, erreurs, CORS
    http.ts            # json(), HttpError, errorResponse()
    supabase.ts        # client Supabase côté fonction, vérification du JWT
  chat/                # question au chat + quota anonyme (#27), fournisseur injectable
  geocode/             # recherche de lieux de naissance (Open-Meteo), cf. ci-dessous
  whoami/              # vérification de bout en bout (auth, CORS, déploiement)
  <fonction>/index.ts  # Deno.serve(createHandler({ … }))
```

- Toute nouvelle fonction passe par `createHandler` (authentification obligatoire) et lève des `HttpError` pour les erreurs attendues.
- Elle est déclarée dans `supabase/config.toml` (`[functions.<nom>]`, `verify_jwt = true` sauf webhook signé).
- La logique métier est découpée en fonctions pures testées avec `deno test` (`*_test.ts` à côté du fichier).
- Côté client : `supabase.functions.invoke("<nom>", { body })`, qui envoie le JWT de la session courante.
- Limites : 2 s de CPU par requête, 150 s de durée totale (plan Free), 256 Mo de mémoire.

## Lieu de naissance (issue #19)

- Edge Function `geocode` : `POST { query, limit? }` (2 à 100 caractères, 1 à 10 résultats, 8 par défaut) → `{ places: [{ id, name, region, country, countryCode, label, latitude, longitude, timezone }] }`. Liste vide si aucun résultat. Erreurs : `invalid_body`, `invalid_query`, `invalid_limit` (400), `provider_unavailable` (502), `provider_timeout` (504). Aucun secret requis.
- Client : `searchPlaces(query, { signal, limit })` dans `src/features/onboarding/placeSearch/placeSearch.ts` (type `SearchPlaces`, injectable dans l'écran) ; ne lève jamais, renvoie `{ places, error }` avec un code typé (`PlaceSearchErrorCode`).
- Décalage UTC à la naissance : `resolveUtcOffset({ date, time }, timezone, longitude)` dans `shared/time/utcOffset/utcOffset.ts` (partagé avec l'Edge Function `natal-chart` ; longitude facultative : avant l'heure légale, heure locale moyenne du lieu, statut `localMeanTime`), `formatUtcOffset()` pour l'affichage. Choix du fournisseur et limites : `decision-log.md`.

## Code partagé client / Edge Functions

Le dossier racine `shared/` est du TypeScript pur importé par Vite et par Deno (imports relatifs en `.ts`) : `zodiac/` (signes, positions écliptiques), `time/` (décalage UTC, heure légale moyenne), `contracts/` (types et constantes des réponses des Edge Functions, ex. `contracts/natalChart/natalChart.ts`) et `database.types.ts`. Une logique partagée n'a qu'une implémentation : `src/` ne contient aucune copie du code de `supabase/functions/`. Convention de dossiers : `development.md` (Organisation du code).

## Routage (issue #148)

- React Router (data router) : `main.tsx` crée `createBrowserRouter(routes)` et rend `RouterProvider` ; `src/App.tsx` ne déclare que le tableau `routes`.
- Routes : `/` (accueil), `/inscription`, `/connexion`, `/auth/callback` (retour du lien magique et des erreurs d'auth), `/onboarding`, onglets `/aujourdhui`, `/consulter`, `/mon-theme`, `/profil`. Les chemins vivent dans `src/shared/navigation/routes/routes.ts`.
- `AppRoot` porte l'état de session partagé (`useAuth`, `useOnboardingStatus`) via `useAppContext`. Gardes en routes de mise en page : `RequireSession` (sans session, redirection vers `/`) puis `RequireOnboarding` (onboarding non terminé, redirection vers `/onboarding`).
- L'URL `redirectTo` des liens magiques et OAuth est `<origin>/auth/callback` : elle doit figurer dans `additional_redirect_urls` de Supabase (local et production).
- Caddy : `try_files {path} /index.html` sert déjà les routes profondes (rafraîchissement et liens directs).

## Principes

- Pas d'abstraction anticipée : construire pour le besoin actuel, pas pour un besoin hypothétique.
- Composants et hooks typés explicitement (props, retours de hooks).
- Logique métier séparée de la présentation quand elle dépasse quelques lignes.

## Astrologie / IA

Voir `ai-astrology.md` pour l'intégration de l'API astrologique et des appels IA.
