export interface Token {
  name: string;
  value: string;
}

function* walkRules(rules: CSSRuleList): Generator<CSSRule> {
  for (const rule of rules) {
    yield rule;
    if ("cssRules" in rule && rule.cssRules instanceof CSSRuleList) {
      yield* walkRules(rule.cssRules);
    }
  }
}

function* rootProperties(): Generator<string> {
  for (const sheet of document.styleSheets) {
    for (const rule of walkRules(sheet.cssRules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes(":root")) {
        yield* rule.style;
      }
    }
  }
}

function isToken(property: string, prefix: string): boolean {
  return property.startsWith(prefix) && !property.includes("--", prefix.length);
}

export function readTokens(prefix: string): Token[] {
  const styles = getComputedStyle(document.documentElement);
  const names = new Set([...rootProperties()].filter((property) => isToken(property, prefix)));
  return [...names].map((name) => ({ name, value: styles.getPropertyValue(name).trim() }));
}
