# Arsenal motion : créer des expériences animées premium à la demande

Date : 2026-11-04. Statut : validé par l'utilisateur le 2026-11-04.

## Intention

À partir d'une phrase ou d'un brief client, un agent qui travaille dans un projet démarré depuis ce boilerplate produit seul une landing page animée du niveau des templates premium de HorizonX (horizonx.so : Emberline, Sorvine, Hadal, Lotus, Kurage), ou meilleure.

Le boilerplate ne livre ni effets ni assets. Il livre les armes : skills, serveurs MCP, outils en ligne de commande, boucle de vérification, et la plomberie minimale qui garde n'importe quel effet accessible et rapide. Chaque effet est inventé pour le projet qui en a besoin.

Pourquoi : une bibliothèque toute faite (HorizonX ou une nôtre) plafonne la qualité à son catalogue, rend tous les sites clients semblables, et le code HorizonX casse nos règles (framer-motion, styles en dur, pas de tokens).

## Ce que montrent les références

| Référence | Recette réelle (fiches produit HorizonX)                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Emberline | Shader WebGL en direct (feu sur le bord d'une éclipse, réagit au pointeur), dégradé fixe sans WebGL, vraie UI produit devant |
| Sorvine   | Moteur de particules : nuage qui forme des mains, morphing en sphère, anneaux, cerveau sur trois scènes de scroll            |
| Hadal     | Transition WebGL qui fond une vidéo sous-marine en nuages au scroll, histoire épinglée, Lenis                                |
| Lotus     | Scène three.js en direct : shaders GLSL, éclairage HDR, bloom, eau, paliers de qualité adaptatifs                            |
| Kurage    | Méduses dessinées en ASCII en direct, titre qui tourne mot par mot avec un flou                                              |

## Objectifs

1. L'agent enchaîne seul : brief, direction artistique, concept de moment signature, production des visuels, code du rendu temps réel, chorégraphie, vérification, autocritique, correction.
2. Il maîtrise les familles de techniques vues dans les références : shaders en direct (feu, plasma, verre, orbes en raymarching), particules GPU qui passent d'une forme à l'autre, vidéo IA au scroll (séquence d'images, fondus WebGL), scènes 3D temps réel (eau, reflets, bloom, rayons de lumière, HDRI), rendus de post-traitement (ASCII, tramage, demi-teinte), typographie cinétique, relief 2.5D depuis une image, nuages de points scannés (splats).
3. Il voit et juge le mouvement qu'il produit, pas seulement des captures fixes.
4. Chaque page garde les garanties actuelles : tokens, GSAP seul, accessibilité, mouvement réduit, budgets Lighthouse.

## Hors périmètre

- Aucune bibliothèque d'effets, aucun asset, aucune page de démo d'effets dans le boilerplate.
- Pas de MCP HorizonX, pas de reprise de leur code ni de leurs visuels.
- WebGPU n'est pas le moteur par défaut.
- Son et musique d'ambiance (Lotus en a) : hors périmètre pour cette version (choix de l'auteur).

## Anti-objectifs (échec même si ça marche)

- Des pages qui se ressemblent d'un client à l'autre, ou le cliché « blob dégradé / sphère de particules » plaqué partout.
- L'effet au-dessus du message : du contenu essentiel uniquement dans le canvas, Lighthouse ou le mobile sacrifiés.
- Un pipeline qui attend un humain à chaque étape.
- Livrer à un client du code ou un asset sous licence non commerciale.
- Faire tourner dans le pipeline un MCP qui exécute du code arbitraire sans garde-fou.

## Contraintes

- Règles d'or de `AGENTS.md` : les apps ne stylent pas, tokens uniquement dans `theme.css`, TDD, un ADR `proposed` par décision technique (seul un humain l'accepte), `knip` sans dépendance ni export inutilisé.
- GSAP est la seule librairie d'animation (ADR-0011). three et R3F vivent dans `@repo/ui` (ADR-0019) ; drei seulement avec un ADR.
- Lighthouse : performance ≥ 0.95, le reste à 1. Une image fixe (poster) est l'élément LCP, le canvas se charge après.
- Mouvement réduit et absence de WebGL : la page reste complète, avec des plans fixes.
- Licences acceptées pour le code et les assets livrés : MIT, Apache-2.0, BSD, Zlib, CC0, et les sorties Magnific selon ses conditions. Exclus : LYGIA (Prosperity, non commercial), code Shadertoy sans licence explicite permissive, poids Hunyuan auto-hébergés (territoire UE exclu), Apple SHARP (recherche seulement).
- Les visuels générés vivent dans le projet client qui les utilise, jamais dans le boilerplate.
- Comme `knip` refuse les dépendances inutilisées, le boilerplate ne peut pas préinstaller les librairies d'effets.

## Décisions de l'utilisateur

- On construit la capacité nous-mêmes, pas d'abonnement HorizonX.
- Entrée : une phrase ou un brief client. Sortie : une qualité HorizonX, en autonomie.
- Pas de bibliothèque d'effets : des skills, MCP et outils pour créer à la demande. Aucun asset stocké ici.
- Les ADR restent validés par l'utilisateur.
- MCP Blender ajouté (failles corrigées). La télémétrie est désactivée sur chaque MCP qui le permet.
- Test de réussite : l'utilisateur donne 3 briefs inédits, l'agent sort 3 pages seul, on les compare côte à côte avec HorizonX.
- Plafond Magnific : 30 000 crédits par page, exploration, brouillons et reprises compris. Repères au 2026-11-04 : Seedance 2.5 10 s en 1080p = 7 900, en brouillon = 2 000, Kling 2.5 10 s en 1080p = 650, modèle 3D Tripo = 580, 4 images ≈ 200.
- Mobile : l'effet signature tourne en direct sur téléphone, dans un palier allégé (moins de particules, résolution réduite, pas de post-traitement lourd). L'image fixe reste l'élément LCP. Cela remplace la règle d'ADR-0019 qui ne charge jamais WebGL sous `md`.

## Conception

### 1. Armes de production (visuels)

- **Magnific (déjà branché)** reste la source unique de génération : vidéo (Seedance 2.5 en tête, images de début et de fin pour boucler ou enchaîner les plans), 3D (Tripo, Hunyuan, Meshy, Trellis), cartes de profondeur, détourage vidéo, et `video_view_frames` / `video_analyze` gratuits pour juger un rendu.
- **MCP Blender** (`mcp-for-blender` 2.2.7, failles de juin 2026 corrigées), décision de l'utilisateur : construire, nettoyer et alléger une scène, rendre une image, exporter en GLB. Télémétrie coupée (`DISABLE_TELEMETRY=true`) et mode sûr activé (`BLENDER_MCP_SAFE_MODE=1` : il bloque l'accès direct aux fichiers, le lancement de programmes et le réseau, et garde la modélisation, les matériaux, le rendu et l'import-export), ce mode étant un choix de l'auteur. **Blender en ligne de commande** (`blender -b -P`) reste disponible pour les traitements en lot sans interface.
- **Poly Haven** (CC0) pour les HDRI et textures PBR.
- **ffmpeg et un encodeur AVIF/WebP** (avifenc et cwebp, ou sharp déjà présent) pour les séquences d'images et les vidéos de scrub.
- **Spark** (MIT) pour afficher des splats, et **Brush** (Apache-2.0, local) pour les produire à partir d'images ou de vidéos Magnific, quand un projet en a besoin. Pas de Marble : Magnific reste le seul fournisseur payant (ADR-0018), donc toute dépense passe sous le même plafond (choix de l'auteur).

### 2. Armes de rendu (savoir écrire l'effet)

Skills importés et épinglés dans `skills-lock.json`, depuis la même source que les 5 actuels (CloudAI-X/threejs-skills, MIT) : `threejs-shaders`, `threejs-postprocessing`, `threejs-materials`, `threejs-textures`, `threejs-lighting`, `threejs-geometry`, `threejs-interaction`, `threejs-fundamentals`.

Skills projet à écrire (génériques : des règles à suivre et à éviter, sans exemple propre à ce dépôt). Leurs recettes sont réécrites depuis des sources MIT ou Apache, comme les shaders paper-design ou les nœuds TSL de three :

| Skill                   | Ce qu'il enseigne                                                                                                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shader-craft`          | GLSL dans R3F : bruit et FBM, distorsion de domaine, SDF et raymarching, feu, plasma, verre chromatique, rayons de lumière, grain. Post-traitement : bloom, ASCII, tramage, demi-teinte, aberration. Uniforms pilotés par GSAP, coût par effet, erreur de compilation qui casse le test |
| `gpu-particles`         | Simulation FBO (GPGPU), GLB vers points, formes cibles en DataTexture, morphing, bruit curl, répulsion du pointeur, progression du scroll, nombre de particules par palier d'appareil                                                                                                   |
| `cinematic-footage`     | Prompts vidéo Magnific (début et fin, boucles, plans enchaînés), contrôle du raccord (SSIM), séquence AVIF par défaut, H.264 tout-intra au-delà de 150 images, vidéo en texture avec fondus WebGL, relief 2.5D par carte de profondeur                                                  |
| `scene-3d` (mis à jour) | Eau et reflets, HDRI, bloom, rayons de lumière, paliers de qualité, splats avec Spark                                                                                                                                                                                                   |

La typographie cinétique (flou mot par mot, apparitions découpées) s'ajoute à `scroll-storytelling`, puisqu'elle reste du GSAP pur.

Moteur par défaut : WebGL2, R3F 9 et `@react-three/postprocessing`. WebGPU et TSL seulement quand une scène dépasse le million de particules ; à revoir quand R3F 10 passera en bêta.

### 3. Plomberie dans `@repo/ui` (choix de l'auteur)

Un seul support générique, sans aucun effet dedans, qui généralise le contrat de `BlockStage` :

- poster en image fixe (LCP) ;
- canvas chargé côté client seulement, après l'idle, quand la scène approche de la fenêtre ;
- poster seul en mouvement réduit ou sans WebGL ;
- horloge unique : `frameloop="never"` avancé par `gsap.ticker` ;
- paliers de qualité par appareil (au moins un palier mobile allégé et un palier desktop), choisis au chargement et transmis à la scène, avec un plafond de densité de pixels par palier ;
- nom accessible ;
- canal de progression branché sur `ScrollScene`.

Chaque projet passe sa propre scène dedans. `BlockStage` devient le premier utilisateur de ce support, ce qui évite de dupliquer le contrat. Raison du choix : sans ce support, chaque effet réinventerait ces garanties et l'accessibilité finirait par sauter.

### 4. Armes de vérification

- **Playwright MCP** passe en 0.0.84 avec `--caps=devtools` (vidéo, chapitres, traces). **Chrome DevTools MCP** 1.12.0 s'ajoute (traces de perf, ralentissement CPU, screencast, Lighthouse, émulation du mouvement réduit).
- **Contrôle du mouvement dans `packages/design-audit`**, exécuté par `pnpm test:e2e` sur SwiftShader :
  - scroll scripté sur des paliers de progression, avec une capture par palier, puis une planche contact ;
  - canvas vide (écart type des pixels trop faible) et canvas figé (deux captures identiques là où un mouvement est attendu) détectés ;
  - erreur de shader traitée comme un échec ;
  - passage en mouvement réduit ;
  - chaîne du renderer WebGL consignée.
- **Perf sur un vrai GPU, en local**, parce que les temps de rendu sous SwiftShader ne veulent rien dire : CPU ralenti 4×, 95e centile des frames ≤ 20 ms, aucune frame longue au-delà de 100 ms pendant le scroll. Ce sont des seuils de départ à ajuster après le banc d'essai.
- **Lighthouse sur mobile et sur desktop, pour chaque route** listée dans `apps/web/e2e/support/routes.ts`, pas seulement `/`. Les budgets restent : performance ≥ 0.95, le reste à 1.
- **Skill `motion-review` et agent `design-reviewer` étendu** : ils jugent des enregistrements et des planches contact selon une grille de qualité. Cette grille couvre la profondeur, la lumière, le rythme et les courbes d'accélération, la cohérence avec la marque, la vie au repos, la réaction au pointeur, la lisibilité du message et la différence avec les clichés. La grille décrit le niveau attendu avec des mots, sans images. Les seules images de comparaison sont les références du projet tirées de `design-inspiration` : liens dans `DESIGN.md`, captures dans `.context/`, jamais versionnées. La comparaison avec HorizonX reste le jugement de l'utilisateur pendant le banc d'essai, ce n'est pas une entrée du skill (choix de l'auteur).

### 5. Chef d'orchestre et autonomie

Un skill projet (nom à fixer par le constructeur, par exemple `signature-experience`) part d'une phrase ou d'un brief et enchaîne :

1. le contexte produit (`product-marketing`, `PRODUCT.md`) ;
2. la direction (`design-inspiration`, `impeccable`) ;
3. le choix de la famille de technique selon ce que le mouvement doit expliquer ;
4. le storyboard (`scroll-storytelling`) ;
5. le plan de visuels (`asset-production`) ;
6. le code, à l'aide des skills de technique ;
7. la vérification, la critique et la correction, en boucle jusqu'à ce que la grille passe.

En mode autonome, les validations humaines des skills existants deviennent des points d'autocontrôle. L'agent tranche, consigne sa raison dans `DESIGN.md` et se relit avec `motion-review`. Les validations restent en place pour une session interactive.

Il ne reste que deux arrêts durs :

- une dépense Magnific qui ferait dépasser 30 000 crédits à la page (l'agent tient le compte avec `simulate_cost` avant chaque appel payant) ;
- une décision technique hors de l'arsenal déjà accepté.

Pour que ce deuxième arrêt reste rare, l'arsenal est tranché une fois pour toutes dans le boilerplate. Des ADR acceptés fixent les librairies autorisées et leur version majeure. Le projet client n'installe une librairie que lorsqu'il s'en sert et l'épingle alors dans le catalogue pnpm, ce qui respecte `knip` (une entrée de catalogue inutilisée serait du code spéculatif).

Ces ADR couvrent aussi les composants, les motifs et la configuration que les techniques impliquent, sans en écrire de nouveau dans le projet client : composants d'effet et primitives de scène dans `@repo/ui`, composant de boucle ou de séquence vidéo, réglages d'images dans `next.config`. ADR-0018 et `asset-production`, qui exigent aujourd'hui un ADR pour le premier composant vidéo, sont mis à jour en conséquence. Pour toute décision hors de ce périmètre, l'agent écrit un ADR `proposed` et le run s'arrête ; `pnpm check` reste rouge tant que l'utilisateur ne l'a pas accepté (choix de l'auteur).

Permissions : les runs autonomes tournent dans le mode de permissions actuel des workspaces Conductor. Le boilerplate ajoute à `.claude/settings.json` les autorisations des outils de l'arsenal (blender, ffmpeg, encodeurs, outils MCP Magnific, Playwright et Chrome DevTools), pour qu'une session ordinaire ne s'arrête pas non plus sur une demande de permission. Les outils qui exécutent du JavaScript dans la page (mesure des frames) restent autorisés, uniquement contre le serveur local du projet (choix de l'auteur).

### 6. ADR à proposer

- L'arsenal de rendu : WebGL2 par défaut, `@react-three/postprocessing`, Spark, et drei si les techniques en ont besoin.
- WebGL en direct sur mobile avec paliers de qualité, qui remplace ADR-0019 sur ce point, et Lighthouse sur mobile et desktop pour chaque route.
- Les outils de production : MCP Blender (télémétrie coupée, mode sûr) et Blender en ligne de commande, Poly Haven, ffmpeg et l'encodage AVIF.
- Les MCP de vérification : la mise à jour Playwright et l'ajout de Chrome DevTools.
- Le contrôle du mouvement en e2e.
- Le support générique dans `@repo/ui`.
- Le mode autonome et ses deux arrêts durs.
- La politique de licences.

### 7. Banc d'essai (critère de réussite)

- L'utilisateur fournit 3 briefs inédits. Chaque run part d'un workspace Conductor neuf créé depuis le boilerplate, sans intervention humaine en dehors des deux arrêts durs.
- Livrables par run : la page exportée, un enregistrement du scroll, une planche contact, le rapport Lighthouse et le journal des décisions.
- Réussi si :
  - l'utilisateur juge les 3 pages au niveau HorizonX en comparaison côte à côte ;
  - les budgets Lighthouse passent ;
  - la page est complète en mouvement réduit ;
  - le contrôle du mouvement ne signale ni canvas vide, ni canvas figé, ni saccade ;
  - les 3 pages n'utilisent pas la même technique signature.
- Les pages du banc ne sont pas fusionnées dans le boilerplate. Ce que chaque échec apprend va dans les skills.

## Laissé au constructeur

- Les noms exacts des skills et le découpage fin de leur contenu.
- L'API du support générique, à condition de tenir le contrat de la section 3.
- L'emplacement des scripts Blender et d'encodage.
- Le choix entre avifenc/cwebp et sharp.
- L'ordre de construction. Ordre conseillé : vérification d'abord, pour que tout le reste soit contrôlable ; puis ADR et support générique ; puis skills importés et skills de technique ; puis le chef d'orchestre ; enfin le banc d'essai, avec une itération sur les skills.
