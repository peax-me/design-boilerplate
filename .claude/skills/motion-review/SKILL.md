---
name: motion-review
description: Capture and judge an animated page the way a visitor sees it. Captures are the e2e frame attachments, a Playwright MCP video of a scripted scroll with its ffmpeg contact sheet and arrival strips, boundary strips from screenshots taken during a scripted wheel scroll with a dense pass over sweeps and settled shots of every seam, a check that every stage goes live during a continuous scroll, frame times and a Chrome DevTools trace with the CPU slowed 4× on the real GPU (95th percentile ≤ 20 ms, long animation frames ≤ 300 ms until the first window's stages are live and ≤ 100 ms after, layout shift ≤ 0.1), reduced motion and a 390×844 phone. The judgement is an eleven-criterion grid scored 1 to 5 against the project's own references, then fix and re-capture, five rounds at most. Use after building or changing a scroll scene, a transition, a WebGL stage, a shader, particles, footage or a 3D scene, when a page "feels off", or when asked to review, record or measure motion.
---

# Motion review

A still cannot tell a calm canvas from a frozen one, a good ease from a linear one, or a smooth scroll from a stutter. This skill records the motion, measures it on a real GPU, and scores it against a written grid. `pnpm test:e2e` already fails a blank or frozen canvas, a WebGL or shader error and a canvas under reduced motion (ADR-0026). This skill judges what the audit cannot: whether the motion is good. The `design-reviewer` agent uses the same grid in its Motion step.

## 1. Before capturing

- **Read what the page promised.** `DESIGN.md`: the direction, its do and don't, the References board, and under `## Page: <name>` the `### Storyboard`: what each scene explains (`Why`), its length, its final state, whether its stage is ambient and what the pointer does. Then `## Motion language` and the page's `### Transitions`, which the polish checklist of `motion-design` §7 turns into evidence for criteria 4, 7, 10 and 11. The grid judges the page against these, not against taste.
- **References are the project's own.** Compare only with the links on the `DESIGN.md` board and their captures in `.context/` (`design-inspiration`), on the principle the board says to take from each one. Those captures are never versioned, and this skill holds no image: the grid states the expected level in words. Comparing with third-party templates side by side is the user's judgement, never an input here, because copying their look is the failure the grid looks for.
- **Production build, local server.** Never `pnpm dev`: development mode runs effects twice, ships unminified React and HMR, so its frame times and console are not the shipped page's. A local Conductor workspace owns ten ports from `CONDUCTOR_PORT`, and the dev server, Storybook and e2e take the first three (ADR 0017). Take the fourth, or 3003 outside Conductor. Write no `--` before `--port`: pnpm passes it on, and `next start` takes it for a directory. Wait with the bounded loop of `shader-craft` `references/capture-stage.md`, and stop only the server you started:

  ```bash
  port=$(( ${CONDUCTOR_PORT:-3000} + 3 ))
  pnpm --filter @repo/web build
  pnpm --filter @repo/web start --port "$port" &
  server=$!
  # … wait for http://localhost:$port/ as capture-stage.md does, capture, then:
  kill "$server"
  ```
- **Page scripts only against that server.** `browser_evaluate` and `evaluate_script` run any JavaScript in the page. Permissions allow both tools wholesale and cannot filter by URL (ADR-0028), so the rule lives here: never on a third-party URL. The snippets below throw outside `localhost`.
- **One folder per round:** `.context/motion-review/<page>/round-<n>/`. `.context/` is gitignored. Recordings, sheets and traces are heavy and can be regenerated, so they are never versioned.

## 2. Capture

Every round captures §2.1 to §2.5. A round after a small fix may skip what the fix cannot touch, but never the measurements.

### 2.1 E2E frames

The motion audit attaches one viewport screenshot per scroll progression and project (`frame-<progress>`), rendered on SwiftShader. Use them for composition and for contrast under the copy (`shader-craft` §6) on mobile, tablet and desktop, never for smoothness. Body attachments stay in memory unless a reporter writes them, so run the audit with the JSON reporter and decode them:

```bash
dir=.context/motion-review/<page>/round-<n>
E2E_PORT=<port> PLAYWRIGHT_JSON_OUTPUT_FILE=$PWD/$dir/e2e.json \
  pnpm --filter @repo/web exec playwright test e2e/motion-audit.spec.ts --reporter=list,json
mkdir -p "$dir/e2e"
jq -r '.. | objects | select(has("specs")) | .title as $suite | .specs[].tests[] | .projectName as $project
  | .results[-1].attachments[] | select(.name | startswith("frame-"))
  | "\($project)\($suite | ascii_downcase | gsub("[^a-z0-9]+"; "-"))-\(.name).png \(.body)"' "$dir/e2e.json" |
  while read -r file body; do printf '%s' "$body" | base64 --decode > "$dir/e2e/$file"; done
```

Run it from the repository root after the build. With `E2E_PORT` set to your server's port, Playwright reuses that server.

### 2.2 Recordings (Playwright MCP)

One clip per condition, so that each sheet shows one thing: `scroll-desktop` at 1440×900 (`full` tier), `scroll-phone` at 390×844 (`light` tier, since a narrow screen selects it), and `pointer-desktop`. For each:

1. `mcp__playwright__browser_resize` to the size, `mcp__playwright__browser_emulate_media` with `reducedMotion: "no-preference"` and the page's scheme, then `mcp__playwright__browser_navigate` to `http://localhost:<port>/<route>`.
2. `mcp__playwright__browser_start_video` with `filename: "<dir>/scroll-desktop.webm"` (relative to the workspace root) and `size` equal to the viewport. Keep the default 25 fps. Leave `cursor` off, because it paces every action by 800 ms and draws over the page.
3. `mcp__playwright__browser_evaluate` with the scroll snippet below, then `mcp__playwright__browser_stop_video` immediately: every call in between is idle footage.

Record one clip at a time, from one process: two recordings against one server share its CPU and overwrite each other's files, and a background shell that starts children with `&` leaves them running.

Never call `browser_video_chapter` or `browser_video_show_actions` while recording. A chapter is a full-screen card on a blurred backdrop, and action callouts draw on the page. Both land in the sheet as if the page drew them.

The same snippet serves the recording and the verdict (§2.4). It works in three phases:

1. It returns to the top, since a reload restores the last scroll position. It reads long animation frames from the page load (a buffered observer), so the first stage mount counts however long after the load the snippet starts. Run it right after a fresh navigation: a second run on the same page would count the first one's frames.
2. It waits for the stages in the window to go live, nudging the scroll because `light` loads on a first interaction. Every frame until then, hydration and the first stage mount included, is held to the load budget, 300 ms; every later frame to the scroll budget, 100 ms (ADR-0026). A phone meets that first mount on its first scroll, so it counts.
3. It scrolls the whole page at a constant 1.2 s per screen, measuring every frame and every layout shift. Whenever a stage in the window is not live yet, the scroll holds, still measuring, until it is.

The holds matter. A scene draws its first frame only on screen, so a continuous scroll can pass a stage before it goes live. The run would then measure a page without its scenes, and the recording would show posters only.

```js
async () => {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
    throw new Error("Page scripts run against the project's local server only");
  }
  if (!PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")) {
    throw new Error("Long animation frames need Chrome 123 or later");
  }
  const HOLD_LIMIT_MS = 20000;
  const SECONDS_PER_SCREEN = 1.2;
  const LOAD_BUDGET_MS = 300;
  const SCROLL_BUDGET_MS = 100;
  scrollTo(0, 0);
  const longFrames = [];
  const shifts = [];
  const record = (entries) => {
    for (const entry of entries) {
      if (entry.entryType === "long-animation-frame") longFrames.push({ start: entry.startTime, duration: Math.round(entry.duration) });
      else if (!entry.hadRecentInput) shifts.push(entry);
    }
  };
  const observer = new PerformanceObserver((list) => record(list.getEntries()));
  observer.observe({ type: "long-animation-frame", buffered: true });
  observer.observe({ type: "layout-shift" });
  const visible = new Set();
  const watcher = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
    }
  });
  for (const stage of document.querySelectorAll("[data-slot=stage]")) watcher.observe(stage);
  const waiting = () => [...visible].some((stage) => stage.dataset.stage !== "live");
  await new Promise((resolve) => setTimeout(resolve, 200));
  const deadline = performance.now() + HOLD_LIMIT_MS;
  while (waiting()) {
    if (performance.now() > deadline) throw new Error("A stage in the window never went live");
    scrollTo(0, scrollY === 0 ? 1 : 0);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  const loadEnd = performance.now();
  scrollTo(0, 0);
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  const duration = Math.max(scrollable / innerHeight, 1) * SECONDS_PER_SCREEN * 1000;
  const deltas = [];
  let held = 0;
  await new Promise((resolve, reject) => {
    let previous;
    let scrolled = 0;
    let heldSince;
    const step = (now) => {
      if (previous !== undefined) {
        deltas.push(now - previous);
        if (!waiting()) {
          scrolled += now - previous;
          heldSince = undefined;
        } else {
          held += now - previous;
          heldSince ??= now;
          if (now - heldSince > HOLD_LIMIT_MS) return reject(new Error("A stage in the window never went live"));
        }
      }
      previous = now;
      const progress = Math.min(scrolled / duration, 1);
      scrollTo(0, progress * scrollable);
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
  watcher.disconnect();
  record(observer.takeRecords());
  observer.disconnect();
  let layoutShift = 0;
  let session = { value: 0, start: 0, last: -Infinity };
  for (const { startTime, value } of shifts) {
    if (startTime - session.last > 1000 || startTime - session.start > 5000) {
      session = { value: 0, start: startTime, last: startTime };
    }
    session = { ...session, value: session.value + value, last: startTime };
    layoutShift = Math.max(layoutShift, session.value);
  }
  deltas.sort((first, second) => first - second);
  const p95 = deltas[Math.ceil(deltas.length * 0.95) - 1];
  const loadFrames = longFrames.filter(({ start }) => start < loadEnd).map(({ duration }) => duration);
  const scrollFrames = longFrames.filter(({ start }) => start >= loadEnd).map(({ duration }) => duration);
  return {
    seconds: Math.round((duration + held) / 100) / 10,
    heldSeconds: Math.round(held / 100) / 10,
    frames: deltas.length,
    medianFrameMs: Math.round(deltas[Math.floor(deltas.length / 2)] * 10) / 10,
    p95FrameMs: Math.round(p95 * 10) / 10,
    loadLongFramesMs: loadFrames,
    scrollLongFramesMs: scrollFrames,
    layoutShift: Math.round(layoutShift * 1000) / 1000,
    frameBudgetPass:
      p95 <= 20 && Math.max(0, ...loadFrames) <= LOAD_BUDGET_MS && Math.max(0, ...scrollFrames) <= SCROLL_BUDGET_MS,
  };
}
```

- `loadLongFramesMs` lists the long animation frames (50 ms and over) from the page load until the stages of the first window are live, hydration and the first stage mount included: one above 300 ms fails the frame budget. `scrollLongFramesMs` lists every later one, each stage load during the scroll included: one above 100 ms fails it. A page whose first window holds no stage ends its load phase as soon as the snippet starts.
- `medianFrameMs` belongs beside every recording: a capture whose frames run slow makes a scene whose frame delta is capped look laggy on the video, a lag the page does not have.
- `layoutShift` is the largest session window of shifts during the run, computed the way CLS is. Lenis turns wheel input into the same scroll writes as the snippet, so a real wheel scroll gives the same figure. Field CLS counts the whole visit, scrolls included, so a shift above 0.1 marks the page as poor in Core Web Vitals even when the recording shows no jump, as with a pin switching layout. It caps criterion 9 at 2, and the fix belongs to `scroll-storytelling` (its scenes allow no layout shift, §6). A shift the strip does show also scores criterion 4 at 3 or less. The trace names the shifted element (§2.4).

The pointer clip: centre the signature stage and wait until it is live (the snippet below, with its index among the page's stages), then start the video, run the sweep, and stop.

```js
async () => {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
    throw new Error("Page scripts run against the project's local server only");
  }
  const STAGE_INDEX = 0;
  const stage = document.querySelectorAll("[data-slot=stage]")[STAGE_INDEX];
  stage.scrollIntoView({ block: "center" });
  const deadline = performance.now() + 20000;
  while (stage.dataset.stage !== "live") {
    if (performance.now() > deadline) throw new Error("The stage never went live");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
```

The sweep draws a figure eight over the window for 4 s, then holds still for 2 s, which gives the clip both the pointer response and the scene at rest. Scenes listen to `pointermove` on `window` for mouse pointers only, and the dispatched events bubble there:

```js
async () => {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
    throw new Error("Page scripts run against the project's local server only");
  }
  const SWEEP_MS = 4000;
  await new Promise((resolve) => {
    let start;
    const step = (now) => {
      start ??= now;
      const turn = Math.min((now - start) / SWEEP_MS, 1) * Math.PI * 2;
      const clientX = innerWidth * (0.5 + 0.35 * Math.sin(turn));
      const clientY = innerHeight * (0.5 + 0.3 * Math.sin(turn * 2));
      const target = document.elementFromPoint(clientX, clientY) ?? document.body;
      target.dispatchEvent(new PointerEvent("pointermove", { clientX, clientY, pointerType: "mouse", bubbles: true }));
      if (turn < Math.PI * 2) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
```

### 2.3 Contact sheet and strips (ffmpeg)

The contact sheet shows the rhythm at a glance. The base command samples 4 frames a second into one 4×4 tile, so it covers the first four seconds of a clip. Use it as is for a clip of four seconds or less, such as one beat:

```bash
ffmpeg -i rec.webm -vf "fps=4,scale=480:-2,tile=4x4:padding=4" -frames:v 1 -update 1 sheet.png
```

A whole-page scroll lasts longer, and the clip starts and ends with idle footage from the tool calls. Keep the span where the page moves (frames whose scene score passes 0.01) and spread the 16 tiles over it:

```bash
clip=$dir/scroll-desktop.webm
read -r start end < <(ffmpeg -v error -i "$clip" -vf "scale=360:-2,select='gt(scene,0.01)',metadata=print:file=-" -an -f null - |
  awk -F'pts_time:' '/pts_time/ { time = $2 + 0; if (first == "") first = time; last = time } END { print first, last }')
ffmpeg -v error -ss "$start" -to "$end" -i "$clip" -vf "fps=16/($end-$start),scale=480:-2,tile=4x4:padding=4" -frames:v 1 -update 1 "$dir/sheet-desktop.png"
```

Tile `k` (from 0, left to right then down) sits at `start + k × (end − start) / 16` seconds. A sheet cannot show an ease, so add a strip for every arrival of the signature: 12 frames over one second, where the spacing between frames is the curve. A decelerating arrival moves far in the first frames and barely in the last.

```bash
ffmpeg -v error -ss <seconds> -t 1 -i "$clip" -vf "fps=12,scale=480:-2,tile=4x3:padding=4" -frames:v 1 -update 1 "$dir/strip-<beat>.png"
```

From the pointer clip, take one strip over the sweep and one over the last two seconds (`-t 2`, `fps=6`), which shows the scene at rest.

**Boundary strips.** A sheet samples a boundary once at best, so every row of the page's `### Transitions` gets its own strip (`motion-design` §3). Build strips from screenshots taken during a scripted scroll, never from the recording: the video's start offset is unknown, so mapping scroll positions to video times puts copy and world at the wrong moments and shows lag that is not there. Keep the recordings for the sheet and the visitor's view.

Read where each section starts, in pixels, with the page at the top:

```js
() => {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
    throw new Error("Page scripts run against the project's local server only");
  }
  return [...document.querySelectorAll("main > *")].map((section) => ({
    section: section.id || section.getAttribute("aria-labelledby") || section.tagName.toLowerCase(),
    top: Math.round(section.getBoundingClientRect().top + scrollY),
  }));
}
```

Each boundary spans from the outgoing scene's last phase to the incoming section's arrival: from about `top − 1.1 × viewport` to `top + 0.15 × viewport` of the incoming section, or, on a one-world page, from just before the outgoing block's hold ends to just after the next one's starts. A shot seam inside a stage spans the few hundred pixels around it. Then `mcp__playwright__browser_run_code_unsafe` runs the strip script of `references/boundary-capture.md`: it scrolls through the span the way a visitor does, by wheel steps through the page's smooth scrolling, and screenshots between steps into one folder per boundary. Tile the shots:

```bash
ffmpeg -v error -framerate 1 -i "$dir/boundary-<from>-<to>/%02d.png" -vf "scale=480:-2,tile=3x3:padding=4" -frames:v 1 -update 1 "$dir/strip-boundary-<from>-<to>.png"
```

- **A dense second pass** over the few hundred pixels where a sweep, a wipe or a draw happens: the same script, 8 shots over that span. A coarse strip of about one shot per 100 px misses a front that crosses the whole screen between two shots.
- **Settled seams.** For each shot seam and each blended boundary, three screenshots with the page at rest (wait 1.5 s after the scroll) before, at and after its middle: a held, settled frame shows ghosting and doubled structures that a moving capture hides.
- **Phones.** `mouse.wheel` does not scroll reliably under mobile emulation: step with `page.evaluate((y) => scrollTo(0, y), …)` instead, after one tap on an empty area so the `light` tier's first-interaction trigger fires.
- **Tears.** A capture taken during a fast scroll can tear (a block of text cut by a horizontal line): confirm any tear on a settled screenshot before fixing it.

Read every strip for these defects, each one a fix at its source:

- a straight horizontal edge between two grounds, or between a picture and the ground;
- a frame of empty ground for more than about a third of a screen;
- a moving element against the language's travel;
- a carried element crossing copy;
- copy still mid-entrance where it should be read, two blocks readable at once, copy arriving before the state it describes, or an action happening while no copy is on screen;
- a flare or a bright morph behind copy;
- a stage still on its poster when its section is on screen.

**Stages live during a continuous scroll.** A stage must go live before its hold starts, even when the visitor never pauses. The liveness snippet of `references/boundary-capture.md` (`browser_evaluate`) scrolls the page at a constant speed with no holds and logs every stage's switch to `live`: `late` lists stages that went live after their section's top had left the window, `never` those that did not go live at all. Either one scores criterion 10 at 3 or less: the visitor sees the poster where the scene should play.

**World lag probe.** When a strip shows a world behind its copy, expose the page's progress object temporarily (`Object.assign(window, { stageProgress: progress })` in the page's code, removed before any commit), wheel through the span with the script above, and log `[scrollY, stageProgress.value]` beside each screenshot. The values must match the holds the copy defines (`scroll-storytelling` `references/one-world.md`): a pure-function bug shows here, stacked smoothing shows as a value that trails the scroll.

**Hard cuts.** List the frames where the picture changes at once. On three recordings at 1440×900, a plain scroll stayed at or under 0.21 while a stage giving way to the next section under a straight edge scored 0.34 and 0.39, so 0.25 is the starting threshold. Ignore the clip's first frame. Every time listed must match a `cut` row of `### Transitions`:

```bash
ffmpeg -v error -i "$clip" -vf "scale=360:-2,select='gt(scene,0.25)',metadata=print:file=-" -an -f null - | grep -o 'pts_time:[0-9.]*'
```

### 2.4 Frame budget and trace (Chrome DevTools MCP)

SwiftShader and headless timings mean nothing, so measure in the headed Chrome that `chrome-devtools-mcp` launches on the machine's GPU, at both tiers, each pass from a fresh load. A stage that loads during the scroll is what a visitor meets, and a second pass on a warm page hides the long frame of its first load.

1. `mcp__chrome-devtools__new_page` with the local URL, which returns the `pageId`.
2. `mcp__chrome-devtools__emulate` with `cpuThrottlingRate: 4`, `prefersReducedMotion: "no-preference"`, and `viewport: "1440x900x2"` (`full`) or `"390x844x3,mobile,touch"` (`light`). Each call replaces every emulation setting, so pass them together.
3. `mcp__chrome-devtools__navigate_page` with `type: "reload"`. The stage picks its tier at load, so the emulation has to come before it.
4. `mcp__chrome-devtools__evaluate_script` reads the renderer from a throwaway context and releases it, so the page's own stages keep the GPU to themselves. If it names SwiftShader, llvmpipe or a software renderer, the numbers are void: never pass `--headless` to the server, and measure on a machine with a GPU.

   ```js
   () => {
     if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
       throw new Error("Page scripts run against the project's local server only");
     }
     const context = new OffscreenCanvas(1, 1).getContext("webgl2");
     const extension = context?.getExtension("WEBGL_debug_renderer_info");
     const renderer = extension ? String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : "unknown";
     context?.getExtension("WEBGL_lose_context")?.loseContext();
     return renderer;
   }
   ```

5. `mcp__chrome-devtools__evaluate_script` with the scroll snippet of §2.2. This untraced pass is the verdict: p95 ≤ 20 ms, no long animation frame above 300 ms until the first window's stages are live nor above 100 ms after (every stage load during the scroll included), and its `layoutShift`.
6. Reload, then `mcp__chrome-devtools__performance_start_trace` with `reload: false` and `autoStop: false`, the scroll snippet again, and `mcp__chrome-devtools__performance_stop_trace` with an absolute `filePath` to `<dir>/trace-<tier>.json.gz`. The trace explains a failure: tracing adds overhead, so never use it for the verdict. Open the insights it lists with `mcp__chrome-devtools__performance_analyze_insight`, copying the `insightSetId` and `insightName` exactly. `CLSCulprits` names the element behind a scroll-time shift; a ScrollTrigger `pin`, or a held stage sized in `dvh` that a phone toolbar resizes, is the usual one.
7. `mcp__chrome-devtools__list_console_messages` with `types: ["error", "warn", "log"]`: three logs a lost context at the log level. Only WebGL and shader messages count, as in the audit.
8. Reset with `mcp__chrome-devtools__emulate` and the `pageId` alone, then `mcp__chrome-devtools__close_page`.

Record per tier in the round: renderer, `seconds`, `frames`, `p95FrameMs`, `loadLongFramesMs`, `scrollLongFramesMs`, `layoutShift`.

### 2.5 Reduced motion and the phone

- `mcp__playwright__browser_emulate_media` with `reducedMotion: "reduce"`, then `mcp__playwright__browser_take_screenshot` with `fullPage: true` and a `filename` in the round folder, at 1440×900 and at 390×844. The page must be complete: every message in HTML, a poster or still plate for every beat, no canvas. Set `reducedMotion` back to `"no-preference"` afterwards.
- At 390×844 with motion, the `scroll-phone` clip and sheet are the evidence, plus a screenshot of the first viewport before any interaction: the phone shows the poster until then.
- When the page's colours change with the scheme (the stage reads theme tokens), screenshot each signature beat in the other scheme too: the veil and the token colours differ.

## 3. The grid

Eleven criteria, each scored 1 to 5. The expected level is that of a hand-made studio site: deliberate, specific to this brand, finished in every frame.

| Score | Meaning                                                                           |
| ----- | --------------------------------------------------------------------------------- |
| 5     | At or above the best reference on the board for this criterion; nothing to change |
| 4     | At the references' level; flaws only visible frame by frame                       |
| 3     | Competent but generic, or one flaw a visitor would notice                         |
| 2     | A defect a visitor notices at once                                                |
| 1     | Absent or broken                                                                  |

| Criterion                   | A 5 looks like                                                                                                                                                                                                                                                                                                                                                                                                                                               | It scores 3 or less when                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Message legibility       | The first viewport states the offer and the primary action at a glance, before any motion completes. The copy reads over the effect on every frame and tier, and the effect frames the message rather than competing with it                                                                                                                                                                                                                                 | The copy fights the effect, the veil fails on some frame, the headline waits for an animation, or a message lives only in the canvas                                                                                                                                                                                                                                                                                                          |
| 2. One signature idea       | One moment a visitor can retell in one sentence, and that sentence names the product's mechanism or promise (the storyboard's `Why`). The other scenes lead to it or echo it                                                                                                                                                                                                                                                                                 | Two effects compete, removing the moment would lose nothing, or the effect would fit another product unchanged                                                                                                                                                                                                                                                                                                                                |
| 3. Depth and light          | Planes that separate in motion; light with a source, a direction and falloff; glow only on hot cores; dark gradients without banding; grain where the direction wants a shot rather than a render                                                                                                                                                                                                                                                            | Flat single plane, light from nowhere, over-bright bloom turning the frame to haze, banding                                                                                                                                                                                                                                                                                                                                                   |
| 4. Curves and arrivals      | Every element decelerates into its resting state (the strip's spacing shrinks); one lead per frame, its support after it and moving less; phases overlap so a scene reads as one gesture; camera moves start and end at rest with one speed between; eases, durations and the one stagger interval are the tokens `## Motion language` names; the scrub never steps; the poster-to-canvas crossfade is invisible                                             | Linear starts or stops, pops, every element arriving at once with nothing leading, two leads in one frame, a camera that surges or stops dead, a jump or stutter in a strip, an ease or stagger outside the language, overshoot the direction did not ask for                                                                                                                                                                                 |
| 5. Life at rest             | An ambient stage keeps breathing when the scroll stops, slowly enough to read the copy over it, with no visible loop seam, and pausing it holds the frame. A stage the storyboard declares not ambient (scrubbed footage, kinetic type: a deliberately static scene says so, ADR-0026) lives through the scroll instead: every resting frame is a composed still, and motion picks up without a jump when the scroll resumes                                 | Frozen where the storyboard promises ambient life, restless enough to pull the eye from the copy, a visible seam, an ambient stage without its pause control, or a static scene resting on a half-finished transition                                                                                                                                                                                                                         |
| 6. Pointer response         | The scene answers the mouse with weight (smoothed, slightly behind), in proportion, and the answer means something: the light follows, the matter parts. A touch does nothing because the finger scrolls, and the wheel is never captured. **N/A** when the storyboard gives the concept no pointer channel and `## Decisions` says why (a film-like shot, kinetic type)                                                                                     | No response on desktop where the storyboard promises one, a jittery one-to-one follow, a reaction that breaks the composition or covers copy, or a captured wheel                                                                                                                                                                                                                                                                             |
| 7. Coherence with DESIGN.md | Colours resolve from theme tokens (a scheme swap recolours the scene); the motion obeys `## Motion language`: its personality, its travel (entrances from upstream, exits downstream, counter-motion only between depth planes) and its "never" line; every technique on the page shares one light direction, one grade and one grain; materials and light match the direction's world; nothing from its "Don't" list appears                                | A colour outside the theme, a motion personality from elsewhere, motion against the travel without a depth reason, a stage lit, graded or grained unlike its neighbours, or a reference's look instead of its principle                                                                                                                                                                                                                       |
| 8. Originality              | None of the forbidden clichés, and no brand in the category could ship it unchanged. It borrows principles from the references, never their look                                                                                                                                                                                                                                                                                                             | A cliché, even recoloured or renamed; the category's default image; a reference reproduced                                                                                                                                                                                                                                                                                                                                                    |
| 9. Performance              | On both tiers at 4× CPU: p95 well under 20 ms, no long animation frame over 300 ms until the first window's stages are live nor over 100 ms after (every stage load during the scroll included), and `layoutShift` at 0.1 or less. A 4 is within the thresholds                                                                                                                                                                                                                                                                | Any threshold missed on either tier caps the score at 2, because a threshold is a gate. A known Lighthouse failure caps it at 2 too                                                                                                                                                                                                                                                                                                           |
| 10. Fallback quality        | Under reduced motion or without WebGL2 the page is complete: posters and still plates carry every beat, no canvas. The poster is the first frame (no pop at the crossfade) and crops like the canvas on every viewport. The phone's poster before the first interaction looks intended                                                                                                                                                                       | A pop, a still that does not match its beat, a missing beat, a poster cropped unlike the canvas                                                                                                                                                                                                                                                                                                                                               |
| 11. Transitions and pacing  | Every boundary of `### Transitions` is crafted as its row says: the carrier is on both sides of the strip, the screen direction holds, the incoming focal point meets the eye where the outgoing one left it, shot seams are invisible, and a stage resolves into the next section before its hold releases. Scenes build to the signature and release, with a rest between peaks, and copy holds still while it is read (`motion-design` §7, checks 1 to 9) | A boundary without a row, a forbidden default (an unrelated crossfade, an undirected noise dissolve, a WebGL stage sliding off over a flat section), a hard cut no `cut` row explains, a reversed screen direction, two copy blocks readable at once, two peaks with no rest between them, a straight edge between two grounds, a world that trails its copy, an action played while no copy is on screen, or a carried element crossing copy |

**Forbidden clichés.** When one of these is the signature, criterion 8 scores 1:

- **The generic gradient blob**, because it is a placeholder for an idea and says nothing about the product.
- **The generic particle sphere** (galaxy, vortex), because it is particles with nothing to become.
- **The glowing hero orb**, which is light without matter or meaning: the default "AI" image.
- **The bento grid**, because it lists features in tiles instead of telling them in sequence.

A cliché is judged by what it shows, not by its name, and a new colour does not rescue it.

**Pass:** every criterion scores 4 or more. The one exception is criterion 6 when it is N/A for the stated reason, which counts as a pass. Never average: one 3 is what a visitor remembers, whether the stutter or the cliché.

## 4. Scoring rules

- **Evidence first.** Each score cites its evidence: a sheet tile, a strip frame, a measured number, a trace insight, a screenshot. A criterion without evidence gets no score until you capture what it needs.
- **Order.** Score from the sheets (rhythm, legibility per beat), then the strips (curves, rest, pointer, boundaries) and the hard-cut list, the measurements, the reduced-motion and phone captures, and the references last. Judging the references first anchors you on their look.
- **References on their principle.** For each criterion where the board names a reference's principle (a light, a pace, a type move), ask whether the page reaches that level on that principle. Never ask whether it looks like the reference.
- **All eleven every round.** A fix to one criterion can break another (stronger bloom hurts legibility, a heavier scene hurts performance).
- **Never pass by removal.** Dropping the idle drift, the pointer response or a scene to clear a criterion lowers the page. Remove one only when the storyboard changes first and the change is logged.

## 5. The loop

1. Capture into the round folder, score, and write `scores.md` there: one row per criterion with score, evidence, cause and fix.
2. If every criterion is at 4 or more, stop and report.
3. Fix the causes of the lowest scores first, at their source, through the skill that owns them: the look in `shader-craft`, `gpu-particles`, `cinematic-footage` or `scene-3d`; the motion language, a transition or the pace in `motion-design`; the choreography in `scroll-storytelling`; tokens and components in `design-system`; an asset in `asset-production`, where paid calls stay under the page cap. After a change to the look, re-capture the poster (`shader-craft` §7) before the next round, because the fallback criterion depends on it.
4. Re-capture into `round-<n+1>` and score all eleven again.
5. Five rounds at most. After the fifth, stop looping and report what still fails. Repeating a fix that did not work hides the problem instead of solving it.

In an autonomous run (started by `signature-experience`), add one line per round under `## Decisions` in `DESIGN.md`: the criteria below 4 and the fix chosen. Five rounds without a pass is not a stop: the caller goes on and carries the report.

## 6. Report

Write `.context/motion-review/<page>/report.md` and give its summary to the caller:

- Verdict: pass, or the criteria still under 4.
- The last round's scores with their evidence.
- Per tier: renderer, p95 frame time, longest animation frame and whether a stage load caused it, and the layout shift with the element behind it.
- One line per round: what failed and what was changed.
- The files of the last round: clips, sheets, strips, traces, e2e frames, screenshots.
- If it did not pass: the next fix you would make, and why the five rounds did not get there.

## Avoid

- Judging motion from stills, or scoring from memory of an earlier round.
- Capturing on `pnpm dev`, headless Chrome or SwiftShader; measuring a warm page; using the traced pass as the verdict.
- Chapter cards, action overlays or the animated cursor in a recording.
- Page scripts on any URL other than the local server.
- Comparing with images that are not on the project's board, versioning a capture, or adding images to a skill.
- Averaging the grid; passing a criterion by removing what it judges; a sixth round.
- Dismissing a layout shift during the scroll: Lenis scrolls with the same writes, so the visitor sees it.

## Reference skills

`shader-craft` (contrast on real frames §6, poster §7, budgets and cost knobs §9), `gpu-particles` §11 and `scene-3d` §7 (per-technique budgets), `cinematic-footage` (seams and sequences), `motion-design` (motion language, transitions, pacing and the polish checklist), `scroll-storytelling` (storyboard, eases and tokens), `review-animations` and `emil-design-eng` (motion craft), `design-inspiration` (the board), and the `design-reviewer` agent, which scores the same grid.
