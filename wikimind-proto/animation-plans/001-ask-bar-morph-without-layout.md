# 001 — Morph the ask bar with clip-path, not width/height

- **Status**: DONE
- **Commit**: da6b3f9
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files (`src/variants/wikimind8/styles.css`, `src/variants/wikimind8/Omni.tsx`), ~25 lines

## Problem

The ask bar (Wikimind 8) shrinks to an "Ask anything" pill while you read and grows back on click or `/`. The morph animates layout properties, so every frame re-runs layout and paint. It fires on every scroll-direction change, tens of times a day, while the page is also scrolling.

```css
/* src/variants/wikimind8/styles.css:377 — current (base rule, later overridden for radius/height) */
.om-bar{width:100%; … height:52px; … border-radius:12px; box-shadow:var(--sh2); …
  transition:width .35s var(--eo),height .35s var(--eo),border-radius .35s var(--eo)}
/* styles.css:386 — current */
.om.mini .om-bar{width:196px;height:40px;border-radius:999px;cursor:text;padding:0 16px}
```

Later in the same file, the "Ask bar (Wikimind 6 look)" block sets `.om-bar{border-radius:16px;border:0;box-shadow:var(--sh2);height:56px}`. Another block sets `.om{box-sizing:content-box;max-width:760px;padding:0 40px}` and `.om-bar,.om-sug,.om-ans{box-sizing:border-box;width:100%}`.

```tsx
/* src/variants/wikimind8/Omni.tsx:87 — current */
<div className={'om' + (mini ? ' mini' : '') + ((focus || ans) && !mini ? ' act' : '')}>
  …
  <form className="om-bar" …>
    <Icon name="search" size={16} />
    {scope && !mini && <span className="om-chip">…</span>}
    <input … placeholder={mini ? 'Ask anything' : …} />
    {!mini && <span className="om-scope tk">This workspace</span>}
    {!mini && <kbd className="om-k">/</kbd>}
    {!mini && <button className="om-go" …>…</button>}
  </form>
```

## Target

The bar's box never changes size. In mini, a `clip-path` reveals only a 196×40 pill in the centre. The shadow comes from a `drop-shadow` filter on a new wrapper, so it follows the clipped shape. The full bar's contents fade out and a centred pill label fades in. Only `clip-path` and `opacity` animate.

```css
/* target — append at the END of src/variants/wikimind8/styles.css */
.om-shell{width:100%;filter:drop-shadow(0 1px 2px rgba(20,30,25,.06)) drop-shadow(0 14px 34px rgba(20,30,25,.1))}
:root[data-theme="dark"] .om-shell{filter:drop-shadow(0 1px 2px rgba(0,0,0,.4)) drop-shadow(0 14px 34px rgba(0,0,0,.35))}
.om-bar{position:relative;width:100%;height:56px;border-radius:16px;box-shadow:none;
  clip-path:inset(0 0 0 0 round 16px);
  transition:clip-path 250ms var(--eo)}
.om.mini .om-bar{width:100%;height:56px;padding:0 8px 0 16px;border-radius:16px;
  clip-path:inset(8px calc(50% - 98px) 8px calc(50% - 98px) round 999px)}
.om-bar>*:not(.om-pill){transition:opacity 150ms ease}
.om.mini .om-bar>*:not(.om-pill){opacity:0;pointer-events:none}
.om-pill{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:8px;
  font:400 14px var(--sans);color:var(--ink2);opacity:0;pointer-events:none;transition:opacity 150ms ease}
.om.mini .om-pill{opacity:1;transition-delay:80ms}
@media (prefers-reduced-motion:reduce){.om-bar{transition:none}}
```

## Repo conventions to follow

- The strong ease-out token is `--eo: cubic-bezier(.23,1,.32,1)`, defined on `:root` near the top of `styles.css`. Use it; don't inline a new curve.
- New rules are appended at the end of `styles.css`, which is how every Wikimind 8 refinement is layered. Example: the block headed `/* Ask bar: exactly the page column … */`.
- The `Icon` component is imported from `./Icon` in `Omni.tsx` already.

## Steps

1. In `Omni.tsx`, wrap the `<form className="om-bar" …>…</form>` element in `<div className="om-shell">…</div>`. Change nothing else about the form's attributes.
2. In `Omni.tsx`, as the first child inside the form, add: `<span className="om-pill" aria-hidden="true"><Icon name="search" size={15} />Ask anything</span>`.
3. In `Omni.tsx`, make the input's `placeholder` always `scope ? \`Ask the ${AG[scope].name} agent\` : 'Ask anything, or type / to pick an agent'` (drop the `mini ?` branch). The pill label now carries the mini text.
4. In `Omni.tsx`, remove the `!mini &&` guards on the scope chip, `.om-scope`, `.om-k` and `.om-go` so they stay mounted. They're hidden by opacity in mini, which keeps focus continuity and avoids layout shifts.
5. Append the CSS from **Target** to the end of `styles.css`.

## Boundaries

- Do NOT change the scroll logic that sets `mini` (the `useEffect` scroll handler) or the `/` keyboard handler.
- Do NOT touch `.om-sug`, `.om-ans` or `.om::before` (the focus fade).
- Do NOT add dependencies.
- If the excerpts above don't match the code (drift since `da6b3f9`), STOP and report.

## Verification

- **Mechanical**: from `wikimind-proto/`, run `npx tsc -b`, which should print nothing, then `npm run build`, which should print `✓ built`.
- **Feel check** (`npm run dev`, open `/?v=k`, open Discount approvals, scroll down then up):
  - The bar shrinks to a centred pill and grows back with no jitter, and nothing above it shifts.
  - In DevTools Performance, record a scroll that triggers the morph. Expect no Layout entries attributed to `.om-bar` during the 250ms.
  - In the Animations panel at 10%, the pill keeps fully rounded ends throughout, and its shadow hugs the pill rather than the full bar.
  - Clicking the pill focuses the input immediately, and you can type straight away.
  - With `prefers-reduced-motion` on (Rendering panel), the morph is instant and the opacity crossfade remains.
- **Done when**: `.om-bar` has no `width`, `height`, `border-radius` or `padding` transition, and every check above passes.
