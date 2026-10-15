# Architecture

## Stack

- **React** : composants fonctionnels, TypeScript strict (pas de `any`).
- **TypeScript** : typage strict activé sur tout le code applicatif.
- **Tailwind CSS** : styling utilitaire, pas de CSS custom sauf nécessité justifiée.
- **Supabase** : Auth, base PostgreSQL, RLS. Voir `supabase.md`.
- **OVH** : hébergement/déploiement de l'application.
- **n8n** : non utilisé pour l'instant (voir `decision-log.md`, issue #44). Hors chemin critique par principe — jamais pour Auth, chat ou calcul astrologique. À installer en Docker sur OVH seulement si un besoin asynchrone concret apparaît.

## Code serveur

L'application est un site statique (build Vite servi par Caddy) : tout code exécuté dans le navigateur est public.

- Les appels aux API astrologique et IA, et toute vérification qui ne doit pas être contournable (quota de questions anonymes, rate limiting), se font côté serveur.
- **L'emplacement du code serveur n'est pas encore décidé** (piste privilégiée : Supabase Edge Functions dans `supabase/functions/`). Aucun ticket nécessitant une clé secrète ne doit être commencé avant que cette décision soit consignée dans `decision-log.md`.

## Principes

- Pas d'abstraction anticipée : construire pour le besoin actuel, pas pour un besoin hypothétique.
- Composants et hooks typés explicitement (props, retours de hooks).
- Logique métier séparée de la présentation quand elle dépasse quelques lignes.

## Astrologie / IA

Voir `ai-astrology.md` pour l'intégration de l'API astrologique et des appels IA.
