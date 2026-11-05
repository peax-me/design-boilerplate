# Boundary capture scripts

The scripts behind the boundary strips and the liveness check of `motion-review` §2.3. Both throw outside the local server.

## Strip script (`mcp__playwright__browser_run_code_unsafe`)

Set `DIR` to an absolute path (the Playwright server resolves relative paths against its own working directory), and `FROM` and `TO` to the span in pixels. Nine shots over the boundary; eight over a sweep for the dense pass.

```js
async (page) => {
  if (!["localhost", "127.0.0.1"].includes(new URL(page.url()).hostname)) {
    throw new Error("Page scripts run against the project's local server only");
  }
  const DIR = "/absolute/path/.context/motion-review/<page>/round-<n>/boundary-<from>-<to>";
  const FROM = 0; // px, start of the span
  const TO = 0; // px, end of the span
  const SHOTS = 9;
  const STEP_MS = 120; // a visitor's pace between wheel steps; the scrub and smoothing keep moving between shots
  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.evaluate((y) => scrollTo(0, y), FROM);
  await page.waitForTimeout(1500);
  for (let shot = 0; shot < SHOTS; shot += 1) {
    if (shot > 0) {
      await page.mouse.wheel(0, (TO - FROM) / (SHOTS - 1));
      await page.waitForTimeout(STEP_MS);
    }
    await page.screenshot({ path: `${DIR}/${String(shot + 1).padStart(2, "0")}.png` });
  }
}
```

`STEP_MS` keeps a visitor's pace: the scrub and any smoothing keep moving between shots, so the strip shows the lag a visitor sees.

## Liveness snippet (`browser_evaluate`)

A fresh load, then a constant scroll with no holds, at the pace of the recording snippet of §2.2.

```js
async () => {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
    throw new Error("Page scripts run against the project's local server only");
  }
  const SECONDS_PER_SCREEN = 1.2;
  const stages = [...document.querySelectorAll("[data-slot=stage]")];
  scrollTo(0, 0);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const late = [];
  const observer = new MutationObserver((records) => {
    for (const { target } of records) {
      const holder = target.closest("section") ?? target;
      if (target.dataset.stage === "live" && holder.getBoundingClientRect().top < 0) {
        late.push({ stage: stages.indexOf(target), pastTopPx: -Math.round(holder.getBoundingClientRect().top) });
      }
    }
  });
  for (const stage of stages) observer.observe(stage, { attributes: true, attributeFilter: ["data-stage"] });
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  const duration = Math.max(scrollable / innerHeight, 1) * SECONDS_PER_SCREEN * 1000;
  await new Promise((resolve) => {
    let start;
    const step = (now) => {
      start ??= now;
      const progress = Math.min((now - start) / duration, 1);
      scrollTo(0, progress * scrollable);
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
  observer.disconnect();
  const never = stages.map((stage, index) => ({ index, state: stage.dataset.stage })).filter(({ state }) => state !== "live");
  return { late, never };
}
```
