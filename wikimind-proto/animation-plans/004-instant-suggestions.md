# 004 — Open the ask bar's suggestions instantly

- **Status**: DONE
- **Commit**: da6b3f9
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file (`src/variants/wikimind8/styles.css`), 1 line

## Problem

The suggestion list (recent questions, questions from what just changed, and the `/` agent list) fades in over 250ms every time the ask bar is focused. That includes the `/` keyboard shortcut. Keyboard-initiated surfaces opened tens of times a day should never animate, because the fade makes them feel delayed. Raycast's palette has no open animation for this reason. The keyframe also restarts from zero if you blur and refocus quickly.

```css
/* src/variants/wikimind8/styles.css:388 — current */
.om-sug{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;animation:fade .25s ease both}
```

## Target

```css
/* target — append at the END of styles.css */
.om-sug{animation:none}
```

The answer card (`.om-ans`) keeps its entrance. It appears after an explicit submit, which is occasional, and plan 002 handles its reduced-motion fallback.

## Repo conventions to follow

- Append overrides at the end of `styles.css`, as every Wikimind 8 refinement does.

## Steps

1. Append `.om-sug{animation:none}` to the end of `src/variants/wikimind8/styles.css`.

## Boundaries

- Do NOT change `.om-ans`, `.om::before` (the focus fade) or the bar morph.
- STOP and report on drift.

## Verification

- **Mechanical**: from `wikimind-proto/`, `npm run build` should print `✓ built`.
- **Feel check** (`npm run dev`, `/?v=k`):
  - Press `/`. The agent list is there on the very next frame.
  - Click into the bar. The suggestions appear with no fade.
  - Rapidly blur and refocus. Nothing flickers or restarts.
- **Done when**: no animation runs on `.om-sug`.
