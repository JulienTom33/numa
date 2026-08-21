# Architecture

## Stack

- **React** : composants fonctionnels, TypeScript strict (pas de `any`).
- **TypeScript** : typage strict activé sur tout le code applicatif.
- **Tailwind CSS** : styling utilitaire, pas de CSS custom sauf nécessité justifiée.
- **Supabase** : Auth, base PostgreSQL, RLS. Voir `supabase.md`.
- **OVH** : hébergement/déploiement de l'application.
- **n8n** : automatisations/orchestration hors application principale (workflows, intégrations).

## Principes

- Pas d'abstraction anticipée : construire pour le besoin actuel, pas pour un besoin hypothétique.
- Composants et hooks typés explicitement (props, retours de hooks).
- Logique métier séparée de la présentation quand elle dépasse quelques lignes.

## Astrologie / IA

Voir `ai-astrology.md` pour l'intégration de l'API astrologique et des appels IA.
