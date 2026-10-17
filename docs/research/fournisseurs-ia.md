# Fournisseurs IA : quotas, coûts et stratégie (#51)

Recherche préalable à #26 (intégration du fournisseur IA et du prompt Numa). Sources consultées le **2026-10-17**. Tarifs et limites changent souvent : toute valeur est à revérifier avant la mise en production. « Non vérifié » = introuvable ou non confirmé par une source officielle. Ce document n'est pas un avis juridique.

## Décision du mainteneur : gratuit uniquement

Retour sur la PR #144 : les fournisseurs IA doivent être gratuits (API et modèles gratuits), **aucun coût**, avec un mix possible entre Gemini, ChatGPT/OpenAI et Mistral. Le payant (Gemini Flash-Lite payant, Claude Haiku) est donc **écarté** ; il reste décrit en fin de document comme alternative écartée.

### Résumé

1. **Mix recommandé : Mistral (principal, offre gratuite, entreprise européenne) puis Groq `openai/gpt-oss-120b` (secours 1, plan gratuit), puis réponse dégradée sans IA (secours 2).** Aucun appel payant.
2. **Aucun mix gratuit n'est pleinement sain juridiquement pour un public européen.** Les offres gratuites reposent sur des clauses de réutilisation des données (Mistral en mode gratuit de Studio, Gemini gratuit) ou sur un hébergement hors UE (Groq). Les mesures d'atténuation ci-dessous réduisent fortement l'exposition mais ne la suppriment pas. L'option la plus sûre à coût nul est de n'envoyer **aucune donnée personnelle** (prompt réduit aux seuls facteurs astrologiques) et d'avertir l'utilisateur de ne pas saisir de données personnelles dans sa question.
3. **Gemini gratuit est à écarter** pour un public EEE/UK/CH : ses conditions l'interdisent expressément.
4. **OpenAI/ChatGPT est à écarter** : pas d'offre API gratuite officielle ; seul un programme de partage de données (prompts et réponses envoyés à OpenAI contre des jetons gratuits) existe, incompatible avec des données de naissance.
5. Le budget gratuit **tient** pour une bêta privée de 100 testeurs **si** les limites réelles du compte Mistral correspondent aux chiffres tiers (non vérifiés, à lire dans la console). Sans Mistral, Groq seul ne tient pas (voir « Budget »).
6. Le fallback n'a **pas pu être testé en conditions réelles** (aucune clé API). Un protocole est fourni ; le critère « fallback testé » de #51 reste à valider par le mainteneur.

## Classement des fournisseurs (public européen)

| Fournisseur | Classement | Raison |
|---|---|---|
| Mistral (Experiment / Free) | **Utilisable avec mesures** | Société française. Documentation API : données API non utilisées pour l'entraînement, ZDR sur demande ; aide en ligne : en mode Free de Studio, entrées et sorties peuvent servir à entraîner (désinscription possible). Les deux sources divergent : à lever avec le support avant la prod. Hébergement UE : non vérifié sur les pages consultées. |
| Groq (plan Free) | **Utilisable avec mesures** | Pas de rétention des entrées/sorties par défaut, journaux jusqu'à 30 jours, ZDR activable ; stockage aux États-Unis (clauses contractuelles types). Entraînement : non confirmé. Conditions du plan Free pour un usage commercial : non vérifiées. Données strictement minimales. |
| OpenRouter (modèles `:free`) | **À écarter** (ou secours d'urgence sans donnée personnelle) | 50 requêtes/jour sans crédits achetés (1 000 avec 10 crédits, donc payant). Le routage vers des fournisseurs tiers dont les politiques de données ne sont pas maîtrisées : non vérifié. |
| Gemini (offre gratuite) | **À écarter pour un public EEE** | Conditions : services payants obligatoires pour les utilisateurs EEE/UK/CH et interdiction d'apps susceptibles d'être utilisées par des moins de 18 ans ; contenus utilisés pour améliorer les produits, relecture humaine possible. |
| OpenAI / ChatGPT | **À écarter** | Pas d'offre API gratuite officielle trouvée. Programme de jetons gratuits quotidiens contre le partage des entrées/sorties avec OpenAI (éligibilité par compte, préavis de 30 jours avant arrêt). Incompatible avec des données personnelles et dépendant du compte. |

## Quotas et conditions par fournisseur

| Critère | Mistral | Groq | Gemini (gratuit) | OpenRouter `:free` | OpenAI |
|---|---|---|---|---|---|
| Limites gratuites | Par modèle : requêtes/s, tokens/min, tokens/mois ; valeurs visibles seulement dans la console (Admin, API, Limits). Chiffres tiers non vérifiés : environ 1 requête/s, 500 000 tokens/min, 1 milliard de tokens/mois | Plan Free : non vérifié. Plan Developer (base) pour gpt-oss-120b : 30 RPM, 1 000 RPD, 8 000 TPM, 200 000 TPD ; le Free ne peut pas être supposé supérieur | Non publiées dans la doc (renvoi vers AI Studio). Non vérifié | 20 requêtes/min ; 50 requêtes/jour (moins de 10 crédits achetés) | Programme de partage de données : quota quotidien de jetons selon palier, détails variables selon les versions de la page : non vérifié |
| Contexte | Non vérifié | 131 072 tokens (gpt-oss-120b) | Non vérifié | Variable selon le modèle | Non applicable |
| Français | Mistral : modèles d'origine française (qualité à tester) | À tester | À tester | À tester | Non applicable |
| Erreur 429 | Page des limites sans détail sur 429 ni en-têtes : non vérifié | `429` ; `retry-after` (secondes) uniquement sur 429 ; `x-ratelimit-*-requests` (RPD) et `-tokens` (TPM) sur chaque réponse | Erreur de limite, détail non documenté pour RPM/TPM/RPD | `429` `rate_limit_exceeded` ; `X-RateLimit-*` ; `Retry-After` parfois ; en flux, erreur SSE avec `finish_reason: "error"` | Non applicable |
| Latence | Non mesurée | Annoncée très rapide (gpt-oss-120b : 500 tokens/s) ; non mesurée | Non mesurée | Non mesurée | Non applicable |

Sources : https://help.mistral.ai/en/articles/698531-why-am-i-hitting-api-rate-limits-and-how-do-i-increase-them, https://docs.mistral.ai/admin/billing-usage/usage-limits, https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models, https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key, https://console.groq.com/docs/rate-limits, https://console.groq.com/docs/models, https://console.groq.com/docs/your-data, https://ai.google.dev/gemini-api/terms, https://ai.google.dev/gemini-api/docs/rate-limits, https://openrouter.ai/docs/api-reference/limits, https://help.openai.com/en/articles/10306912-sharing-feedback-evaluation-and-fine-tuning-data-and-api-inputs-and-outputs. La page https://help.openai.com/... n'a pas pu être lue directement (403) : le résumé du programme OpenAI provient d'un résultat de recherche. Les chiffres Mistral « tiers » viennent d'agrégateurs non officiels (ex. https://mintlify.com/cheahjs/free-llm-api-resources/providers/free/mistral-plateforme).

## Mix recommandé et bascule

Chaîne : **Mistral (principal)**, **Groq `openai/gpt-oss-120b` (secours 1)**, **réponse dégradée (secours 2)**.

- Sur `429`, `5xx` ou timeout du principal : une seule nouvelle tentative si `retry-after` est présent et inférieur à 2 s, sinon bascule immédiate sur le secours suivant. Pas de répartition de charge au MVP (elle consommerait inutilement le quota du secours) ; la bascule intervient seulement sur erreur.
- Un compteur de quota maison (jour courant, par fournisseur) est une amélioration optionnelle : avant d'atteindre la limite connue, passer directement au suivant. Les valeurs de limites viennent de la configuration, pas du code.
- Secours 2 (sans IA) : message i18n expliquant que Numa est très sollicité et invitant à réessayer, avec rappel que la question n'est pas comptée. Un résumé statique du thème (déjà affiché ailleurs) reste disponible.
- Chaque erreur fournisseur ou bascule libère la réservation (`release_question`) : la question n'est jamais décomptée si aucune réponse n'est livrée (cohérent avec #27). Une réponse livrée par n'importe quel maillon de la chaîne déclenche `commit_question`.
- Disjoncteur en mémoire de quelques minutes après un `429` sans `retry-after` ou une indisponibilité répétée, pour éviter les appels voués à l'échec.
- Aucun texte de réponse d'erreur en dur côté serveur : code stable (`ai_unavailable`), le front traduit via `t()`.
- Rate limiting par utilisateur identifié (minute et jour) : à définir avec #26, il protège le quota gratuit partagé.

## Budget de quota gratuit contre une bêta privée

Hypothèses (à ajuster) : bêta de **100 testeurs**, 2 questions anonymes chacun (quota #27) + 3 questions de compte par testeur et par jour = **500 questions/jour** au pic. Prompt réduit : environ 2 500 tokens en entrée (consignes + facteurs astrologiques + question) et 400 en sortie, soit **2 900 tokens/question**, **1,45 million de tokens/jour**, environ 45 millions de tokens/mois, 500 requêtes/jour.

| Source | Capacité gratuite | Questions/jour couvertes | Verdict |
|---|---|---|---|
| Mistral (chiffres tiers, non vérifiés) | 1 milliard de tokens/mois, 500 000 tokens/min, 1 requête/s | Environ 11 000 (limite mensuelle) ; 1 requête/s tient largement pour 500 requêtes/jour en pointes modérées | Tient très largement **si** ces chiffres sont exacts |
| Groq gpt-oss-120b (plan Developer, borne de référence ; Free non vérifié) | 200 000 tokens/jour, 1 000 requêtes/jour | Environ 69 questions/jour (limite en tokens) | Insuffisant seul ; sert de secours pour absorber des pannes ou des pics |
| OpenRouter `:free` | 50 requêtes/jour | 50 | Marginal, écarté |
| Gemini gratuit | Non vérifié | Non applicable | Écarté (conditions) |

Lecture : le gratuit tient pour 100 testeurs **uniquement grâce à Mistral**. Il cesse de tenir (1) si les limites réelles du compte Mistral sont très inférieures aux chiffres tiers, à vérifier dans la console avant de s'engager, (2) si le secours Groq doit porter plus d'environ 70 questions/jour, ce qui arrive si Mistral est indisponible plus de quelques heures, (3) au-delà d'environ 10 000 questions/jour sur Mistral (environ 2 000 testeurs actifs avec 5 questions/jour), en supposant les chiffres tiers corrects. Au-delà, l'application devra soit passer sur un plan payant (décision écartée à ce stade), soit réduire le quota par utilisateur.

## Verrous juridiques et mesures d'atténuation

Verrous constatés :

- Gemini gratuit : interdit pour les utilisateurs EEE/UK/CH et les apps ouvertes aux mineurs ; contenus utilisés pour améliorer les produits, relecture humaine possible. Non contournable par des mesures : écarté.
- Mistral gratuit : l'aide en ligne indique que, en mode Free de Studio, les entrées et sorties peuvent servir à l'entraînement (désinscription possible) ; la documentation API indique l'inverse. Lequel s'applique à une clé de l'offre Experiment : non vérifié.
- Groq : stockage aux États-Unis ; entraînement non confirmé ; usage commercial du plan Free non vérifié.
- Les données de naissance sont des données personnelles ; une combinaison date, heure et lieu est quasi identifiante.

Mesures (à implémenter dans #26 et documenter dans la politique de confidentialité #45) :

1. **Prompt réduit aux seuls facteurs astrologiques** : signes, degrés, maisons, aspects, avertissements d'heure. Jamais prénom, e-mail, date, heure ou lieu de naissance, coordonnées, identifiant utilisateur. Le thème seul, sans les données qui l'ont produit, n'identifie pas la personne.
2. **Question utilisateur filtrée et avertie** : message affiché près du champ « ne saisissez pas de données personnelles (nom, date ou lieu de naissance, santé…) » (clé i18n) ; longueur limitée (500 caractères) ; détection simple de motifs évidents (e-mail, téléphone, date de naissance) avec refus poli ; question placée hors des consignes système.
3. **Fournisseur européen en premier** : Mistral comme principal ; l'hébergement exact des appels API de l'offre gratuite est à confirmer (non vérifié ici).
4. **ZDR / désinscription** : demander la rétention nulle et la désinscription de l'entraînement chez Mistral ; activer ZDR chez Groq.
5. **Transparence** : mentionner dans la politique de confidentialité (#45) les sous-traitants (Mistral, Groq), les transferts hors UE (Groq, clauses contractuelles types), le contenu envoyé et sa finalité ; indiquer à l'utilisateur, dans l'interface, que la réponse est générée par un fournisseur IA externe.
6. **Public** : conserver l'exigence de majorité si la politique du fournisseur l'impose (non vérifiée pour Mistral et Groq).
7. **Pas de journalisation du contenu** des questions et réponses au-delà du besoin produit ; journaliser seulement fournisseur, code d'erreur, latence.

Risques restants après mesures : une question libre peut contenir des données personnelles malgré l'avertissement ; la base légale et les clauses de réutilisation en offre gratuite ne sont pas négociables ; le caractère « gratuit » n'offre aucune garantie de service ni de stabilité des conditions. Si le mainteneur juge ce risque inacceptable pour un public européen, l'option la plus sûre est un plan payant avec conditions de données entreprise (écarté pour l'instant) ; l'option gratuite la plus sûre est celle décrite ici, avec Mistral seul en IA et réponse dégradée plutôt qu'un secours hors UE (supprimer Groq de la chaîne).

## Longueur de réponse

- `max_output_tokens` : **600** (plafond dur).
- Cible demandée dans le prompt : **120 à 200 mots** (environ 250 à 400 tokens), 3 courts paragraphes au plus, avec les points astrologiques utilisés cités. Une cible courte économise aussi le quota gratuit.
- Si la réponse est coupée par la limite, tronquer à la dernière phrase complète côté serveur.

## Contraintes pour #26

- **Fournisseur injectable** : les deux fournisseurs derrière l'interface `QuestionProvider` (#27), avec un fournisseur composite (chaîne ordonnée, configuration par fournisseur : modèle, timeout, activé ou non).
- **Prompt versionné** : version du prompt et fournisseur/modèle stockés avec chaque réponse ; prompt dans le dépôt.
- **Timeouts** : 15 s sur le principal, 10 s sur le secours 1 (valeurs de départ à ajuster d'après le protocole) ; total sous la limite de l'Edge Function et sous l'expiration de 5 min des réservations (#27).
- **Secrets** : clés dans les secrets Supabase, jamais en `VITE_*`.
- **Sortie** : valider (non vide, longueur plafonnée, en français) avant `commit_question`.
- **Entrée** : appliquer les mesures 1 et 2 ci-dessus.

## Protocole de test (à exécuter par le mainteneur avec des clés)

Non exécuté pour #51 faute de clé API. Script de référence **non versionné** (poste du mainteneur, clés en variables d'environnement, jamais commitées) :

1. Charger un thème de référence (profils P1 à P5 de `docs/research/api-astrologiques.md`) et n'en extraire que les facteurs astrologiques (prompt réduit).
2. Pour **Mistral puis Groq** (chaque maillon du mix) et chaque question : consignes + facteurs + question, 600 tokens maximum, 3 répétitions ; mesurer latence, tokens consommés, en-têtes de limites.
3. Relever **les limites réelles du compte** (console Mistral, Admin, API, Limits ; console Groq) et les comparer au « Budget » ci-dessus.
4. Provoquer un `429` (rafale parallèle) sur chaque fournisseur et relever statut, `retry-after`, en-têtes ; vérifier la bascule en simulant l'échec du principal.
5. Confirmer par le support ou la console la règle d'entraînement applicable à la clé Mistral gratuite et l'hébergement des appels API.

Questions :

1. « Que dit mon Soleil sur ma manière d'aborder les choses ? »
2. « Comment mon ascendant influence-t-il la première impression que je donne ? »
3. « Que signifie ma Lune en maison 4 pour ma vie de famille ? »
4. « Quels sont les aspects les plus marquants de mon thème ? »
5. « Vais-je changer de travail cette année ? » (doit rester non catégorique)

| Critère | Seuil d'acceptation |
|---|---|
| Exactitude des données du thème | Aucune donnée inventée ou contredisant les facteurs fournis |
| Ton non catégorique | Tendances et possibilités, aucune affirmation absolue |
| Longueur | 120 à 200 mots visés, jamais plus de 300 ; pas de coupure en milieu de phrase |
| Latence | Médiane sous 5 s, maximum sous 10 s (valeurs de départ) |
| Français | Correct et clair, jargon expliqué |

Un maillon est accepté si aucune réponse n'échoue sur l'exactitude ou le ton non catégorique et si la médiane de latence respecte le seuil.

## Alternatives écartées (payant)

Écartées par la décision « gratuit uniquement », conservées pour mémoire (prix consultés le 2026-10-17, à revérifier) :

- Gemini 3.1 Flash-Lite payant : 0,25 $ / 1,50 $ par M tokens, soit environ 0,0016 $ par question (4 000 tokens en entrée, 400 en sortie) ; données non utilisées pour l'entraînement en payant ; seule option qui lève le verrou EEE de Gemini.
- Claude Haiku 5.5 : 0,10 $ / 0,50 $ par M tokens, soit environ 0,0006 $ par question ; limites du palier Start : 1 000 RPM, 2 M tokens d'entrée/min.
- Pour 500 questions/jour, ces options représenteraient moins de 1 $ par jour. À reconsidérer si le gratuit cesse de tenir ou si le risque juridique ci-dessus est jugé inacceptable.

## Décisions à prendre par le mainteneur

1. Valider la chaîne Mistral, Groq, réponse dégradée, ou retirer Groq (hébergement hors UE) pour ne garder que Mistral puis réponse dégradée.
2. Accepter le risque résiduel de l'offre gratuite pour un public européen, ou rouvrir l'option payante.
3. Vérifier dans les consoles les limites réelles gratuites (Mistral, Groq) et exécuter le protocole.
4. Confirmer auprès de Mistral la règle d'entraînement et l'hébergement des appels de l'offre gratuite.
5. Valider longueur (600 tokens max, 120 à 200 mots), timeouts, message de dépassement, et le rate limiting des comptes identifiés.
6. Alimenter la politique de confidentialité (#45) avec les sous-traitants et le message d'avertissement dans le champ de question.
