# figma-prototype snippets

Plugin API shapes from the bundled typings, used with `use_figma`. Items marked [unverified] behave as documented in the typings but have not been confirmed in a live file; read the result back after writing.

## Helpers (embed in every wiring script)

```js
const EASE_STANDARD = {
  type: "CUSTOM_CUBIC_BEZIER",
  easingFunctionCubicBezier: { x1: 0.2, y1: 0, x2: 0, y2: 1 },
};
const EASE_EMPHASIZED = {
  type: "CUSTOM_CUBIC_BEZIER",
  easingFunctionCubicBezier: { x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
};
const smartAnimate = (duration = 0.2, easing = EASE_STANDARD) => ({
  type: "SMART_ANIMATE",
  easing,
  duration,
});
const dissolve = (duration = 0.2, easing = EASE_STANDARD) => ({
  type: "DISSOLVE",
  easing,
  duration,
});
const directional = (type, direction, duration = 0.45, easing = EASE_EMPHASIZED) => ({
  type,
  direction,
  matchLayers: false,
  easing,
  duration,
}); // matchLayers key is mandatory here
const nodeAction = (destinationId, navigation, transition = null) => ({
  type: "NODE",
  destinationId,
  navigation,
  transition,
});

async function upsertReaction(node, reaction) {
  const others = node.reactions
    .filter(
      (existing) => existing.actions?.length && existing.trigger?.type !== reaction.trigger.type,
    )
    .map(({ trigger, actions }) => ({ trigger, actions }));
  await node.setReactionsAsync([...others, reaction]);
}
```

`upsertReaction` keeps one reaction per trigger type, which makes re-runs idempotent. Exception: for several `ON_KEY_DOWN` reactions with different `keyCodes`, compare `keyCodes` too.

## Overlay: open, close, Escape, swap

```js
const modal = await figma.getNodeByIdAsync("MODAL_FRAME_ID"); // top-level frame
const openButton = await figma.getNodeByIdAsync("OPEN_BUTTON_ID");
const closeButton = await figma.getNodeByIdAsync("CLOSE_BUTTON_ID"); // inside the modal
await upsertReaction(openButton, {
  trigger: { type: "ON_CLICK" },
  actions: [nodeAction(modal.id, "OVERLAY", directional("MOVE_IN", "BOTTOM", 0.2))], // no SMART_ANIMATE on overlays
});
await upsertReaction(closeButton, { trigger: { type: "ON_CLICK" }, actions: [{ type: "CLOSE" }] });
await upsertReaction(modal, {
  trigger: { type: "ON_KEY_DOWN", device: "KEYBOARD", keyCodes: [27] },
  actions: [{ type: "CLOSE" }],
});
// MANUAL overlays only: { ...nodeAction(modal.id, 'OVERLAY', dissolve()), overlayRelativePosition: { x: 0, y: 48 } }
// Swap the top overlay: nodeAction('OTHER_MODAL_ID', 'SWAP', dissolve())
return {
  mutatedNodeIds: [openButton.id, closeButton.id, modal.id],
  overlaySettings: {
    // read-only; report to the user if they differ from the intent
    position: modal.overlayPositionType,
    background: modal.overlayBackground,
    interaction: modal.overlayBackgroundInteraction,
  },
};
```

If the write throws "Reaction … invalid", the frame is not yet an overlay. Ask the user to set it once in the Prototype panel (see SKILL.md, UI-only steps).

## Scroll to an anchor, back, URL, auto-advance

```js
const link = await figma.getNodeByIdAsync("NAV_LINK_ID");
await upsertReaction(link, {
  trigger: { type: "ON_CLICK" },
  actions: [
    nodeAction("SECTION_ID", "SCROLL_TO", {
      type: "SCROLL_ANIMATE",
      easing: EASE_STANDARD,
      duration: 0.8,
    }),
  ], //; verified in this repository's library
});
const backButton = await figma.getNodeByIdAsync("BACK_ID");
await upsertReaction(backButton, { trigger: { type: "ON_CLICK" }, actions: [{ type: "BACK" }] }); // transition is ignored by Figma
const docsLink = await figma.getNodeByIdAsync("DOCS_LINK_ID");
await upsertReaction(docsLink, {
  trigger: { type: "ON_CLICK" },
  actions: [{ type: "URL", url: "https://example.com", openInNewTab: true }],
});
const splash = await figma.getNodeByIdAsync("SPLASH_FRAME_ID"); // AFTER_TIMEOUT belongs on a top-level frame
await upsertReaction(splash, {
  trigger: { type: "AFTER_TIMEOUT", timeout: 0.8 },
  actions: [nodeAction("HOME_ID", "NAVIGATE", dissolve(0.45))],
}); // seconds [observed]; calibrate
return { mutatedNodeIds: [link.id, backButton.id, docsLink.id, splash.id] };
```

## Hover with one-way mouse triggers

```js
{ trigger: { type: 'MOUSE_ENTER', delay: 0, deprecatedVersion: false }, actions: [nodeAction('TOOLTIP_ID', 'OVERLAY', dissolve(0.15))] }
{ trigger: { type: 'MOUSE_LEAVE', delay: 0, deprecatedVersion: false }, actions: [{ type: 'CLOSE' }] }
```

## Interactive components: hover, press, toggle

This handles multi-axis sets such as `variant × size × State` by matching the other properties.

```js
const componentSet = await figma.getNodeByIdAsync("BUTTON_SET_ID"); // COMPONENT_SET
const variants = componentSet.children.filter((child) => child.type === "COMPONENT");
const sibling = (base, axis, value) =>
  variants.find((variant) =>
    Object.entries({ ...base.variantProperties, [axis]: value }).every(
      ([key, val]) => variant.variantProperties[key] === val,
    ),
  );
const pairs = variants
  .filter((variant) => variant.variantProperties.State === "Default")
  .map((base) => ({
    base,
    hover: sibling(base, "State", "Hover"),
    pressed: sibling(base, "State", "Pressed"),
  }))
  .filter(({ hover, pressed }) => hover && pressed);
await Promise.all(
  pairs.flatMap(({ base, hover, pressed }) => [
    upsertReaction(base, {
      trigger: { type: "ON_HOVER" },
      actions: [nodeAction(hover.id, "CHANGE_TO", smartAnimate(0.2))],
    }),
    upsertReaction(hover, {
      trigger: { type: "ON_PRESS" },
      actions: [nodeAction(pressed.id, "CHANGE_TO", smartAnimate(0.1))],
    }),
  ]),
);
return { mutatedNodeIds: pairs.flatMap(({ base, hover }) => [base.id, hover.id]) };
```

Toggle (switch or checkbox): wire `Off` and `On` to each other.

```js
const off = variants.find((variant) => variant.variantProperties.Checked === "false");
const on = variants.find((variant) => variant.variantProperties.Checked === "true");
await upsertReaction(off, {
  trigger: { type: "ON_CLICK" },
  actions: [nodeAction(on.id, "CHANGE_TO", smartAnimate(0.2))],
});
await upsertReaction(on, {
  trigger: { type: "ON_CLICK" },
  actions: [nodeAction(off.id, "CHANGE_TO", smartAnimate(0.2))],
});
```

Never write reactions on instances of these sets (see SKILL.md, rule 4).

## Nested scroll container and fixed header

```js
const carousel = await figma.getNodeByIdAsync("CAROUSEL_ID");
carousel.clipsContent = true;
carousel.overflowDirection = "HORIZONTAL"; // top-level screens scroll without this
const screen = await figma.getNodeByIdAsync("SCREEN_ID");
const header = await figma.getNodeByIdAsync("HEADER_ID"); // direct child of screen
if (screen.layoutMode !== "NONE") header.layoutPositioning = "ABSOLUTE"; // keep it out of the flow [unverified]
screen.appendChild(header); // ASSUMPTION: the last N children are fixed [unverified]
screen.numberOfFixedChildren = 1;
return { mutatedNodeIds: [carousel.id, screen.id, header.id], fixed: screen.numberOfFixedChildren };
```

Sticky ("stick to top while scrolling past") is UI-only.

## Stateful logic with variables

The toggle follows the official JSDoc example pattern.

```js
const collection = figma.variables.createVariableCollection("Prototype");
const isOpen = figma.variables.createVariable("menu/isOpen", collection, "BOOLEAN");
isOpen.setValueForMode(collection.modes[0].modeId, false);
const menu = await figma.getNodeByIdAsync("MENU_ID");
menu.setBoundVariable("visible", isOpen);
const alias = (variable, resolvedType) => ({
  type: "VARIABLE_ALIAS",
  resolvedType,
  value: { type: "VARIABLE_ALIAS", id: variable.id },
});
const boolean = (value) => ({ type: "BOOLEAN", resolvedType: "BOOLEAN", value });
const setIsOpen = (value) => ({
  type: "SET_VARIABLE",
  variableId: isOpen.id,
  variableValue: boolean(value),
});
const burger = await figma.getNodeByIdAsync("BURGER_ID");
await upsertReaction(burger, {
  trigger: { type: "ON_CLICK" },
  actions: [
    {
      type: "CONDITIONAL",
      conditionalBlocks: [
        {
          condition: {
            type: "EXPRESSION",
            resolvedType: "BOOLEAN",
            value: {
              expressionFunction: "EQUALS",
              expressionArguments: [alias(isOpen, "BOOLEAN"), boolean(true)],
            },
          },
          actions: [setIsOpen(false)],
        },
        { actions: [setIsOpen(true)] }, // else; else-if chains are collapsed by Figma
      ],
    },
  ],
});
return { createdIds: [collection.id, isOpen.id], mutatedNodeIds: [menu.id, burger.id] };
```

Counter increment with an expression value. The shape follows the d.ts but is **[unverified]**.

```js
{ type: 'SET_VARIABLE', variableId: count.id, variableValue: { type: 'EXPRESSION', resolvedType: 'FLOAT',
  value: { expressionFunction: 'ADDITION', expressionArguments: [alias(count, 'FLOAT'), { type: 'FLOAT', resolvedType: 'FLOAT', value: 1 }] } } }
```

Theme switch through modes [d.ts]. The `Color` collection has `Light`/`Dark` modes per figma-sync.

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const color = collections.find((collection) => collection.name === 'Color');
const dark = color.modes.find((mode) => mode.name === 'Dark');
{ type: 'SET_VARIABLE_MODE', variableCollectionId: color.id, variableModeId: dark.modeId }
```

Compound condition [observed: smooeach]:

```js
{ type: 'EXPRESSION', resolvedType: 'BOOLEAN', value: { expressionFunction: 'AND', expressionArguments: [comparisonA, comparisonB] } }
```

## Flows and prototype background

```js
const page = await figma.getNodeByIdAsync("PAGE_ID");
await figma.setCurrentPageAsync(page);
page.flowStartingPoints = [
  // top-level frames only; the first entry is the default
  { nodeId: "HOME_FRAME_ID", name: "Browse" },
  { nodeId: "CHECKOUT_FRAME_ID", name: "Checkout" },
];
page.prototypeBackgrounds = [{ type: "SOLID", color: { r: 0.04, g: 0.04, b: 0.05 } }];
return { flowStartingPoints: page.flowStartingPoints }; // read back: one third-party skill reports this as non-settable
```

## Lint (read-only)

```js
const page = await figma.getNodeByIdAsync("PAGE_ID");
await figma.setCurrentPageAsync(page);
const isScreen = (node) => node.type === "FRAME" && ["PAGE", "SECTION"].includes(node.parent?.type);
const screenOf = (node) => {
  let current = node;
  while (current && !isScreen(current)) current = current.parent;
  return current;
};
const flatten = (actions = []) =>
  actions.flatMap((action) =>
    action.type === "CONDITIONAL"
      ? action.conditionalBlocks.flatMap((block) => flatten(block.actions))
      : [action],
  );
const edges = page
  .findAll((node) => "reactions" in node && node.reactions.length > 0)
  .flatMap((node) =>
    node.reactions.flatMap((reaction) =>
      flatten(reaction.actions).map((action) => ({
        sourceId: node.id,
        sourceName: node.name,
        screenId: screenOf(node)?.id,
        trigger: reaction.trigger?.type,
        action,
      })),
    ),
  );
const destinations = await Promise.all(
  edges.map((edge) =>
    edge.action.destinationId ? figma.getNodeByIdAsync(edge.action.destinationId) : null,
  ),
);
const screenNavigation = ["NAVIGATE", "OVERLAY", "SWAP"];
const issues = [];
edges.forEach((edge, index) => {
  const destination = destinations[index];
  if (edge.action.type === "NODE" && !destination)
    issues.push({ rule: "broken-destination", ...edge });
  if (screenNavigation.includes(edge.action.navigation) && destination && !isScreen(destination))
    issues.push({ rule: "destination-not-a-screen", ...edge });
  if (
    edge.action.navigation === "CHANGE_TO" &&
    destination &&
    destination.parent?.type !== "COMPONENT_SET"
  )
    issues.push({ rule: "change-to-not-a-variant", ...edge });
});
const screens = page.findAll(isScreen);
const reachable = new Set(page.flowStartingPoints.map((start) => start.nodeId));
for (let grew = true; grew;) {
  grew = false;
  for (const edge of edges) {
    if (
      screenNavigation.includes(edge.action.navigation) &&
      reachable.has(edge.screenId) &&
      !reachable.has(edge.action.destinationId)
    ) {
      reachable.add(edge.action.destinationId);
      grew = true;
    }
  }
}
const overlayIds = new Set(
  edges
    .filter((edge) => edge.action.navigation === "OVERLAY")
    .map((edge) => edge.action.destinationId),
);
for (const overlayId of overlayIds) {
  const overlay = screens.find((screen) => screen.id === overlayId);
  const closable =
    overlay?.overlayBackgroundInteraction === "CLOSE_ON_CLICK_OUTSIDE" ||
    edges.some(
      (edge) => edge.screenId === overlayId && ["CLOSE", "BACK"].includes(edge.action.type),
    );
  if (!closable) issues.push({ rule: "overlay-without-close", overlayId });
}
return {
  flowStartingPoints: page.flowStartingPoints,
  interactions: edges.length,
  unreachable: page.flowStartingPoints.length
    ? screens.filter((screen) => !reachable.has(screen.id)).map(({ id, name }) => ({ id, name }))
    : "no flow starting point",
  issues,
};
```
