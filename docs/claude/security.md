# Sécurité

## Secrets

- Aucun secret, clé API, clé privée ou token n'est commité dans le dépôt, sous quelque forme que ce soit (fichier `.env` commité, valeur en dur dans le code, fixture de test).
- Les clés sensibles (Supabase service role, API astrologique, IA) restent côté serveur uniquement.
- Avant tout commit, vérifier le contenu des fichiers ajoutés, même si le nom de fichier semble anodin.

## Données personnelles

- Données utilisateur (date/heure/lieu de naissance, lectures générées) protégées par RLS. Voir `supabase.md`.
- Pas de log de données personnelles en clair.
- Pas de transmission de données personnelles à un service tiers non explicitement validé pour cet usage.

## Rate limiting

- Les appels aux API externes coûteuses (astrologie, IA) sont soumis à rate limiting côté serveur pour éviter abus et dérive de coût.

## Logs

- Logs applicatifs sans données personnelles ni secrets.
- Logs d'erreur suffisamment détaillés pour debug (stack, contexte technique) sans contenu utilisateur sensible.
