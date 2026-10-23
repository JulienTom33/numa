# Comparatif des moteurs et API astrologiques (issue #50)

Étude préalable à #20 (calcul du thème natal), #22 (cache des thèmes) et #80 (ascendant). Date de l'étude : 2026-10-16.

Conventions :

- Chaque information externe est suivie de sa source. « Non vérifié » signale ce qui n'a pas pu être confirmé (page inaccessible, information absente, conditions non publiées).
- Les tarifs et quotas sont ceux affichés le jour de l'étude ; ils peuvent changer sans préavis.
- Les tests pratiques ont été exécutés hors dépôt (scratchpad local) ; aucun script ni aucune clé n'est versionné.

## Décision (2026-10-16, mainteneur)

- **Fournisseur retenu : Astronomy Engine** (`astronomy-engine`, MIT), exécuté localement dans une Edge Function.
- Raisons :
  - gratuit et sans quota ;
  - licence MIT, sans contrainte pour Numa ;
  - aucune donnée de naissance envoyée à un tiers ;
  - JS pur, sans WASM ni fichier d'éphémérides ;
  - précision mesurée ≤ 3″ sur le Soleil et la Lune ;
  - ascendant et MC identiques à Swiss Ephemeris à 0,1″ près.
- **Swiss Ephemeris n'est pas retenu** : l'AGPL est refusée et la licence professionnelle n'est pas prise. Il peut servir de référence pour valider les calculs, uniquement dans des tests exécutés hors dépôt, sans dépendance dans le projet.
- Conséquences :
  - **Maisons** : Placidus et tout autre système de maisons sont à coder nous-mêmes à partir de formules publiques, puis à valider sur les profils de référence P1–P5. Maisons égales et signe entier : dérivées directement de l'ascendant.
  - **Latitudes polaires** : le repli est à définir, car Placidus n'y est pas défini.
  - **Secours** : aucune API hébergée n'est retenue. Une réévaluation reste possible plus tard, après mesure sur P1–P5 avec un compte de test.

La synthèse et l'analyse ci-dessous décrivent l'étude telle qu'elle a été soumise. Elle proposait Swiss Ephemeris en principal, sous réserve de la licence.

## Synthèse de l'étude

| | Recommandation initiale |
|---|---|
| **Principal (proposé, non retenu)** | **Swiss Ephemeris** (bibliothèque C de référence d'Astrodienst) via le portage WebAssembly `sweph-wasm`, exécuté dans une Edge Function. Écart mesuré avec la NASA/JPL : ≤ 0,3″ sur le Soleil et la Lune. Maisons Placidus et 24 autres systèmes. Aucun quota, aucune donnée envoyée à un tiers. **Condition : choisir la licence** (AGPL-3.0 pour tout Numa, ou licence professionnelle à 700 CHF). |
| **Secours (proposé, retenu comme principal)** | **Astronomy Engine** (MIT) : écart mesuré ≤ 3″ sur le Soleil et la Lune, ascendant et MC identiques à Swiss Ephemeris (≤ 0,1″). Ne calcule pas les maisons : seules les maisons égales et signe entier sont simples à coder ; Placidus serait à implémenter et à tester. C'est l'option à retenir si la licence de Swiss Ephemeris est refusée. |
| **API hébergées** | Non recommandées pour le MVP : clé et facturation, envoi des données de naissance à un tiers hors UE, restrictions de stockage incompatibles avec #22 (Prokerala), conditions muettes sur le stockage (AstrologyAPI, FreeAstrologyAPI), fuseau passé en décalage numérique (FreeAstrologyAPI) donc historique à gérer de notre côté. Aucune n'a pu être testée sans clé. |

## Options étudiées

### 1. Swiss Ephemeris via `sweph-wasm` (bibliothèque embarquée)

- Précision annoncée : fichiers compressés reproduisant JPL DE431/DE441 à 0,001″ ; modèle Moshier intégré (sans fichier) meilleur que 0,1″ pour les planètes et environ 3″ pour la Lune. Couverture : 13201 av. J.-C. à 17191 avec les fichiers, 3000 av. J.-C. à 3000 avec Moshier. Source : <https://www.astro.com/swisseph/swephinfo_e.htm>.
- Licence : double licence, **GNU AGPL** (tout le projet doit être publié sous AGPL ou licence compatible, y compris pour un service en ligne) ou **Swiss Ephemeris Professional License** signée avec Astrodienst, à choisir avant toute mise en service publique. Source : <https://www.astro.com/swisseph/swephinfo_e.htm>.
- Prix de la licence professionnelle : **700 CHF**, licence « unlimited », contrat à signer et envoyer à order@astro.com. Source : <https://www.astro.com/swisseph/swephprice_e.htm>. Conditions détaillées (nombre de produits, usage internet) dans un PDF non lu : **non vérifié**.
- Portage JS : `sweph-wasm` 2.6.9 (npm), licence AGPL-3.0-or-later d'après `package.json` et le fichier `LICENSE` du paquet (constat local), alors que le badge du README affiche « MIT License » : se fier au fichier `LICENSE`. Embarque Swiss Ephemeris **2.10.03** (`swe_version()`), un binaire WASM de 570 Ko et les fichiers d'éphémérides par tranche de 600 ans (environ 1,9 Mo pour 1800–2399 : `seas_18`, `sepl_18`, `semo_18`). Source : <https://www.npmjs.com/package/sweph-wasm>, constat local.
- Autres portages repérés, non testés : `@fusionstrings/swisseph-wasm` et `@fusionstrings/swiss-eph` sur JSR (AGPL, Deno annoncé). Source : <https://jsr.io/@fusionstrings/swisseph-wasm>.
- Maisons : 25 systèmes (Placidus, Koch, égales, signe entier, Regiomontanus, Campanus…). Aspects et transits : non fournis comme tels, calculés à partir des longitudes (différence d'angles, positions à une autre date) : quelques fonctions pures à écrire.
- Compatibilité Edge Functions : WASM supporté et fichiers statiques déployables via `static_files` dans `config.toml` (CLI ≥ 2.7.0, pas avec `--use-api`). Taille maximale d'une fonction : 20 Mo bundlée par la CLI. Source : <https://supabase.com/docs/guides/functions/wasm>, <https://supabase.com/docs/guides/functions/limits>. La même page indique un runtime Deno 1.46 : **non vérifié** pour la version actuelle du runtime. Exécution testée uniquement en Deno 2.9.1 local, **pas dans l'Edge Runtime**.
- Point d'attention : `swe_set_ephe_path` charge les fichiers par `fetch(url)`. Un `fetch` sur `file://` fonctionne en Deno local ; dans l'Edge Runtime, **non vérifié** (alternative : lire les fichiers avec `Deno.readFile` et les écrire dans le système de fichiers WASM).
- Données personnelles : calcul local, rien ne sort de l'infrastructure Supabase.

### 2. Astronomy Engine (bibliothèque embarquée)

- Licence MIT (constat local sur `package.json` 2.1.19 ; <https://github.com/cosinekitty/astronomy>).
- Précision annoncée : ±1′ d'arc. Source : <https://github.com/cosinekitty/astronomy>.
- Fournit : longitudes géocentriques apparentes du Soleil (`SunPosition`) et de la Lune (`EclipticGeoMoon`), planètes, temps sidéral (`SiderealTime`), obliquité (`e_tilt`). Ne fournit **ni ascendant, ni maisons** : l'ascendant et le MC se déduisent du temps sidéral et de l'obliquité par une formule standard (testée ci-dessous) ; Placidus demande une résolution itérative à implémenter.
- JavaScript pur, sans fichier de données ni WASM, aucune dépendance : compatible Deno et Edge Functions sans configuration particulière (exécuté en Deno local, **pas dans l'Edge Runtime**).
- Données personnelles : calcul local.

### 3. AstrologyAPI (astrologyapi.com, Vedic Rishi) — API hébergée

- Tarifs : astrologie occidentale « à partir de » ₹2 999/mois ; paiement à l'usage (exemple affiché : ₹1 000 pour 10 000 appels) ; 150 crédits offerts à l'inscription, sans carte. Source : <https://www.astrologyapi.com/pricing>.
- Authentification : Basic Auth (user id + clé). Source : <https://www.astrologyapi.com/docs/api-ref/>.
- Maisons, aspects, transits : thème natal, synastrie, transits et cuspides mentionnés sur la page de tarifs ; liste des systèmes de maisons et format du fuseau : **non vérifié** (page de référence occidentale introuvable, HTTP 404).
- Conditions : interdiction de construire un service concurrent et de rétro-ingénierie ; **aucune clause sur le stockage des résultats** ; aucune garantie de disponibilité ; droit indien (Maharashtra). Source : <https://www.astrologyapi.com/legal/terms-service>.
- Test sans clé : `POST https://json.astrologyapi.com/v1/planets/tropical` → `{"status":false,"msg":"API authentication failed!"}` (exécuté avec une date fictive).

### 4. FreeAstrologyAPI (freeastrologyapi.com) — API hébergée

- Tarifs : gratuit 200 requêtes/jour ; ₹1 000/mois pour 50 000/mois ; ₹3 500/mois pour 200 000 ; ₹6 500/mois pour 500 000. Source : <https://freeastrologyapi.com/pricing>. Les conditions d'utilisation citent 500 requêtes/jour et 1 requête/s, modifiables sans préavis : **incohérence** entre les deux pages. Source : <https://freeastrologyapi.com/terms-of-use>.
- Occidental : planètes, maisons, aspects, roue natale. Le fuseau est un **décalage décimal** (`timezone: 5.5`), pas un fuseau IANA : l'historique (heure d'été, LMT) reste à notre charge. Ascendant, DS, IC, MC renvoyés par l'endpoint planètes ; paramètre de système de maisons : **non vérifié**. Source : <https://freeastrologyapi.com/api-reference/western-astrology/planets>.
- Conditions : intégration commerciale autorisée, revente et redistribution interdites ; stockage des résultats **non traité** ; aucune garantie de disponibilité ; droit indien (Hyderabad). Source : <https://freeastrologyapi.com/terms-of-use>.
- Test sans clé : `POST https://json.freeastrologyapi.com/western/planets` → HTTP 403 `{"message":"Forbidden"}`.

### 5. Prokerala Astrology API (api.prokerala.com) — API hébergée

- Tarifs : gratuit 5 000 crédits/mois à 5 requêtes/min ; 19 $/mois (100 000 crédits, 60/min) ; 49 $ (350 000, 120/min) ; 99 $ (1 000 000, 300/min) ; prix promotionnels affichés. Coût en crédits par endpoint : **non vérifié**. Source : <https://api.prokerala.com/pricing>.
- Occidental : thème natal, aspects, transits, synastrie annoncés ; systèmes de maisons et format exact des paramètres : **non vérifié** (documentation rendue côté client, non lisible). Source : <https://api.prokerala.com/pricing>, <https://api.prokerala.com/docs>.
- Conditions : application payante autorisée ; lien vers Prokerala obligatoire en offre gratuite ; **cache autorisé mais rafraîchi au moins toutes les 24 h, archivage permanent et constitution d'une base interdits** ; Prokerala peut traiter et stocker les données envoyées ; aucune SLA ; droit indien (Kottayam). Source : <https://api.prokerala.com/tos>.
- Test sans clé : `GET https://api.prokerala.com/v2/astrology/natal-planet-position` → HTTP 401 « Full authentication is required ».

## Tableau comparatif

| Critère | Swiss Ephemeris (`sweph-wasm`) | Astronomy Engine | AstrologyAPI | FreeAstrologyAPI | Prokerala |
|---|---|---|---|---|---|
| Exactitude des positions | ≤ 0,3″ mesuré vs JPL | ≤ 3″ mesuré vs JPL (±1′ annoncé) | non testé (clé) | non testé (clé) | non testé (clé) |
| Ascendant / MC | oui (`swe_houses`) | formule à écrire (testée, = Swiss à 0,1″) | oui (non testé) | oui (non testé) | non vérifié |
| Fuseaux historiques | à notre charge (entrée en UT) | à notre charge | non vérifié | à notre charge (décalage décimal) | non vérifié |
| Heure inconnue | à notre charge | à notre charge | non vérifié | à notre charge | non vérifié |
| Maisons | 25 systèmes | non (égales / signe entier faciles, Placidus à coder) | oui, systèmes non vérifiés | oui, systèmes non vérifiés | non vérifié |
| Aspects | à calculer (fonction pure) | à calculer | oui | oui | oui |
| Transits | à calculer (positions à date) | à calculer | oui | non vérifié | oui |
| Quota gratuit | illimité | illimité | 150 crédits à l'inscription | 200/j (ou 500/j selon CGU) | 5 000 crédits/mois, 5/min |
| Prix | 0 (AGPL) ou 700 CHF | 0 | dès ₹2 999/mois | dès ₹1 000/mois | dès 19 $/mois |
| Licence / usage commercial | AGPL-3.0 ou licence pro | MIT | intégration, pas de service concurrent | intégration, pas de revente | appli payante ok, pas d'accès brut |
| Stockage des résultats | libre | libre | non traité | non traité | cache ≤ 24 h, pas d'archive |
| Disponibilité | dépend de Supabase seul | dépend de Supabase seul | aucune SLA | aucune SLA | aucune SLA |
| Deno / Edge Functions | WASM + fichiers statiques (Deno local ok, Edge Runtime non testé) | JS pur (Deno local ok, Edge Runtime non testé) | `fetch` | `fetch` | `fetch` (OAuth2 non vérifié) |
| Données envoyées à un tiers | aucune | aucune | date, heure, coordonnées (Inde) | idem (Inde) | idem (Inde), réutilisation « Service Data » |
| Version du moteur | 2.10.03 + fichiers DE431 | 2.1.19 | non publiée (non vérifié) | non publiée (non vérifié) | non publiée (non vérifié) |

## Jeu de profils de référence

Profils fictifs, sauf P3 (Albert Einstein, données publiques notées AA). L'heure locale est convertie en UTC avec `resolveUtcOffset` (`shared/time/utcOffset/utcOffset.ts`, base tz du moteur JavaScript), comme le fera #20.

| Id | Naissance (heure locale) | Lieu | Fuseau | UTC | Statut `utcOffset` | Ce que le profil teste |
|---|---|---|---|---|---|---|
| P1 | 1975-06-15 14:30 | Paris (48,8566 N ; 2,3522 E) | Europe/Paris | 13:30 (UTC+1) | `exact` | pas d'heure d'été en France en 1975 |
| P2 | 2021-10-31 02:30 | Paris | Europe/Paris | 00:30 (UTC+2) | `ambiguous` | heure répétée au passage à l'heure d'hiver |
| P3 | 1879-03-14 11:30 | Ulm (48,4 N ; 10,0 E) | Europe/Berlin | 10:37 (LMT de Berlin, +0:53) | `exact` | date ancienne, temps moyen local |
| P4 | 1990-01-10 08:15 | Sydney (33,8688 S ; 151,2093 E) | Australia/Sydney | 1990-01-09 21:15 (UTC+11) | `exact` | hémisphère sud, heure d'été australe, changement de date UTC |
| P5 | 1988-02-29, heure inconnue | Lyon (45,764 N ; 4,8357 E) | Europe/Paris | 11:00 pour midi (UTC+1) | `exact` | heure inconnue, 29 février |

## Résultats des tests pratiques

Exécution réelle le 2026-10-16, Deno 2.9.1 local (Windows), `sweph-wasm` 2.6.9 (Swiss Ephemeris 2.10.03, fichiers `*_18.se1`, Placidus, géocentrique) et `astronomy-engine` 2.1.19.

Référence publique : **JPL Horizons** (NASA, API sans clé, éphéméride DE441), longitude écliptique apparente géocentrique de la date (`QUANTITIES=31`, `CENTER=500@399`, `TIME_TYPE=UT`). Source : <https://ssd.jpl.nasa.gov/api/horizons.api>. Horizons ne calcule pas d'ascendant : l'ascendant est comparé entre les deux bibliothèques et, pour P3, à Astrotheme.

### Positions et écarts

Écarts en secondes d'arc (″) par rapport à JPL Horizons.

| Profil | Soleil (Swiss) | écart Swiss | écart Engine | Lune (Swiss) | écart Swiss | écart Engine | Ascendant (Swiss) | écart Engine vs Swiss | MC (Swiss) |
|---|---|---|---|---|---|---|---|---|---|
| P1 | 23°50′ Gémeaux | 0,0 | 0,7 | 9°43′ Vierge | −0,1 | 0,1 | 13°08′ Balance | 0,0 | 16°39′ Cancer |
| P2 | 7°47′ Scorpion | 0,1 | 0,1 | 3°28′ Vierge | 0,1 | 2,0 | 0°31′ Vierge | 0,0 | 21°48′ Taureau |
| P3 (LMT Berlin) | 23°29′ Poissons | 0,3 | −0,1 | 14°24′ Sagittaire | 0,3 | 2,7 | 8°55′ Cancer | 0,0 | 9°20′ Poissons |
| P3 (LMT d'Ulm, 10:50 UT) | 23°30′ Poissons | 0,3 | −0,1 | 14°31′ Sagittaire | 0,2 | 2,7 | 11°38′ Cancer | 0,0 | 12°50′ Poissons |
| P4 | 19°21′ Capricorne | 0,0 | −0,3 | 2°01′ Cancer | −0,2 | −0,8 | 17°27′ Verseau | −0,1 | 11°32′ Scorpion |
| P5 midi | 10°04′ Poissons | 0,0 | −1,2 | 5°19′ Lion | −0,1 | 0,4 | 25°04′ Gémeaux | 0,0 | 26°04′ Verseau |

Degrés tronqués à la minute.

### Constats

1. **Précision** : les deux bibliothèques sont très en deçà de la minute d'arc sur le Soleil et la Lune ; Swiss Ephemeris ≤ 0,3″, Astronomy Engine ≤ 3″. Pour l'astrologie (orbes de plusieurs degrés), la différence n'est pas perceptible ; elle compte seulement pour la reproductibilité exacte des résultats.
2. **Ascendant** : la formule appliquée à Astronomy Engine (temps sidéral apparent, obliquité vraie) donne le même ascendant et le même MC que Swiss Ephemeris à 0,1″ près, sur les deux hémisphères.
3. **Dates anciennes (P3)** : Astrotheme donne pour Einstein Soleil 23°30′ Poissons, Lune 14°32′ Sagittaire, **ascendant 11°38′ Cancer, MC 12°50′ Poissons** (source : <https://www.astrotheme.com/astrology/Albert_Einstein>, fuseau utilisé non indiqué). C'est notre calcul en **temps moyen local d'Ulm** (ascendant et MC identiques à la minute ; Lune 14°31,6′, soit 14°32′ arrondi) (longitude 10° E → +0:40, 10:50 UT). Avec le décalage de la base tz (`Europe/Berlin`, LMT de Berlin +0:53:28, arrondi à +0:53 par `utcOffset`), l'ascendant tombe à 8°55′ Cancer : **2,7° d'erreur**. Avant l'adoption d'une heure légale, le décalage doit être calculé à partir de la longitude du lieu (longitude / 15 h), pas du LMT de la ville de référence du fuseau.
4. **Heure ambiguë (P2)** : 02:30 existe deux fois le 31/10/2021 à Paris. Première occurrence (00:30 UT) : ascendant 0°31′ Vierge ; seconde (01:30 UT, calculée avec Astronomy Engine) : 11°24′ Vierge. Une heure d'écart déplace l'ascendant d'environ 11° ici : le statut `ambiguous` doit être remonté à l'utilisateur.
5. **Heure inconnue (P5)** : sur la journée locale (00:00 → 23:59), la Lune passe de 29°24′ Cancer à 11°13′ Lion : **elle change de signe**. L'ascendant fait le tour du zodiaque. Le Soleil bouge de 1° (9°34′ → 10°34′ Poissons, même signe). Sans heure : pas d'ascendant ni de maisons, et un signe lunaire incertain s'il change dans la journée.
6. **Performance** : en local, 0,55 ms par thème (Soleil, Lune, maisons) avec Swiss Ephemeris et 0,21 ms avec Astronomy Engine, hors initialisation (moyenne sur 200 calculs). Largement sous la limite de 2 s de CPU des Edge Functions, mais le coût d'initialisation du WASM et du chargement des fichiers au démarrage à froid n'a **pas été mesuré**, et rien n'a été exécuté dans l'Edge Runtime.
7. **API hébergées** : les trois refusent un appel sans authentification (403/401). Elles n'ont **pas pu être testées** faute de clé ; aucune inscription n'a été faite pour cette étude. Leur exactitude est donc **non vérifiée**.

## Risques

- **Licence (Swiss Ephemeris)** : l'AGPL s'applique au service en ligne ; utiliser `sweph-wasm` sous AGPL impose de publier l'ensemble de Numa sous AGPL-3.0 (ou licence compatible) et de fournir le code source aux utilisateurs du service. Le dépôt est public mais **sans licence** à ce jour. Sinon, licence professionnelle (700 CHF). Ne pas mettre en production avant la décision.
- **Licence (`sweph-wasm`)** : badge MIT trompeur dans le README, paquet maintenu par une seule personne ; épingler la version et vérifier le `LICENSE` à chaque mise à jour.
- **Coût** : nul pour les bibliothèques (hors licence pro). Les API hébergées facturent à l'appel ; leurs quotas gratuits sont faibles (5 req/min chez Prokerala) et modifiables sans préavis.
- **RGPD** : date, heure et lieu de naissance sont des données personnelles. Une API hébergée en Inde implique un transfert hors UE (localisation des serveurs : **non vérifiée**) à documenter, et un fournisseur à valider explicitement (`docs/claude/security.md`). Prokerala se réserve des droits de traitement et de stockage sur les données envoyées. Une bibliothèque embarquée supprime ce risque.
- **Stockage** : les conditions de Prokerala (rafraîchissement 24 h, pas d'archive) sont incompatibles avec un cache durable des thèmes (#22) ; AstrologyAPI et FreeAstrologyAPI ne disent rien.
- **Exactitude de la conversion horaire** : le moteur n'est pas la source d'erreur principale ; ce sont le fuseau et l'heure. La base tz donne le LMT de la ville de référence, pas celui du lieu (constat 3), et le projet tz indique que ses données antérieures à 1970 ne font pas autorité (<https://data.iana.org/time-zones/theory.html>, **non revérifié** dans cette étude).
- **Edge Runtime** : version Deno, chargement des fichiers d'éphémérides et temps de démarrage à froid à valider dans #20 avec `supabase functions serve` puis un déploiement réel.

## Impact sur les tickets liés

Écrit avant la décision. Avec Astronomy Engine retenu, seules les mentions d'Astronomy Engine s'appliquent. Swiss Ephemeris reste une référence de test hors dépôt.

- **#20 (thème natal)** : calcul dans une Edge Function avec la bibliothèque retenue ; entrée en UT recalculée côté serveur (fuseau IANA + `resolveUtcOffset`, cf. entrée #19 du journal) ; pour les dates antérieures à l'heure légale du pays, décalage = longitude / 15 ; enregistrer `engine` (`swiss-ephemeris 2.10.03` / `sweph-wasm 2.6.9`, fichiers `*_18.se1`) ou `astronomy-engine 2.1.19`, le système de maisons et le statut horaire (`exact`, `ambiguous`, `nonexistent`, heure inconnue) comme niveau de confiance. Aspects et transits en fonctions pures testées (`deno test`). Le jeu P1–P5 et les valeurs ci-dessus servent de tests de non-régression (tolérance proposée : 1″ pour Swiss, 5″ pour Astronomy Engine).
- **#22 (cache)** : avec une bibliothèque embarquée, aucune contrainte contractuelle sur le stockage ; clé de cache = données de naissance normalisées (UT, lat, lon, heure connue ou non) + version du moteur + version des fichiers d'éphémérides + système de maisons. Le recalcul étant presque gratuit (≈ 1 ms), le cache sert surtout à figer un résultat affiché et à tracer sa version.
- **#80 (ascendant)** : ascendant calculé seulement si l'heure est connue ; si l'heure est `ambiguous`, proposer les deux ascendants possibles ; si l'heure est inconnue, ne rien calculer et passer à la variante « déclaré ». Un écart d'une minute d'heure de naissance déplace l'ascendant d'environ 0,25° : les écarts avec l'ascendant déclaré peuvent venir de l'heure saisie.
- **`docs/claude/ai-astrology.md`** et entrée #98 du journal (« calcul délégué à l'API externe, cf. #50 ») : mis à jour le 2026-10-16. Le calcul est désormais local, dans une Edge Function avec Astronomy Engine, et non plus confié à une API externe.

## Points ouverts

1. Licence : tranchée le 2026-10-16. Astronomy Engine (MIT) est retenu, Swiss Ephemeris est écarté (voir « Décision »).
2. Système de maisons par défaut (Placidus usuel en astrologie occidentale ; Placidus est indéfini aux latitudes polaires, prévoir un repli).
3. Politique d'affichage en cas d'heure inconnue ou ambiguë (#80, #20).
4. Aucune API hébergée n'est retenue pour l'instant. Si une API est envisagée plus tard, créer un compte de test pour mesurer son exactitude sur P1–P5 avant toute décision.
