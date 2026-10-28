import type { ElementSnapshot, TokenScales } from "./analyze.ts";

// oxlint-disable unicorn/consistent-function-scoping -- collectors run inside the page via page.evaluate, so their helpers must stay inside them.

export function collectTokenScales(): TokenScales {
  function* walk(rules: CSSRuleList): Generator<CSSRule> {
    for (const rule of rules) {
      yield rule;
      if (rule instanceof CSSGroupingRule) {
        yield* walk(rule.cssRules);
      }
    }
  }

  function* rootProperties(): Generator<string> {
    for (const sheet of document.styleSheets) {
      for (const rule of walk(sheet.cssRules)) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes(":root")) {
          yield* rule.style;
        }
      }
    }
  }

  const names = [...new Set(rootProperties())];

  function measure(property: string, token: string): string {
    const probe = document.createElement("div");
    probe.style.setProperty(property, `var(${CSS.escape(token)})`);
    document.body.append(probe);
    const value = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return value;
  }

  function resolve(prefix: string, property: string): string[] {
    return names
      .filter((name) => name.startsWith(prefix) && !name.includes("--", prefix.length))
      .map((name) => measure(property, name));
  }

  return {
    spacing: resolve("--spacing-", "width"),
    fontSize: resolve("--text-", "font-size"),
    radius: ["0px", ...resolve("--radius-", "border-radius")],
  };
}

export function collectElements(): ElementSnapshot[] {
  const SKIPPED =
    "script, style, template, noscript, next-route-announcer, svg *, .pin-spacer, [aria-hidden=true][tabindex='-1'], label > input";
  const INTERACTIVE =
    "button, [role=button], a[data-slot=button-link], input, select, textarea, label:has(> input)";

  function layoutOf(display: string): ElementSnapshot["layout"] {
    if (display.includes("grid")) {
      return "grid";
    }
    return display.includes("flex") ? "flex" : "flow";
  }

  function labelOf(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const slot = element instanceof HTMLElement ? element.dataset["slot"] : undefined;
    return slot === undefined ? tag : `${tag}[data-slot=${slot}]`;
  }

  const elements = [...document.body.querySelectorAll("*")].filter(
    (element) => !element.matches(SKIPPED) && getComputedStyle(element).display !== "none",
  );
  const ids = new Map(elements.map((element, index) => [element, index]));

  return elements.map((element, id) => {
    const style = getComputedStyle(element);
    const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
    return {
      id,
      parentId: element.parentElement === null ? null : (ids.get(element.parentElement) ?? null),
      label: labelOf(element),
      layout: layoutOf(style.display),
      inFlow: style.position !== "absolute" && style.position !== "fixed",
      interactive: element.matches(INTERACTIVE),
      padding: {
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
        left: style.paddingLeft,
      },
      gap: { row: style.rowGap, column: style.columnGap },
      fontSize: style.fontSize,
      radius: style.borderTopLeftRadius,
      box: { left, top, right, bottom, width, height },
    };
  });
}
