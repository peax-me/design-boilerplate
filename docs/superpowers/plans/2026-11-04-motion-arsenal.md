# Arsenal motion : plan d'implémentation

> **Pour les agents qui exécutent :** SOUS-SKILL REQUIS : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** donner au boilerplate les armes (skills, MCP, outils, vérification, un support générique) pour qu'un agent produise seul, depuis une phrase ou un brief, une page animée de niveau HorizonX, sans bibliothèque d'effets ni asset stocké.

**Architecture :** cinq ADR proposés fixent l'arsenal et l'autonomie (porte humaine unique). Côté code, `@repo/ui` reçoit un support `Stage` sans effet dedans : poster, paliers de qualité, chargement différé, horloge GSAP. `BlockStage` devient son premier utilisateur. `@repo/design-audit` gagne un contrôle du mouvement exécuté en e2e, et Lighthouse passe sur mobile et desktop pour chaque route. Côté connaissances, on importe 8 skills three.js et on écrit 5 skills projet ; 5 skills existants passent en mode autonome.

**Stack :** Next.js 16, React 19, three 0.186.1, @react-three/fiber 9.8.2, GSAP 3.15 + ScrollTrigger + Lenis, Vitest 5 (navigateur via Playwright), Playwright 1.64, LHCI 0.15, Magnific MCP.

**Spec :** `docs/superpowers/specs/2026-11-04-motion-arsenal-design.md`

## Contraintes globales

- Lighthouse : performance ≥ 0.95, accessibilité, bonnes pratiques et SEO = 1, sur mobile ET desktop, pour chaque route de `apps/web/e2e/support/routes.ts`.
- Plafond Magnific : 30 000 crédits par page, exploration, brouillons et reprises compris. Magnific est le seul fournisseur payant.
- Licences autorisées pour le code et les assets livrés : MIT, Apache-2.0, BSD, Zlib, CC0, sorties Magnific. Exclus : LYGIA, code Shadertoy sans licence permissive explicite, poids Hunyuan auto-hébergés, Apple SHARP.
- Télémétrie coupée sur chaque MCP qui le permet : `DISABLE_TELEMETRY=true` pour Blender, `--no-usage-statistics` pour Chrome DevTools.
- GSAP est la seule librairie d'animation ; pas de framer-motion ni de Motion.
- Moteur : WebGL2 par défaut. WebGPU/TSL seulement au-delà d'un million de particules.
- Mouvement réduit ou absence de WebGL2 : poster seul, page complète, aucun `canvas`.
- Téléphones : scène en direct, palier `light`, chargée après la première interaction. Desktop : palier `full`, chargé après l'idle quand la scène approche de la fenêtre.
- Densité de pixels : `light` = `[1, 1.5]`, `full` = `[1, 2]`.
- Particules : `light` = 32 768 (texture 256×128), `full` = 131 072 (512×256).
- Seuils du contrôle du mouvement : canvas vide si l'écart type de luminance sur une grille 32×32 est < 2 ; canvas figé si la différence moyenne entre deux captures à 500 ms d'écart est < 0.5.
- Perf sur vrai GPU : CPU ralenti 4×, 95e centile des frames ≤ 20 ms, aucune long animation frame > 100 ms pendant le scroll.
- Vidéo au scroll : séquence AVIF par défaut, ≤ 150 images, ≤ 6 Mo desktop, ≤ 3 Mo mobile, 1600 px desktop, recadrage portrait 900 px mobile. Au-delà de 150 images : H.264 tout-intra. Raccord de boucle : SSIM ≥ 0.95. Décalage de parallaxe 2.5D ≤ 3 % de la largeur.
- Rien dans le boilerplate : aucun effet, aucun asset, aucune page de démo d'effets. Les fixtures de test restent des formes neutres (une boîte).
- Skills : rédigés en anglais (convention du dépôt), règles génériques à suivre et à éviter, aucun exemple propre à une page ou un composant de ce dépôt.
- ADR : les agents écrivent `status: proposed`, jamais autre chose.
- Règles d'or de `AGENTS.md` : pas de `className` ni de `style` dans `apps/*`, tokens uniquement dans `theme.css`, TDD, tests dans `tests/` ou `e2e/`, exports nommés, fichiers en kebab-case, noms explicites, `knip` propre.
- Couverture : `packages/ui` ≥ 90 %, fichiers d'analyse de `packages/design-audit` = 100 %.
- Commits : conventionnels (commitlint), ≤ 100 caractères, aucune mention de Claude.

## Points de vigilance

1. **Appareil sans WebGL2** (vieux Android, WebGL désactivé) : le poster reste, aucune erreur, aucun canvas. Test dans la tâche 4.
2. **Contexte WebGL perdu en cours de route** (onglet mobile mis en arrière-plan) : la scène disparaît, le poster revient au lieu d'un canvas noir. Test dans la tâche 4.
3. **Mouvement réduit activé après le chargement** : la scène se démonte et le poster revient. Test dans la tâche 4.
4. **Page avec plusieurs scènes** : celles hors écran ne se chargent pas et ne calculent aucune frame. Tests dans les tâches 3 et 4.
5. **Faux positifs du contrôle du mouvement** : un avertissement console sans rapport (React DevTools, HMR) ne doit pas faire échouer l'audit, seules les erreurs WebGL et shader comptent. Test dans la tâche 2.

---

### Tâche 1 : ADR de l'arsenal (porte humaine)

**Fichiers :**

- Créer : `docs/adr/0024-real-time-rendering-arsenal.md`, `docs/adr/0025-stage-host-and-quality-tiers.md`, `docs/adr/0026-motion-verification.md`, `docs/adr/0027-production-tooling.md`, `docs/adr/0028-autonomous-mode.md`
- Modifier : `docs/adr/README.md` (index)

**Interfaces :**

- Produit : les numéros d'ADR cités par les tâches suivantes.

- [ ] **Étape 1 : écrire les 5 ADR depuis `docs/adr/template.md`**, avec `status: proposed`, `date: 2026-11-04` et un « Supersedes / Amends » explicite là où c'est indiqué.
  - **0024 Real-time rendering arsenal and licence policy.**
    - WebGL2 via R3F 9, `@react-three/postprocessing` 3.x et `postprocessing` 6.x, `@react-three/drei` 10.x (helpers importés un par un, décodeurs auto-hébergés), `@sparkjsdev/spark` 2.x.
    - Les 8 skills CloudAI-X et les skills projet `shader-craft`, `gpu-particles` et `cinematic-footage`.
    - Les composants d'effet, primitives de scène et composants vidéo construits avec ces skills sont couverts, sans ADR par projet.
    - Un projet installe une librairie seulement quand il s'en sert, et l'épingle alors dans le catalogue pnpm.
    - Politique de licences : celle des contraintes globales.
    - À revoir quand R3F 10 passe en bêta.
  - **0025 Stage host with quality tiers and live WebGL on phones.**
    - Le support `Stage`, les paliers `light` et `full` et leurs déclencheurs (idle et proximité ; première interaction en plus pour `light`), la densité de pixels par palier.
    - Amends ADR-0019 : WebGL est chargé sous `md`.
  - **0026 Motion verification.**
    - Le contrôle du mouvement en e2e et ses seuils.
    - Lighthouse sur mobile et desktop pour chaque route.
    - Playwright MCP 0.0.84 `--caps=devtools` et Chrome DevTools MCP 1.12.0.
    - Les budgets de perf sur vrai GPU.
  - **0027 Production tooling.**
    - Magnific comme seul fournisseur payant.
    - MCP Blender (`mcp-for-blender` 2.2.7, qui corrige les CVE-2026-10661/10662/10688), avec `DISABLE_TELEMETRY=true` et `BLENDER_MCP_SAFE_MODE=1` ; Blender en ligne de commande (`blender -b -P`) pour les lots sans interface. Le module complémentaire Blender s'installe par machine (`uvx mcp-for-blender install-addon`).
    - ffmpeg, avifenc et cwebp ; Poly Haven (CC0) ; Brush (Apache-2.0) pour entraîner des splats.
  - **0028 Autonomous mode.**
    - Deux arrêts durs : la dépense qui ferait dépasser 30 000 crédits par page, et toute décision hors des ADR acceptés (ADR `proposed`, puis arrêt).
    - Les validations des skills deviennent des points d'autocontrôle consignés dans `DESIGN.md`.
    - Liste d'autorisations dans `.claude/settings.json`.
    - Le skill `signature-experience`.
- [ ] **Étape 2 : ajouter les 5 lignes à l'index** de `docs/adr/README.md`.
- [ ] **Étape 3 : vérifier.** Lancer `pnpm adr:check`. Résultat attendu : échec qui cite exactement 0024 à 0028 avec « awaiting human approval », et rien d'autre.
- [ ] **Étape 4 : commit** `docs(adr): propose the motion arsenal decisions`.
- [ ] **Étape 5 : ARRÊT.** Demander à l'utilisateur de relire et d'accepter 0024 à 0028. Ne reprendre qu'après que `pnpm adr:check` est vert.

### Tâche 2 : analyse du mouvement (pure)

**Fichiers :**

- Créer : `packages/design-audit/src/motion.ts`, `packages/design-audit/tests/motion.test.ts`
- Modifier : `packages/design-audit/package.json` (export `"./motion": "./src/motion.ts"`), `packages/design-audit/vitest.config.ts` (`coverage.include` : `["src/analyze.ts", "src/motion.ts"]`)

**Interfaces :**

- Produit :

  ```ts
  export interface CanvasFrame {
    canvas: string;
    progress: number;
    luminance: number[];
  } // grille 32×32, 0–255
  export interface AmbientPair {
    canvas: string;
    first: number[];
    second: number[];
  }
  export interface MotionViolation {
    rule: "blank-canvas" | "frozen-canvas" | "render-error";
    canvas: string;
    detail: string;
  }
  export function luminanceDeviation(luminance: number[]): number;
  export function meanDifference(first: number[], second: number[]): number;
  export function findBlankCanvases(frames: CanvasFrame[]): MotionViolation[];
  export function findFrozenCanvases(pairs: AmbientPair[]): MotionViolation[];
  export function findRenderErrors(messages: string[]): MotionViolation[];
  ```

  Constantes : `BLANK_DEVIATION = 2`, `FROZEN_DIFFERENCE = 0.5`, `RENDER_ERROR = /THREE\.WebGLProgram|Shader Error|GL_INVALID|CONTEXT_LOST_WEBGL/u`.

- [ ] **Étape 1 : écrire les tests qui échouent**

```ts
const flat = Array.from({ length: 1024 }, () => 12);
const checker = Array.from({ length: 1024 }, (_, index) => (index % 2 === 0 ? 0 : 255));

it("measures spread and change", () => {
  expect(luminanceDeviation([0, 255])).toBe(127.5);
  expect(meanDifference([0, 10], [10, 0])).toBe(10);
});
it("flags a canvas that renders one flat colour", () => {
  expect(findBlankCanvases([{ canvas: "hero", progress: 0.5, luminance: flat }])).toEqual([
    { rule: "blank-canvas", canvas: "hero", detail: "deviation 0.00 at 50%" },
  ]);
  expect(findBlankCanvases([{ canvas: "hero", progress: 0, luminance: checker }])).toEqual([]);
});
it("flags an ambient canvas whose frames never change", () => {
  expect(findFrozenCanvases([{ canvas: "hero", first: checker, second: checker }])).toEqual([
    { rule: "frozen-canvas", canvas: "hero", detail: "mean difference 0.00 over 500 ms" },
  ]);
  const shifted = checker.map((value) => Math.abs(value - 10));
  expect(findFrozenCanvases([{ canvas: "hero", first: checker, second: shifted }])).toEqual([]);
});
it("reports WebGL and shader errors only", () => {
  const messages = [
    "THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false",
    "Download the React DevTools for a better development experience",
  ];
  expect(findRenderErrors(messages)).toEqual([
    { rule: "render-error", canvas: "page", detail: messages[0] },
  ]);
  expect(findRenderErrors([])).toEqual([]);
});
```

- [ ] **Étape 2 : lancer et voir l'échec.** `pnpm --filter @repo/design-audit test -- tests/motion.test.ts`. Attendu : FAIL, le module est introuvable.
- [ ] **Étape 3 : implémenter `src/motion.ts`** avec les signatures ci-dessus. Le détail affiche deux décimales et la progression en pourcentage arrondi.
- [ ] **Étape 4 : vérifier.** `pnpm --filter @repo/design-audit test:coverage`. Attendu : PASS, 100 % sur `src/motion.ts`.
- [ ] **Étape 5 : commit** `feat(design-audit): analyse canvas frames for blank, frozen and render errors`.

### Tâche 3 : paliers de qualité et `StageCanvas`

**Fichiers :**

- Créer : `packages/ui/src/lib/quality-tier.ts`, `packages/ui/src/scene/stage-canvas.tsx`, `packages/ui/tests/quality-tier.test.ts`, `packages/ui/tests/stage-canvas.test.tsx`

**Interfaces :**

- Produit :

  ```ts
  export type QualityTier = "light" | "full";
  export interface DeviceProfile { reducedMotion: boolean; webgl2: boolean; narrow: boolean; coarsePointer: boolean }
  export function tierFor(profile: DeviceProfile): QualityTier | null
  export function readDeviceProfile(): DeviceProfile // narrow = !matchMedia("(min-width: 48rem)").matches
  export const pixelRatio: Record<QualityTier, [number, number]> // light [1, 1.5], full [1, 2]
  // stage-canvas.tsx
  interface StageCanvasProps extends Omit<CanvasProps, "dpr" | "frameloop"> { tier: QualityTier }
  export function StageCanvas(props: StageCanvasProps): ReactElement
  ```

  `StageCanvas` règle `dpr={pixelRatio[tier]}`, `frameloop="never"` et `gl.antialias` à `tier === "full"`. Il fait avancer R3F depuis `gsap.ticker` (`advance(time * 1000)`) et cesse d'avancer quand le canvas sort de la fenêtre (IntersectionObserver).

- [ ] **Étape 1 : écrire les tests qui échouent**
  - `quality-tier.test.ts` (projet node) :
    - `tierFor` vaut `null` avec `reducedMotion: true`, et `null` avec `webgl2: false` ;
    - `"light"` avec `narrow` ou avec `coarsePointer` (pas de règle sur le nombre de cœurs : les runners CI en ont 4 et les téléphones récents 8, le critère ne distingue rien) ;
    - `"full"` avec `{ reducedMotion: false, webgl2: true, narrow: false, coarsePointer: false }`.
  - `stage-canvas.test.tsx` (navigateur) : une maille avec `useFrame` incrémente un compteur.
    - Dans la fenêtre, le compteur est > 0 après 500 ms, via le ticker GSAP.
    - Sous un espaceur de `300vh`, le compteur reste à 0 après 500 ms.
- [ ] **Étape 2 : lancer et voir l'échec.** `pnpm --filter @repo/ui test -- tests/quality-tier.test.ts tests/stage-canvas.test.tsx`. Attendu : FAIL.
- [ ] **Étape 3 : implémenter les deux fichiers.**
- [ ] **Étape 4 : relancer.** Attendu : PASS.
- [ ] **Étape 5 : commit** `feat(ui): add quality tiers and a ticker-driven stage canvas`.

### Tâche 4 : support générique `Stage`

**Fichiers :**

- Créer : `packages/ui/src/motion/stage.tsx`, `packages/ui/stories/stage.stories.tsx`, `packages/ui/stories/support/plain-scene.tsx` (une boîte neutre dans un `StageCanvas`, qui expose `data-tier`), `packages/ui/tests/stage.test.tsx`
- Modifier : `packages/ui/AGENTS.md` (ligne d'inventaire `motion/stage` `Stage`)

**Interfaces :**

- Consomme : `tierFor`, `readDeviceProfile`, `QualityTier` (tâche 3), `whenIdle` (`lib/idle.ts`).
- Produit :

  ```ts
  export interface SceneProps {
    tier: QualityTier;
    onReady: () => void;
  }
  interface StageProps {
    poster: ReactNode; // l'image fixe complète ; porte le nom accessible
    scene: (props: SceneProps) => ReactNode; // rend un composant lazy qui contient un StageCanvas
    ambient?: boolean; // la scène s'anime seule ; l'audit attend des frames qui changent
    className?: string;
  }
  export function Stage(props: StageProps): ReactElement;
  ```
  - **Racine** : `data-slot="stage"`, `data-stage="poster" | "live"`, `data-ambient` présent si `ambient`.
  - **Calques** : un poster dans le flux, et un calque de scène `absolute inset-0` `aria-hidden`, en fondu croisé `transition-opacity duration-500`.
  - **Déclencheurs** :
    1. idle ;
    2. profil, puis `tierFor` (si `null`, on s'arrête) ;
    3. la scène est à moins de 50 % de hauteur de fenêtre (IntersectionObserver `rootMargin: "50% 0px"`) ;
  - **Progression du scroll** : `Stage` n'en sait rien. Le composant d'effet garde un objet `{ value }` que sa chorégraphie `ScrollScene` anime, et le passe à sa scène dans la fonction `scene`. Le rendu par fonction suffit, le support n'a pas besoin de canal dédié. 4. pour `light` seulement, première interaction parmi `pointerdown`, `keydown`, `wheel`, `touchstart` ou `scroll`, écoutée une fois sur `window`.
  - **Retour au poster** quand l'événement `webglcontextlost` est capturé (écouteur en phase de capture sur la racine) ou quand `prefers-reduced-motion` passe à `reduce`.

- [ ] **Étape 1 : écrire les tests qui échouent** (`stage.test.tsx`, avec `preferReducedMotion` et `allowMotion` de `tests/support/reduced-motion.ts`) :
  - En mouvement réduit : poster visible avec son nom, aucun `canvas` après l'idle, `data-stage="poster"`.
  - Desktop 1280×800 : `data-stage` atteint `"live"` (attente jusqu'à 15 s), `data-tier="full"`.
  - Téléphone 390×844 : aucun `canvas` après l'idle. Après `window.dispatchEvent(new Event("pointerdown"))`, `data-stage` atteint `"live"` avec `data-tier="light"`.
  - Une scène sous un espaceur de `300vh` : aucun `canvas` après l'idle.
  - `getContext("webgl2")` remplacé pour renvoyer `null` : reste en `"poster"`, aucun `canvas`.
  - Une fois `"live"`, un `new Event("webglcontextlost")` envoyé sur le canvas ramène `data-stage` à `"poster"`.
  - Une fois `"live"`, l'appel à `preferReducedMotion()` ramène `"poster"` et retire le `canvas`.
  - `ambient` pose `data-ambient`.
- [ ] **Étape 2 : lancer et voir l'échec.** `pnpm --filter @repo/ui test -- tests/stage.test.tsx`. Attendu : FAIL.
- [ ] **Étape 3 : implémenter `stage.tsx`** avec `cva` et `cn`. L'export de paquet `./motion/*` le couvre déjà.
- [ ] **Étape 4 : écrire la story** `stage.stories.tsx`. Son `play` vérifie que le poster a son nom accessible ; le contrôle a11y est automatique.
- [ ] **Étape 5 : vérifier.** `pnpm --filter @repo/ui test:coverage`. Attendu : PASS, ≥ 90 %.
- [ ] **Étape 6 : ajouter la ligne d'inventaire et commit** `feat(ui): add a generic stage host with tiers and fallbacks`.

### Tâche 5 : `BlockStage` sur `Stage`

**Fichiers :**

- Modifier : `packages/ui/src/motion/block-stage.tsx`, `packages/ui/src/scene/block-scene.tsx`, `packages/ui/tests/block-stage.test.tsx`, `packages/ui/AGENTS.md` (ligne `BlockStage`)

**Interfaces :**

- Consomme : `Stage`, `SceneProps` (tâche 4), `StageCanvas` (tâche 3).
- Produit : `BlockStage({ blocks, label, grain, className })`, une API inchangée.
  - `BlockScene` prend `{ blocks, grain, tier, onReady, className }` et rend `StageCanvas` avec `flat` et `shadows={tier === "full"}`.
  - Les appels `invalidate` disparaissent : le ticker rend chaque frame.

- [ ] **Étape 1 : réécrire le test « keeps the drawing on phones »** en « waits for a first interaction on phones, then lifts the drawing into a light scene ». Il suit le même schéma que le test téléphone de la tâche 4.
- [ ] **Étape 2 : lancer et voir l'échec.** `pnpm --filter @repo/ui test -- tests/block-stage.test.tsx`. Attendu : FAIL sur le nouveau cas.
- [ ] **Étape 3 : porter les deux fichiers.** Le poster est `IsoBlocks` (son animation d'entrée GSAP reste dans `BlockStage`). La scène est `(scene) => <LazyBlockScene {...scene} blocks={blocks} grain={grain} />`.
- [ ] **Étape 4 : vérifier.** Lancer `pnpm --filter @repo/ui test:coverage`, puis `pnpm build` et `pnpm --filter @repo/web lighthouse`. Attendu : PASS. La perf mobile de `/` doit rester ≥ 0.95 : la scène mobile attend une interaction.
- [ ] **Étape 5 : mettre à jour la ligne d'inventaire, puis commit** `refactor(ui): build BlockStage on the stage host, live on phones`.

### Tâche 6 : contrôle du mouvement en e2e

**Fichiers :**

- Modifier : `packages/design-audit/src/collect.ts` (ajout de `collectLuminance`)
- Créer : `apps/web/e2e/motion-audit.spec.ts`

**Interfaces :**

- Consomme : `findBlankCanvases`, `findFrozenCanvases`, `findRenderErrors`, `CanvasFrame`, `AmbientPair` (tâche 2) ; le contrat `data-slot="stage"`, `data-stage` et `data-ambient` (tâche 4).
- Produit :

  ```ts
  export async function collectLuminance({
    png,
    size,
  }: {
    png: string;
    size: number;
  }): Promise<number[]>;
  ```
  - S'exécute dans la page : `fetch` d'une URL `data:`, puis `createImageBitmap` redimensionné à `size×size`, puis `OffscreenCanvas` 2D.
  - Luminance = `0.2126 r + 0.7152 g + 0.0722 b`.

- [ ] **Étape 1 : écrire `motion-audit.spec.ts`**, avec deux `describe` par route.
  - **Mouvement autorisé** (`reducedMotion: "no-preference"`) :
    1. Écouter `console` (error et warning) et `pageerror`.
    2. Aller sur la route, puis faire `window.scrollBy(0, 1)` pour déclencher le palier `light`.
    3. Attendre que chaque `[data-slot=stage]` dans la fenêtre soit `live`.
    4. Aux progressions `[0, 0.25, 0.5, 0.75, 1]` : scroller à la fraction voulue de `scrollHeight - innerHeight`, attendre deux `requestAnimationFrame` puis 300 ms. Capturer chaque canvas `live` visible, le passer à `collectLuminance` (taille 32), et joindre la capture de la fenêtre avec `testInfo.attach("frame-<progress>")`.
    5. Pour chaque stage `live` qui porte `data-ambient` : prendre deux captures à 500 ms d'écart.
    6. Consigner le renderer (`WEBGL_debug_renderer_info`) dans `testInfo.annotations`.
    7. Asserter que `[...findBlankCanvases, ...findFrozenCanvases, ...findRenderErrors]` vaut `[]`.
  - **Mouvement réduit** : après l'idle (`requestIdleCallback`, timeout de 2000 ms), `page.locator("canvas")` a un compte de 0.
- [ ] **Étape 2 : lancer et voir l'échec.** `pnpm test:e2e -- motion-audit`. Attendu : FAIL tant que `collectLuminance` n'existe pas.
- [ ] **Étape 3 : implémenter `collectLuminance`** dans `collect.ts`, en gardant les helpers à l'intérieur de la fonction, comme les collecteurs existants.
- [ ] **Étape 4 : vérifier.** Relancer `pnpm test:e2e`. Attendu : PASS sur les projets mobile, tablet et desktop ; les deux `BlockStage` de `/` ne sont pas vides.
- [ ] **Étape 5 : commit** `test(web): audit live canvases for blank, frozen and render errors`.

### Tâche 7 : Lighthouse sur mobile et desktop pour chaque route

**Fichiers :**

- Modifier : `apps/web/lighthouserc.json` (`outputDir` : `.lighthouseci/mobile`), `apps/web/package.json` (`"lighthouse": "lhci autorun && lhci autorun --config=lighthouserc.desktop.json"`)
- Créer : `apps/web/lighthouserc.desktop.json` (même contenu, plus `collect.settings.preset: "desktop"` et `outputDir: ".lighthouseci/desktop"`), `apps/web/tests/lighthouse-config.test.ts`

- [ ] **Étape 1 : écrire le test qui échoue.** Il lit les deux JSON et vérifie que :
  - `ci.collect.url` vaut `routes.map((route) => \`http://localhost:3200${route}\`)` dans les deux fichiers ;
  - `desktop.ci.collect.settings.preset` vaut `"desktop"` ;
  - `desktop.ci.assert` est égal à `mobile.ci.assert`.
- [ ] **Étape 2 : lancer et voir l'échec.** `pnpm --filter @repo/web test -- tests/lighthouse-config.test.ts`. Attendu : FAIL, le fichier desktop est absent.
- [ ] **Étape 3 : créer et modifier les fichiers.** `repository-facts` lit toujours `lighthouserc.json`, et son test doit rester vert.
- [ ] **Étape 4 : vérifier.** `pnpm --filter @repo/web test`, puis `pnpm build` et `pnpm --filter @repo/web lighthouse`. Attendu : PASS sur les deux passes.
- [ ] **Étape 5 : mettre à jour la ligne `lighthouse` du tableau de commandes de `AGENTS.md`, puis commit** `ci(web): hold Lighthouse budgets on mobile and desktop for every route`.

### Tâche 8 : MCP et permissions

**Fichiers :**

- Modifier : `.mcp.json`, `.claude/settings.json`

- [ ] **Étape 1 : mettre à jour `.mcp.json`.**
  - `playwright.args` devient `["-y", "@playwright/mcp@0.0.84", "--caps=devtools"]`.
  - Ajouter `"chrome-devtools": { "command": "npx", "args": ["-y", "chrome-devtools-mcp@1.12.0", "--no-usage-statistics"] }`.
  - Ajouter `"blender": { "command": "uvx", "args": ["mcp-for-blender@2.2.7"], "env": { "DISABLE_TELEMETRY": "true", "BLENDER_MCP_SAFE_MODE": "1" } }`.
- [ ] **Étape 2 : ajouter à `permissions.allow`** :
  - `"Bash(ffmpeg *)"`, `"Bash(ffprobe *)"`, `"Bash(avifenc *)"`, `"Bash(cwebp *)"`, `"Bash(blender -b *)"` ;
  - `"Bash(pnpm test:e2e*)"`, `"Bash(pnpm --filter @repo/web lighthouse)"` ;
  - `"mcp__magnific"`, `"mcp__playwright"`, `"mcp__chrome-devtools"`, `"mcp__blender"`.
- [ ] **Étape 3 : vérifier.**
  - `node -e "JSON.parse(require('fs').readFileSync('.mcp.json'));JSON.parse(require('fs').readFileSync('.claude/settings.json'))"` passe.
  - `npx -y @playwright/mcp@0.0.84 --help` liste `--caps`.
  - `npx -y chrome-devtools-mcp@1.12.0 --help` sort sans erreur.
- [ ] **Étape 4 : commit** `chore(agents): upgrade Playwright MCP, add Chrome DevTools MCP and arsenal permissions`.

### Tâche 9 : importer les 8 skills three.js

**Fichiers :**

- Créer : `.claude/skills/threejs-{shaders,postprocessing,materials,textures,lighting,geometry,interaction,fundamentals}/`
- Modifier : `skills-lock.json`, `AGENTS.md` (ligne « Known conflicts »)

- [ ] **Étape 1 : installer.** Vérifier les noms avec `npx -y skills@latest add CloudAI-X/threejs-skills --list`. Installer ensuite les 8 avec `--skill <nom>`, `--agent claude-code`, `--copy` et `-y`, comme les 5 déjà présents : dossiers copiés et entrées dans `skills-lock.json`.
- [ ] **Étape 2 : vérifier.** `skills-lock.json` compte 13 entrées `CloudAI-X/threejs-skills`, et chaque `.claude/skills/<nom>/SKILL.md` existe.
- [ ] **Étape 3 : compléter « Known conflicts » dans `AGENTS.md`.** Les renderers et `EffectComposer` en three.js pur que montrent ces skills cèdent la place à `StageCanvas` et `@react-three/postprocessing`, et les exemples de rendu en continu à l'horloge du ticker GSAP.
- [ ] **Étape 4 : vérifier puis commit.** Lancer `pnpm format:check && pnpm knip`, puis commit `chore(skills): vendor the remaining three.js skills`.

**Méthode commune aux tâches 10 à 14 (skills).**

- **RED** : un sous-agent neuf reçoit le scénario sans le skill. Noter les critères qu'il manque.
- **GREEN** : écrire le skill, puis donner le même scénario à un nouveau sous-agent, avec le skill. Il doit remplir tous les critères.
- **Refactor** : corriger les règles qu'il a contournées, puis relancer.
- **Vérification** : `pnpm format:check`.
- **Rédaction** : skills en anglais, règles génériques. La description du frontmatter énonce les déclencheurs.

### Tâche 10 : skill `shader-craft`

**Fichiers :** créer `.claude/skills/shader-craft/SKILL.md`.

- [ ] **Étape 1 : RED.** Scénario : « Un éditeur de cybersécurité veut un hero où un bouclier de chaleur déforme le tableau de bord derrière lui. Décris l'implémentation (fichiers, uniforms, paliers, repli) sans écrire le code. »

  Critères :
  - effet = composant `packages/ui/src/motion/<effet>-stage.tsx` qui compose `Stage`, avec une scène lazy `packages/ui/src/scene/<effet>-scene.tsx` dans `StageCanvas` ;
  - GLSL dans le fichier de scène ;
  - uniforms `uTime` (ticker), `uProgress` (chorégraphie `ScrollScene`) et `uPointer` lissé avec `gsap.quickTo` ;
  - couleurs lues dans les tokens (`lib/css-color.ts`) ;
  - budget par palier ;
  - poster capturé ;
  - contraste du texte garanti ;
  - aucun code LYGIA ni Shadertoy ;
  - mesure de perf.

- [ ] **Étape 2 : écrire le skill.** Sections :
  1. **Quand** : un phénomène de surface, de lumière ou de matière ; les looks stylisés.
  2. **Où vit le code** : le contrat ci-dessus.
  3. **Uniforms et horloge.**
  4. **Recettes** : bruit et FBM, distorsion de domaine, SDF et raymarching (pas par palier : 48 en `light`, 96 en `full`), feu, plasma, dispersion chromatique, rayons de lumière (flou radial), grain.
  5. **Post-traitement** avec `@react-three/postprocessing` : effets fusionnés et classe `Effect` sur mesure pour l'ASCII (atlas de glyphes dessiné au runtime dans la police des tokens), le tramage Bayer et la demi-teinte. En `light` : pas de bloom mipmap, demi-résolution.
  6. **Perf** : renvoi aux seuils globaux.
  7. **Licences** : porter seulement du MIT ou de l'Apache (paper-design/shaders, exemples three.js) avec un commentaire d'attribution.
  8. **À éviter** : le blob en dégradé générique, plus d'un shader plein écran par fenêtre, du texte sur l'effet sans voile de contraste.
- [ ] **Étape 3 : GREEN puis refactor.** Tous les critères sont remplis.
- [ ] **Étape 4 : commit** `docs(skills): add shader-craft`.

### Tâche 11 : skill `gpu-particles`

**Fichiers :** créer `.claude/skills/gpu-particles/SKILL.md`.

- [ ] **Étape 1 : RED.** Scénario : « Une startup de robotique veut son logo assemblé en particules, qui se transforme en bras robotique puis en atelier sur trois scènes de scroll, et réagit au pointeur. »

  Critères :
  - formes cibles échantillonnées hors ligne (`MeshSurfaceSampler` dans un script Node du projet) et stockées en `Float32Array` binaire dans `apps/web/public/media/<feature>/` ;
  - simulation `GPUComputationRenderer` (position et vitesse) ;
  - forces : attraction vers la forme mélangée par `uProgress`, bruit curl, répulsion du pointeur, amortissement ;
  - rendu `Points` avec un shader qui lit la texture de position ;
  - comptes 32 768 et 131 072 ;
  - tactile : point de contact, ou pas de répulsion ;
  - poster capturé ;
  - pas de simulation CPU au-delà de 5 000 points.

- [ ] **Étape 2 : écrire le skill.** Sections :
  1. Quand des particules expliquent une transformation ou un assemblage.
  2. Préparer les formes.
  3. Simulation.
  4. Rendu.
  5. Pilotage par le scroll et le pointeur.
  6. Paliers.
  7. Les splats avec Spark quand un scan doit garder ses couleurs (renvoi à `scene-3d`).
  8. À éviter : la sphère de particules sans propos, l'échantillonnage au runtime sur le thread principal.
- [ ] **Étape 3 : GREEN puis refactor.**
- [ ] **Étape 4 : commit** `docs(skills): add gpu-particles`.

### Tâche 12 : skill `cinematic-footage`

**Fichiers :** créer `.claude/skills/cinematic-footage/SKILL.md`.

- [ ] **Étape 1 : RED.** Scénario : « Un datacenter sous-marin : le hero plonge depuis les baies de serveurs dans l'océan puis remonte dans les nuages au scroll. »

  Critères :
  - **Modèle** : choisi depuis `video_models_list` (champ `agentRecommendation`, jamais de mémoire).
  - **Plans** : enchaînés en prenant la dernière image d'un plan comme première image du suivant (`video_extract_frames`) ; boucles avec des images de début et de fin identiques, puis SSIM ≥ 0.95.
  - **Contrôle et budget** : relecture avec `video_view_frames` et `video_analyze` ; brouillons avant la version finale ; compte tenu avec `simulate_cost` sous le plafond de 30 000.
  - **Encodage** : commandes ffmpeg, avifenc et cwebp ; budgets de séquence et chargement du grossier au fin.
  - **Rendu** : images rendues comme texture dans `StageCanvas`, avec des fondus de seuil de bruit entre plans.
  - **Fichiers** : masters dans `assets/source/<feature>/<slot>/`, images dans `apps/web/public/media/<feature>/<slot>/NNNN.avif`.
  - Aucun texte dans la vidéo.

- [ ] **Étape 2 : écrire le skill.** Sections :
  1. Quand.
  2. Générer : modèles, images clés, enchaînement, boucles, contrôle.
  3. Encoder, avec les commandes de la spec et la vérification `avifenc --version` (sinon `brew install libavif webp`).
  4. Charger.
  5. Rendre : séquence en texture ; H.264 tout-intra via `VideoTexture` au-delà de 150 images.
  6. Relief 2.5D avec `images_depth_map`, décalage ≤ 3 %, sujet détouré et fond comblé.
  7. Accessibilité.
- [ ] **Étape 3 : GREEN puis refactor.**
- [ ] **Étape 4 : commit** `docs(skills): add cinematic-footage`.

### Tâche 13 : skills existants en mode autonome, et mise à jour de `scene-3d`

**Fichiers :** modifier `.claude/skills/scene-3d/SKILL.md`, `.claude/skills/scroll-storytelling/SKILL.md`, `.claude/skills/asset-production/SKILL.md`, `.claude/skills/design-inspiration/SKILL.md` et `.claude/skills/landing-page/SKILL.md`.

- [ ] **Étape 1 : RED.** Scénario : « En mode autonome, une page coûte déjà 24 000 crédits et il faut un plan vidéo à 7 900 ; et ensuite un modèle 3D à 580 sur une autre page à 2 000. »

  Critères :
  - arrêt et question pour le premier cas, poursuite sans question pour le second ;
  - aucun ADR pour un composant vidéo ;
  - storyboard et direction consignés dans `DESIGN.md`, sans attente.

- [ ] **Étape 2 : modifier les cinq skills.**
  - **`scene-3d`** :
    - le contrat `Stage` et `StageCanvas` remplace la référence à `BlockStage` ;
    - les paliers et le direct sur téléphone ;
    - drei autorisé par l'ADR 0024 ;
    - HDRI Poly Haven ;
    - eau (`Water`, cible de reflet 256 en `light`, 512 en `full`) ;
    - bloom ; rayons de lumière seulement sur desktop ;
    - splats avec Spark, entraînés par Brush sur une vidéo Magnific en tour complet ;
    - MCP Blender (mode sûr) pour construire, nettoyer et rendre ; Blender en ligne de commande pour les lots, scripts par projet dans `assets/3d/source/scripts/` ; installation du module complémentaire par machine ;
    - poster = capture Playwright de la première frame, convertie en AVIF.
  - **`scroll-storytelling`** :
    - une section typographie cinétique : SplitText (`autoSplit`, `onSplit`, `aria: "auto"`), cycle de mots avec flou réservé aux textes courts, ScrambleText, révélations par masque, texte final en mouvement réduit ;
    - la validation du storyboard devient consignée dans `DESIGN.md` en mode autonome.
  - **`asset-production`** :
    - mode autonome : les portes 1 et 3 deviennent des autocontrôles ;
    - porte 2 : on continue tant que le total de la page (dépensé + devis) reste ≤ 30 000 crédits, avec un registre courant dans le relevé de provenance ; au-delà, arrêt ;
    - le premier composant vidéo est couvert par l'ADR 0024.
  - **`design-inspiration`** : en mode autonome, l'agent choisit lui-même la direction et consigne ses raisons.
  - **`landing-page`** : « montrer chaque artefact » devient « le consigner et continuer » en mode autonome.
- [ ] **Étape 3 : GREEN puis refactor.**
- [ ] **Étape 4 : commit** `docs(skills): run existing skills in autonomous mode, extend scene-3d`.

### Tâche 14 : `motion-review`, `design-reviewer` et le chef d'orchestre `signature-experience`

**Fichiers :**

- Créer : `.claude/skills/motion-review/SKILL.md`, `.claude/skills/signature-experience/SKILL.md`
- Modifier : `.claude/agents/design-reviewer.md`, `AGENTS.md` (routage des skills, définition de fini)

- [ ] **Étape 1 : écrire `motion-review`.**
  - **Capture** :
    - pièces jointes de l'audit e2e ;
    - vidéo Playwright MCP pendant un scroll scripté (vérifier les noms exacts des outils avec ToolSearch après la tâche 8) ;
    - planche contact `ffmpeg -i rec.webm -vf "fps=4,scale=480:-2,tile=4x4:padding=4" -frames:v 1 -update 1 sheet.png` ;
    - trace Chrome DevTools avec CPU ralenti 4× sur le Mac ;
    - captures en mouvement réduit et à 390×844.
  - **Grille** (1 à 5, réussi si chaque critère ≥ 4) : lisibilité du message, une idée signature claire, profondeur et lumière, qualité des courbes et des arrivées, vie au repos, réponse au pointeur, cohérence avec `DESIGN.md`, originalité (liste de clichés interdits : blob en dégradé, sphère de particules générique, orbe lumineux de hero, bento), perf (seuils globaux), qualité du repli.
  - **Références** : comparer uniquement aux références du projet (liens dans `DESIGN.md`, captures dans `.context/`, jamais versionnées). Le skill ne contient aucune image ni capture HorizonX ; la grille décrit le niveau attendu avec des mots.
  - **Boucle** : corriger et recapturer, 5 itérations au plus, puis rapport.
- [ ] **Étape 2 : étendre `design-reviewer`.** Ajouter les outils vidéo et trace, et la grille de `motion-review` à l'étape « Motion ».
- [ ] **Étape 3 : RED pour `signature-experience`.** Scénario : « Brief : "un parfum qui naît d'un lotus au lever du jour". Déroule le plan complet en mode autonome sans rien générer. »

  Critères :
  - l'ordre : contexte, direction, au moins 3 concepts signature avec élimination des clichés, choix de la famille de technique, storyboard, plan de visuels avec devis, code, puis `motion-review`, `design-reviewer`, `pnpm check`, `pnpm test:e2e` et Lighthouse mobile et desktop ;
  - les deux arrêts durs et rien d'autre ;
  - un journal des décisions dans `DESIGN.md` ;
  - les livrables : page, enregistrement, planche contact, rapports Lighthouse.

- [ ] **Étape 4 : écrire `signature-experience`.** Table de choix de technique, selon ce que le mouvement explique :

  | Ce que le mouvement explique      | Technique                                      |
  | --------------------------------- | ---------------------------------------------- |
  | Matière, énergie                  | `shader-craft`                                 |
  | Transformation, assemblage        | `gpu-particles`                                |
  | Lieu réel, produit dans la nature | `cinematic-footage`                            |
  | Objet ou espace à inspecter       | `scene-3d`                                     |
  | Ambiance data ou IA stylisée      | looks de `shader-craft`                        |
  | Récit porté par le texte          | typographie cinétique de `scroll-storytelling` |

  Règles d'autonomie, boucle qualité, livrables (enregistrements et planches dans `.context/`).

- [ ] **Étape 5 : GREEN puis refactor** sur le scénario de l'étape 3.
- [ ] **Étape 6 : mettre à jour `AGENTS.md`.**
  - Routage :
    - « Premium animated page from a brief » → `signature-experience` ;
    - « Shader or post-processing look » → `shader-craft`, `threejs-shaders`, `threejs-postprocessing` ;
    - « Particles » → `gpu-particles` ;
    - « AI footage in a scroll » → `cinematic-footage`, `asset-production` ;
    - « Review motion » → `motion-review`, puis l'agent `design-reviewer`.
  - Définition de fini : l'audit du mouvement passe, Lighthouse passe sur mobile et desktop, et les scènes signature passent `motion-review`.
- [ ] **Étape 7 : vérifier puis commit.** Lancer `pnpm format:check`, puis commit `docs(skills): add motion-review and the signature-experience orchestrator`.

### Tâche 15 : vérification finale

- [ ] **Étape 1 : vérifier le dépôt.** `pnpm check`, puis `pnpm test:e2e`, puis `pnpm build && pnpm --filter @repo/web lighthouse`. Attendu : tout PASS.
- [ ] **Étape 2 : relire `/`.** Lancer l'agent `design-reviewer` sur `/` (desktop et mobile), avec la grille `motion-review`. Corriger ce qui est bloquant.
- [ ] **Étape 3 : vérifier que rien d'interdit n'est entré dans le dépôt.**
  - `git diff origin/main --stat` ne contient aucun asset, aucun effet ni aucune page de démo.
  - `rg -n "lygia|shadertoy" .claude/skills packages` ne remonte que les règles d'interdiction.

### Tâche 16 : banc d'essai

- [ ] **Étape 1 : préparer les runs.** Demander à l'utilisateur ses 3 briefs inédits, puis créer 3 workspaces Conductor neufs depuis la branche.
- [ ] **Étape 2 : lancer.** Dans chaque workspace, lancer `signature-experience` avec le brief seul. N'intervenir qu'aux deux arrêts durs.
- [ ] **Étape 3 : rassembler les livrables** dans `.context/benchmark/<brief>/` : page exportée, enregistrement, planche contact, rapports Lighthouse, journal des décisions, crédits dépensés.
- [ ] **Étape 4 : présenter la comparaison** à côté des pages HorizonX. Vérifier aussi que les 3 pages n'utilisent pas la même technique signature.
- [ ] **Étape 5 : améliorer les skills.** Chaque échec devient une règle générique dans le skill concerné (méthode RED/GREEN), dans une PR séparée. Les pages du banc ne sont pas fusionnées.
