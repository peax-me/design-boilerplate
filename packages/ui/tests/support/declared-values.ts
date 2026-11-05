interface Declaration {
  element: Element;
  property: string;
}

function valuesIn(rules: CSSRuleList, declaration: Declaration, applies: boolean): string[] {
  const { element, property } = declaration;
  return [...rules].flatMap((rule) => {
    if (rule instanceof CSSStyleRule) {
      /* A rule nested in a matching rule is a variant (a hover, a child): only its media-nested declarations count. */
      const matches = !applies && element.matches(rule.selectorText);
      const own = matches ? [rule.style.getPropertyValue(property)] : [];
      return own.concat(valuesIn(rule.cssRules, declaration, matches));
    }
    if (rule instanceof CSSNestedDeclarations) {
      return applies ? [rule.style.getPropertyValue(property)] : [];
    }
    if (rule instanceof CSSGroupingRule) {
      return valuesIn(rule.cssRules, declaration, applies);
    }
    return [];
  });
}

/* The values a property is declared with by the rules that match an element, media and layer rules included. A computed length cannot tell 100svh from 100dvh where the browser has no toolbar to collapse; the declaration can. */
export function declaredValues(element: Element, property: string): string[] {
  return [...document.styleSheets]
    .flatMap((sheet) => valuesIn(sheet.cssRules, { element, property }, false))
    .filter((value) => value !== "");
}
