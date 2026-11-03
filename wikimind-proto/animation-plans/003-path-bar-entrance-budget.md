# 003 — Bring the path-bar entrance inside budget, and play it once

- **Status**: DONE
- **Commit**: da6b3f9
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files (`src/variants/wikimind8/Page.tsx`, `src/variants/wikimind8/styles.css`), ~10 lines

## Problem

The "Path to full automation" bars appear on Home and on the page. Each of about 117 bars grows in with a 5ms stagger plus a 600ms grow, so the last bar settles around 1.2s after mount. The bars are data the reader is trying to read. The entrance replays on every visit to Home, which happens many times a day, so it reads as a delay, not as information.

```tsx
/* src/variants/wikimind8/Page.tsx:47 — current */
<div className="path-bars" aria-hidden="true" ref={ref} style={{ width: n * 6 - 3 }}>{Array.from({ length: n }, (_, i) => <i key={i} className={i < own ? 'own' : i < own + ask ? 'ask' : 'gap'} style={{ animationDelay: `${i * 5}ms` }} />)}</div>
```

```css
/* src/variants/wikimind8/styles.css:875, :879 — current */
.path-bars i{flex:1;border-radius:1px;transform-origin:bottom;animation:pbIn .6s var(--eo) both}
@keyframes pbIn{from{transform:scaleY(.1);opacity:0}}
```

## Target

Keep a brief wipe the first time per browser session. The stagger is 1.5ms per bar, so about 175ms across 117 bars. Each bar grows for 240ms with the strong ease-out, for a total of 300ms or less. After that, bars render instantly.

```tsx
/* target — Page.tsx, inside PathBar */
const [play] = useState(() => { try { if (sessionStorage.getItem('w8-bars')) return false; sessionStorage.setItem('w8-bars', '1'); return true } catch { return false } })
…
<div className={'path-bars' + (play ? ' play' : '')} … >{Array.from({ length: n }, (_, i) => <i key={i} className={…} style={play ? { animationDelay: `${Math.round(i * 1.5)}ms` } : undefined} />)}</div>
```

```css
/* target — append at the END of styles.css */
.path-bars i{animation:none}
.path-bars.play i{animation:pbIn 240ms var(--eo) both}
```

## Repo conventions to follow

- `--eo` is the strong ease-out token, `cubic-bezier(.23,1,.32,1)`.
- `sessionStorage` and `localStorage` access in this repo is always wrapped in `try/catch`. Exemplar: the history read in `Omni.tsx`, `JSON.parse(localStorage.getItem('w7-asks') || '[]')` inside a `try`.
- The reduced-motion rule `@media (prefers-reduced-motion:reduce){.path-bars i{animation:none}}` already exists. Keep it.

## Steps

1. In `Page.tsx`, inside `export function PathBar(...)`, add the `play` state line shown in **Target** near the other hooks. `useState` is already imported.
2. In `Page.tsx`, change the `.path-bars` div's `className` and each bar's `style` as shown in **Target**.
3. Append the CSS from **Target** to the end of `styles.css`.

## Boundaries

- Do NOT change bar widths, gaps, colours, or the width-fitting `ResizeObserver` logic.
- Do NOT touch the agent mini bars (`.mini`).
- STOP and report on drift.

## Verification

- **Mechanical**: from `wikimind-proto/`, run `npx tsc -b`, which should print nothing, then `npm run build`, which should print `✓ built`.
- **Feel check** (`npm run dev`, `/?v=k` in a fresh tab):
  - On first load, the bars wipe in left to right and settle in about 0.3s.
  - Navigate to the page and back to Home. The bars are simply there, with no replay.
  - In the Animations panel at 10%, the last bar finishes by about 415ms of real time (175ms delay plus 240ms).
- **Done when**: no bar animation runs after the first in a session, and the first run totals 300ms or less (allowing for frame rounding).
