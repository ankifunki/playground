# 005 — Press, hover and hamburger polish

- **Status**: DONE
- **Commit**: da6b3f9
- **Severity**: LOW
- **Category**: Physicality & origin; Accessibility; Easing & duration
- **Estimated scope**: 1 file (`src/variants/wikimind8/styles.css`), ~6 lines

## Problem

Three small things, all in `src/variants/wikimind8/styles.css`:

1. **Press scale is too strong.** Icon buttons compress to 92%. Press feedback should be 0.95–0.98 (target 0.97), or it reads as a squish rather than a confirmation.
   ```css
   /* :1054 — current */
   .ib:active,.why:active,.hwk-play:active,.om-go:not(:disabled):active{transform:scale(.92)}
   ```
2. **Ungated hover lift on the source icons.** On touch devices a tap fires a sticky `:hover`, which leaves the icon lifted and its tooltip open.
   ```css
   /* :1160 — current */
   .srcs-i:hover,.srcs-i:focus-visible{transform:translateY(-2px);background:var(--linkb);color:var(--link);z-index:2}
   /* :1161 — current */
   .srcs-i:hover::after,.srcs-i:focus-visible::after{opacity:1;transform:translate(-50%,0)}
   ```
3. **The hamburger-to-close morph is over budget.** It runs at 320ms, past the 300ms UI budget for a control used often.
   ```css
   /* :596 — current */
   .hb i{…;transition:transform .32s var(--eo),opacity .2s ease,top .32s var(--eo)}
   ```

## Target

```css
/* target — append at the END of styles.css */
.ib:active,.why:active,.hwk-play:active,.om-go:not(:disabled):active{transform:scale(.97)}
.srcs-i:hover{transform:none;background:var(--soft);color:var(--ink2)}
.srcs-i:hover::after{opacity:0;transform:translate(-50%,4px)}
@media (hover:hover) and (pointer:fine){
  .srcs-i:hover{transform:translateY(-2px);background:var(--linkb);color:var(--link);z-index:2}
  .srcs-i:hover::after{opacity:1;transform:translate(-50%,0)}
}
.hb i{transition:transform 240ms var(--eo),opacity 160ms ease,top 240ms var(--eo)}
```

`:focus-visible` keeps showing the lift and tooltip for keyboard users on every device.

## Repo conventions to follow

- Hover motion in this file lives inside `@media (hover:hover) and (pointer:fine)`. Exemplar: the block that starts `@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){ .ib .ic,…`.
- Press feedback elsewhere uses `scale(.97)`. Exemplar: `.tour-b:active{transform:scale(.97)}`.

## Steps

1. Append the CSS from **Target** to the end of `src/variants/wikimind8/styles.css`.

## Boundaries

- Do NOT change icon hover animations (`ic*` keyframes) or the agent icon animations.
- STOP and report on drift.

## Verification

- **Mechanical**: from `wikimind-proto/`, `npm run build` should print `✓ built`.
- **Feel check** (`npm run dev`, `/?v=k`):
  - Press and hold an icon button (the activity icon, or the trace icon on a block). It dips slightly, not visibly squashed.
  - In DevTools device mode (touch), tap a source icon in the Home footer. It does not stay lifted. On desktop, hovering lifts it and shows the name, and Tab-focusing does too.
  - Open and close the nav. The hamburger morphs to × and back crisply, in about a quarter second.
- **Done when**: all three behaviours match.
