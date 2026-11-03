# 002 — Give every `rise` entrance a reduced-motion fallback

- **Status**: DONE
- **Commit**: da6b3f9
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file (`src/variants/wikimind8/styles.css`), ~6 lines

## Problem

Several Wikimind 8 entrances use the `rise` keyframe, which moves the element 4–6px upward. They have no `prefers-reduced-motion` handling, so motion-sensitive readers still get positional movement.

```css
/* src/variants/wikimind8/styles.css — current */
:391  .om-ans{… animation:rise .3s var(--eo) both}          /* ask answer card */
:929  .wt-lock{… animation:rise .35s var(--eo) both}        /* Watch it: "Locked for approval" */
:944  .wt-ah li.in{animation:rise .35s var(--eo) both}      /* Watch it: approval history rows */
:949  .wt-agent{… animation:rise .35s var(--eo) both}       /* Watch it: agent check banner */
:997  .mv8 li.in{animation:rise .4s var(--eo) both}         /* Home: What's moving new item */
:1118 .ags8-d{… animation:rise .3s var(--eo) both}          /* Home: expanded agent row */
```

The tour card moves too. Its `.tour-card` rule sets `transform:translateY(4px)` and `.tour-card.on` sets `transform:none` with a transition.

## Target

Reduced motion means fewer and gentler animations, not zero. Keep the opacity entrance and drop the movement.

```css
/* target — append at the END of src/variants/wikimind8/styles.css */
@media (prefers-reduced-motion:reduce){
  .om-ans,.wt-lock,.wt-ah li.in,.wt-agent,.mv8 li.in,.ags8-d{animation:fade .2s ease both}
  .tour-card{transform:none}
  .tour-card.on{transition:opacity .2s ease}
}
```

The `fade` keyframe already exists in this file (`@keyframes fade{from{opacity:0}}`).

## Repo conventions to follow

- Existing reduced-motion blocks in this file map movement to `fade`. Imitate this exemplar: `@media (prefers-reduced-motion:reduce){.rail-push,.rail-pop{animation:fade .2s both}}`.
- Append at the end of `styles.css`.

## Steps

1. Append the CSS from **Target** to the end of `src/variants/wikimind8/styles.css`.

## Boundaries

- Do NOT change any non-reduced-motion rule.
- Do NOT remove the `rise` keyframe.
- If a selector above no longer exists at its line, search for it by name. If it's gone, STOP and report.

## Verification

- **Mechanical**: from `wikimind-proto/`, `npm run build` should print `✓ built`.
- **Feel check** (`npm run dev`, `/?v=k`): in DevTools, open Rendering and emulate `prefers-reduced-motion: reduce`, then:
  - Expand an agent row on Home. The details fade in without sliding.
  - Ask a question in the ask bar. The answer card fades in without rising.
  - Scroll Discount approvals to Watch it. The lock pill, agent banner and history rows fade in place.
  - Press `T`. The tour card fades in without moving.
  - Turn emulation off and confirm the original rise is back.
- **Done when**: every selector listed has an opacity-only animation under reduced motion.
