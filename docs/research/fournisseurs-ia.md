# Fournisseurs IA : quotas, coûts et stratégie (#51)

Recherche préalable à #26 (intégration du fournisseur IA et du prompt Numa). Consultation des sources le **2026-10-17**. Tarifs et limites changent souvent : toute valeur est à revérifier avant la mise en production. « Non vérifié » = information introuvable ou non confirmée par une source officielle.

## Résultats clés

1. **L'offre gratuite de l'API Gemini est inutilisable pour Numa** : les conditions imposent les services payants dès que l'application est accessible à des utilisateurs de l'EEE, du Royaume-Uni ou de Suisse, et interdisent les applications susceptibles d'être utilisées par des moins de 18 ans. En offre gratuite, Google utilise les contenus pour améliorer ses produits, avec relecture humaine possible (https://ai.google.dev/gemini-api/terms).
2. Le « gratuit soutenable » du ticket devient donc « quasi gratuit » : Gemini Flash-Lite payant coûte environ 0,0016 $ par question (voir « Coûts estimés »), soit moins de 2 $ pour 1 000 questions.
3. Le fallback n'a **pas pu être testé en conditions réelles** (aucune clé API disponible pour cette recherche). Un protocole reproductible est fourni plus bas ; le critère « fallback testé » de #51 reste à valider par le mainteneur.

## Tableau comparatif

| Critère | Gemini (Flash-Lite / Flash) | Groq (modèles ouverts) | Claude Haiku (référence payante) |
|---|---|---|---|
| Modèles | `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.6-flash` (stables) | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `llama-3.3-70b-versatile` (production) ; `qwen/qwen3.8-27b` (preview, à éviter) | Claude Haiku 5.5 |
| Offre gratuite | Oui, mais interdite pour l'EEE/UK/CH et les apps ouvertes aux mineurs | Oui (plan Free). Limites du plan Free : non vérifié | Non |
| Limites (RPM / TPM / RPD) | Gratuit : non publiées dans la doc (renvoi vers https://aistudio.google.com/rate-limit). Non vérifié | Plan Developer, par modèle : gpt-oss-120b 30 RPM, 1 000 RPD, 8 000 TPM, 200 000 TPD. Plan Free : non vérifié | Palier Start : 1 000 RPM, 2 M tokens d'entrée/min, 400 000 tokens de sortie/min |
| Portée des limites | Par projet ; RPD réinitialisé à minuit heure du Pacifique | Par organisation ; tokens en cache non comptés | Par organisation, algorithme du seau à jetons |
| Prix (par M tokens, entrée / sortie) | Flash-Lite 3.1 : 0,25 $ / 1,50 $ ; Flash-Lite 3.5 : 0,30 $ / 2,50 $ ; Flash 3.6 : 0,75 $ / 3,75 $ jusqu'au 31/12/2026 puis 1,50 $ / 7,50 $ | Non vérifié (page tarifs sans chiffres exploitables) | Haiku 5.5 : 0,10 $ / 0,50 $ (prompts jusqu'à 100 000 tokens) ; Haiku 4.5 : 1 $ / 5 $ |
| Contexte | Non vérifié (non listé sur les pages consultées) | 131 072 tokens ; sortie max 65 536 (gpt-oss) | Non vérifié |
| Vitesse / latence | Non mesurée | Annoncée : gpt-oss-120b 500 tokens/s, gpt-oss-20b 1 000 tokens/s (non mesurée) | Non mesurée |
| Français | Non évalué (aucun test possible ; voir protocole) | Non évalué ; modèles ouverts, à tester | Non évalué |
| Données / entraînement | Gratuit : utilisées pour améliorer les produits, relecture humaine possible. Payant : non | Pas de rétention des entrées/sorties par défaut ; journaux de fiabilité/abus jusqu'à 30 jours ; ZDR activable dans les paramètres. Entraînement : non confirmé par la page officielle consultée. Stockage aux États-Unis (Google Cloud), clauses contractuelles types | Non vérifié dans cette recherche |
| Erreur 429 | Erreur de limite sans détail documenté pour RPM/TPM/RPD ; `429 RESOURCE_EXHAUSTED` documenté pour les limites de dépense (payant). En-têtes : non vérifié | `429 Too Many Requests` ; `retry-after` (secondes) uniquement sur 429 ; `x-ratelimit-limit/remaining/reset-requests` (RPD) et `-tokens` (TPM) sur chaque réponse | `429` `rate_limit_error` ; `retry-after` quand présent, absent pour le plafond de dépense mensuel (`enforced_spend_limit_reached`, inutile de réessayer) ; en-têtes `anthropic-ratelimit-*` |

Sources : https://ai.google.dev/gemini-api/docs/rate-limits, https://ai.google.dev/gemini-api/docs/pricing, https://ai.google.dev/gemini-api/docs/models, https://ai.google.dev/gemini-api/terms, https://console.groq.com/docs/rate-limits, https://console.groq.com/docs/models, https://console.groq.com/docs/your-data, https://platform.claude.com/docs/en/api/rate-limits, https://platform.claude.com/docs/en/docs/about-claude/pricing.

Mistral La Plateforme : la page officielle des paliers renvoie 404 et ses limites ne sont publiées que par des sites tiers (ex. 1 requête/s, 500 000 tokens/min, 1 milliard de tokens/mois, plan gratuit conditionné à l'acceptation d'un usage des données pour l'entraînement) : **non vérifié, non retenu**.

## Coûts estimés

Hypothèse : 4 000 tokens d'entrée (consignes + thème + historique court) et 400 tokens de sortie par question.

| Modèle | Coût par question | Pour 1 000 questions |
|---|---|---|
| Gemini 3.1 Flash-Lite | 4 000 x 0,25 / 1 M + 400 x 1,50 / 1 M = 0,0016 $ | 1,60 $ |
| Gemini 3.6 Flash (après le 01/01/2027) | 4 000 x 1,50 / 1 M + 400 x 7,50 / 1 M = 0,009 $ | 9 $ |
| Claude Haiku 5.5 | 4 000 x 0,10 / 1 M + 400 x 0,50 / 1 M = 0,0006 $ | 0,60 $ |

Le quota anonyme de 2 questions par session (#27) borne le coût des visiteurs anonymes. Les comptes identifiés ne sont pas encore limités : un rate limiting par utilisateur est à définir avec #26.

## Recommandation

- **Principal : Gemini 3.1 Flash-Lite, en offre payante (facturation activée)**, avec plafond de dépense côté Google. Justification : seule option dont les conditions de données sont acceptables (payant : pas d'entraînement sur les données), modèle stable, coût négligeable. Ne jamais utiliser le niveau gratuit en production. `gemini-3.6-flash` reste une option si la qualité française de Flash-Lite est insuffisante au test.
- **Fallback : Groq `openai/gpt-oss-120b`** (production, contexte 131 072 tokens, en-têtes 429 explicites), ZDR activé. Limites du plan Free et qualité en français à valider (non vérifiées). Réserve RGPD : stockage aux États-Unis ; n'envoyer que le contexte minimal.
- **Alternative au fallback : Claude Haiku 5.5** (payant, 0,10 $ / 0,50 $ par M tokens selon la page de tarifs consultée), pertinent si les tests montrent un écart de qualité en français ou de ton non catégorique. Prix à revérifier avant décision.

## Longueur de réponse

- `max_output_tokens` : **600** (plafond dur contre les coûts et les dérives).
- Cible demandée dans le prompt : **120 à 200 mots** (environ 250 à 400 tokens en français), 3 courts paragraphes au plus, avec les points astrologiques utilisés cités.
- Si la réponse est coupée par la limite, tronquer à la dernière phrase complète côté serveur ; la réponse est livrée, la question est décomptée.

## Stratégie de dépassement de quota

Principe, cohérent avec #27 : **une erreur fournisseur ne décompte jamais la question** (`release_question`). Seule une réponse livrée déclenche `commit_question`.

1. Appel au principal avec timeout. Sur `429`, `5xx` ou timeout : une nouvelle tentative seulement si `retry-after` est présent et inférieur à 2 s ; sinon bascule immédiate.
2. Bascule sur le fallback, même contexte et mêmes consignes. Journaliser (sans contenu) le fournisseur utilisé et le code d'erreur.
3. Échec du fallback : `release_question`, puis réponse `503` avec un code stable (`ai_unavailable`) que le front traduit en message poli (clé i18n, aucun texte en dur côté serveur), du type « Numa est très sollicité, réessaie dans quelques minutes. Ta question n'a pas été comptée. »
4. Plafond de dépense atteint (429 sans `retry-after`) : ne pas réessayer ; disjoncteur en mémoire de quelques minutes pour éviter les appels voués à l'échec, et alerte au mainteneur (Discord).
5. Pas de file d'attente côté serveur au MVP : la durée d'une Edge Function est limitée et les réservations expirent à 5 minutes (#27). Un refus poli vaut mieux qu'une attente.
6. Rate limiting par utilisateur identifié (minute et jour) : à décider avec #26.

## Contraintes pour #26

- **Données minimales** : jamais le prénom, l'e-mail, les coordonnées exactes de naissance, ni l'identifiant utilisateur. Envoyer uniquement le thème calculé (signes, degrés, maisons, aspects, avertissements d'heure) et la question.
- **Prompt versionné** : identifiant de version du prompt et modèle stockés avec chaque réponse ; prompt dans le dépôt (pas de « prompt magique » caché), règles éditoriales de `ai-astrology.md` incluses.
- **Fournisseur injectable** : les deux fournisseurs derrière l'interface `QuestionProvider` (#27), avec un fournisseur composite principal puis fallback.
- **Timeouts** : 15 s sur le principal, 10 s sur le fallback (valeurs de départ à ajuster d'après les mesures du protocole) ; total sous la limite de l'Edge Function et sous l'expiration de 5 min des réservations.
- **Secrets** : clés dans les secrets Supabase, jamais en `VITE_*`.
- **Sortie** : valider la réponse (non vide, longueur plafonnée, en français) avant `commit_question`.
- **Entrée utilisateur** : donnée non fiable, placée hors des consignes système, longueur limitée (par exemple 500 caractères).

## Protocole de test du fallback (à exécuter par le mainteneur)

Non exécuté pour #51 faute de clé API. Script de référence **non versionné** (poste du mainteneur, clés en variables d'environnement, jamais commitées), à écrire selon ces étapes :

1. Charger un thème de référence (profils P1 à P5 de `docs/research/api-astrologiques.md`) au format `chart` de `natal-chart`.
2. Pour chaque fournisseur et chaque question : envoyer consignes système + thème + question avec 600 tokens maximum, 3 répétitions ; mesurer la latence totale, les tokens consommés et les en-têtes de limites.
3. Provoquer un `429` (rafale de requêtes parallèles) et relever statut, `retry-after` et en-têtes pour confirmer le comportement documenté.
4. Noter chaque réponse selon les critères.

Jeu de 5 questions :

1. « Que dit mon Soleil sur ma manière d'aborder les choses ? »
2. « Comment mon ascendant influence-t-il la première impression que je donne ? »
3. « Que signifie ma Lune en maison 4 pour ma vie de famille ? »
4. « Quels sont les aspects les plus marquants de mon thème ? »
5. « Vais-je changer de travail cette année ? » (doit rester non catégorique)

| Critère | Seuil d'acceptation |
|---|---|
| Exactitude des données du thème | Aucune donnée inventée ou contredisant le thème fourni |
| Ton non catégorique | Tendances et possibilités, aucune affirmation absolue |
| Longueur | 120 à 200 mots visés, jamais plus de 300 ; pas de coupure en milieu de phrase |
| Latence | Médiane sous 5 s, maximum sous 10 s (valeurs de départ) |
| Français | Correct et clair, jargon expliqué |

Le fallback est accepté si aucune réponse n'échoue sur l'exactitude ou le ton non catégorique et si la médiane de latence respecte le seuil.

## Risques

- **RGPD** : le thème dérive de données de naissance (données personnelles). Gemini payant : conditions des services payants ; Groq : stockage aux États-Unis, clauses contractuelles types. Mettre à jour la politique de confidentialité avec les sous-traitants, signer les accords de traitement (DPA), appliquer la minimisation.
- **Conditions d'usage gratuit** : offre gratuite Gemini exclue (EEE, mineurs, entraînement). Conditions de l'offre gratuite Groq pour un usage commercial : non vérifiées.
- **Dépendance** : modèles, tarifs et limites changent (un aperçu Gemini 3.1 est déjà arrêté ; Flash 3.6 double de prix au 01/01/2027). Épingler des modèles stables, surveiller les dépréciations, garder `QuestionProvider`.
- **Qualité éditoriale** : non évaluée faute de test ; risque d'affirmations catégoriques.
- **Coût** : comptes identifiés non limités ; plafond de dépense et rate limiting à définir.

## Décisions à prendre par le mainteneur

1. Valider Gemini 3.1 Flash-Lite payant comme principal (compte de facturation, coût faible mais non nul).
2. Choisir le fallback (Groq `gpt-oss-120b` ou Claude Haiku 5.5) après exécution du protocole.
3. Valider longueur (600 tokens max, 120 à 200 mots), timeouts et message de dépassement.
4. Définir le rate limiting des comptes identifiés.
