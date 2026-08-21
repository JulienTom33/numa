# IA & Astrologie

## API astrologique

- Les calculs astrologiques (positions planétaires, thème natal, etc.) passent par une API astrologique dédiée, appelée côté serveur.
- Les clés d'accès à cette API restent côté serveur, jamais exposées au client. Voir `security.md`.

## Génération IA

- Les lectures textuelles sont générées à partir d'un contexte structuré (données astrologiques calculées + profil utilisateur), pas d'un prompt libre non contrôlé.
- Le contexte envoyé au modèle est explicite et traçable (pas de "prompt magique" caché).

## Règles éditoriales

- Les lectures sont **compréhensibles** : langage clair, pas de jargon non expliqué.
- Les lectures sont **transparentes** : la base (données astrologiques utilisées) reste accessible/consultable par l'utilisateur.
- Les lectures sont **non catégoriques** : pas d'affirmations absolues sur l'avenir ou la personnalité ; formulation en tendances et possibilités.
- Pas de contenu à caractère médical, financier ou juridique présenté comme un conseil.
