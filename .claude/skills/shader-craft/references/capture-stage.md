# Stage capture script

The poster recipe of `SKILL.md` §7 as a project script. It typechecks, lints and formats as written in this repository, and was run against a production build: two runs give identical images (SSIM 1.000), transparent canvases give transparent PNGs.

Install it once per project:

- Save it as `apps/web/scripts/capture-stage.ts`.
- Add `"capture-stage": "node scripts/capture-stage.ts"` to the `scripts` of `apps/web/package.json`: knip then counts the file as an entry. Living in `apps/web`, the script resolves `@playwright/test` from the package that depends on it.
- Add `"scripts"` to the `include` of `apps/web/tsconfig.json`, so `pnpm typecheck` covers it.

Run it against the local production server only (`exec` runs in `apps/web` and passes every argument through). The block waits for the server before capturing (and gives up if the server stops or after two minutes), then stops it at the end; it runs the same under zsh and bash:

```bash
pnpm --filter @repo/web build
pnpm --filter @repo/web start --port 3100 &
server=$!
waited=0
until curl -sf http://localhost:3100/ > /dev/null; do
  kill -0 "$server" 2> /dev/null || exit 1                # the server stopped: nothing to wait for
  [ "$((waited += 1))" -le 120 ] || { kill "$server"; exit 1; }   # two minutes at most
  sleep 1
done
pnpm --filter @repo/web exec node scripts/capture-stage.ts --url http://localhost:3100/<route> --stage 0 \
  --width 1440 --height 900 --output ../../assets/source/<feature>/<slot>/poster.png
# a still plate inside a held ScrollScene: scroll there, then let the scrub settle in fake time
pnpm --filter @repo/web exec node scripts/capture-stage.ts --url http://localhost:3100/<route> \
  --scroll 2400 --advance 1000 --output ../../assets/source/<feature>/<slot>/still-2.png
kill "$server"
```

How it works: `page.clock` fakes `requestAnimationFrame`, timers and `performance.now`, so the GSAP ticker only moves when the script steps it. The script steps one 16 ms frame at a time, with real time in between for the lazy chunk and the WebGL context, until the stage reports `data-stage="live"`: the scene has then drawn exactly one frame, its first, and stays on it. The style hides everything but the canvas and cancels the crossfade.

```ts
import { parseArgs } from "node:util";

import { chromium, type Locator, type Page } from "@playwright/test";

/* One gsap ticker frame of fake time: the scene draws at most once per step. */
const FRAME_MS = 16;
/* Real time left to the lazy chunk and the WebGL context between two fake frames. */
const LOAD_PAUSE_MS = 20;
const MAX_FRAMES = 600;
const CANVAS_ONLY =
  "* { visibility: hidden !important; opacity: 1 !important; transition: none !important } html, body { background: none !important } canvas { visibility: visible !important }";

interface Capture {
  url: string;
  stage: number;
  width: number;
  height: number;
  scroll: number | undefined;
  advance: number;
  output: string;
}

function readCapture(): Capture {
  const { values } = parseArgs({
    options: {
      url: { type: "string" },
      stage: { type: "string", default: "0" },
      width: { type: "string", default: "1440" },
      height: { type: "string", default: "900" },
      scroll: { type: "string" },
      advance: { type: "string", default: "0" },
      output: { type: "string" },
    },
  });
  if (values.url === undefined || values.output === undefined) {
    throw new Error(
      "Usage: capture-stage --url <local page> --output <png> [--stage 0] [--scroll px --advance ms]",
    );
  }
  return {
    url: values.url,
    stage: Number(values.stage),
    width: Number(values.width),
    height: Number(values.height),
    scroll: values.scroll === undefined ? undefined : Number(values.scroll),
    advance: Number(values.advance),
    output: values.output,
  };
}

/* Fake time only moves when stepped, so the scene stops on the frame that made it live: its first frame. */
async function stepUntilLive(page: Page, stage: Locator): Promise<void> {
  for (let frame = 0; frame < MAX_FRAMES; frame += 1) {
    // oxlint-disable-next-line no-await-in-loop -- each step must land before the next one is taken.
    if ((await stage.getAttribute("data-stage")) === "live") {
      return;
    }
    // oxlint-disable-next-line no-await-in-loop -- same stepping: one fake frame at a time.
    await page.clock.runFor(FRAME_MS);
    // oxlint-disable-next-line no-await-in-loop -- same stepping: real time for loading between frames.
    await page.waitForTimeout(LOAD_PAUSE_MS);
  }
  throw new Error("The stage never went live: check reduced motion, WebGL2 and the console.");
}

async function capture({
  url,
  stage,
  width,
  height,
  scroll,
  advance,
  output,
}: Capture): Promise<void> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await page.clock.install();
    await page.goto(url);
    await page.clock.pauseAt(Date.now() + 1000);
    const target = page.locator("[data-slot=stage]").nth(stage);
    await target.scrollIntoViewIfNeeded();
    await stepUntilLive(page, target);
    if (scroll !== undefined) {
      await page.evaluate((top) => {
        window.scrollTo(0, top);
      }, scroll);
      await page.clock.runFor(advance);
    }
    /* A transparent canvas gives a transparent poster: the page background shows through both alike. */
    await target
      .locator("canvas")
      .screenshot({ path: output, scale: "device", style: CANVAS_ONLY, omitBackground: true });
  } finally {
    await browser.close();
  }
}

await capture(readCapture());
```
