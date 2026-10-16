# IA & Astrologie

## Calcul astrologique

- Les calculs astrologiques (positions planétaires, thème natal, etc.) sont faits localement, dans une Edge Function (`supabase/functions/`), avec la bibliothèque **Astronomy Engine** (`astronomy-engine`, MIT). Aucune API astrologique externe, aucune clé, aucune donnée de naissance envoyée à un tiers (décision du 2026-10-16, `decision-log.md`, #50).
- Ascendant et MC sont dérivés du temps sidéral et de l'obliquité. Les systèmes de maisons (Placidus, etc.) sont codés à partir de formules publiques et validés sur les profils de référence de `docs/research/api-astrologiques.md`.
- Swiss Ephemeris (AGPL) n'est jamais une dépendance du projet. Il ne sert que de référence de validation dans des tests exécutés hors dépôt.
- Chaque thème enregistre la version du moteur ; l'heure inconnue ou ambiguë est signalée.

## Génération IA

- Les lectures textuelles sont générées à partir d'un contexte structuré (données astrologiques calculées + profil utilisateur), pas d'un prompt libre non contrôlé.
- Le contexte envoyé au modèle est explicite et traçable (pas de "prompt magique" caché).

## Règles éditoriales

- Les lectures sont **compréhensibles** : langage clair, pas de jargon non expliqué.
- Les lectures sont **transparentes** : la base (données astrologiques utilisées) reste accessible/consultable par l'utilisateur.
- Les lectures sont **non catégoriques** : pas d'affirmations absolues sur l'avenir ou la personnalité ; formulation en tendances et possibilités.
- Pas de contenu à caractère médical, financier ou juridique présenté comme un conseil.
