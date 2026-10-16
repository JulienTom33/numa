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

## Ascendant, MC et maisons

Module serveur `supabase/functions/_shared/astrology/` (Deno, fonctions pures), sur Astronomy Engine (`npm:astronomy-engine@2.1.19`, MIT). Issue #126, entrée du 2026-10-16 dans `decision-log.md`.

- `computeAngles({ instant, latitude, longitude })` : temps sidéral local (RAMC, degrés), obliquité vraie, ascendant et MC en longitude écliptique tropicale. `instant` est un instant **UTC déjà résolu** (fuseau, heure d'été, temps moyen local : hors module).
- `computeHouses(location, system?)` : ascendant, MC et 12 cuspides (`longitude`, `sign`, `degreeInSign`), système demandé, système effectivement utilisé et repli éventuel.
- Systèmes disponibles : `placidus`, `porphyry` (Porphyre), `equal` (égales depuis l'ascendant), `whole-sign` (signes entiers).
- **Défaut proposé : Placidus** (à valider par le mainteneur).
- **Repli proposé : Porphyre** (à valider) quand Placidus est indéfini, au-delà des cercles polaires (|latitude| ≥ 90° − obliquité, environ 66,56°), ou ne converge pas. Le résultat l'indique : `system: "porphyry"`, `fallback: { from: "placidus", reason: "polar-latitude" | "placidus-not-converged" }`. À signaler à l'utilisateur dans la lecture (transparence).
- Latitude ±90° exacte, longitude hors [−180, 180] ou date invalide : `RangeError`.
- Précision mesurée : ≤ 0,12″ par rapport à Swiss Ephemeris 2.10.03 (référence calculée hors dépôt) sur les profils P1–P5 et les cas limites ; références et sources dans `houses_test.ts`.
