# 001 — Make the folio mark → back-arrow morph clean

- **Status**: TODO
- **Commit**: dbdb7b4
- **Severity**: MEDIUM
- **Category**: Physicality & origin (shape continuity), Easing & duration
- **Estimated scope**: 1 file (`site/scripts/sync-case-studies.mjs`), ~60 lines in one inline `<script>`

## Problem

On the case-study folio bar, hovering the breadcrumb morphs Ankit's AJ mark into a back arrow. The in-between
frames are not clean. At ~25% of the way the J's stroke pinches into **detached threads and dots**, and the
diagonal swells into a **blob**. The arrow only reads at ~75%. Captured frames (40 ms apart, 4×):
`/tmp/claude-0/-home-user-playground/3bf504c7-ef97-5f58-810d-e9b635f82401/scratchpad/mo-zoom.png`.

Cause: the morph pairs the two outlines **globally by arc length** and picks a single best rotation. The AJ
outline is mostly the J's long curl plus the diagonal, while the arrow outline is mostly the shaft, so whole
strokes map onto the wrong parts. Long runs of the J collapse onto a few millimetres of the arrow, which turns
them into zero-width threads, and other runs cross each other, which turns them into blobs and holes. Linear
interpolation of 140 points can't hide that.

Current code, `site/scripts/sync-case-studies.mjs:55-70` (inside the `BAR` template's `<script>`):

```js
  var N=140,NS='http://www.w3.org/2000/svg',reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sample(d,map){ ... getPointAtLength(L*i/N) ... }
  function area(P){ ... }
  var A=sample(path.getAttribute('d'),function(x,y){return [0.75+x*0.517,0.5+y*0.517]});
  var B=sample('M2.6 8 7.1 3.5 8.3 4.7 5.85 7.15H13.4V8.85H5.85L8.3 11.3 7.1 12.5Z',function(x,y){return [x,y]});
  if((area(A)>0)!==(area(B)>0))B.reverse();
  var best=0,bd=1e9;for(var k=0;k<N;k++){ ...single best cyclic shift... }
  B=B.slice(best).concat(B.slice(0,best));
  function draw(t){ ...linear lerp of A[i]→B[i]... }
  var t=0,to=0,raf=0,last=0,DUR=320;
  function step(now){ ... draw(1-Math.pow(1-t,3)); ... }
```

## Target

**1. Anchored, piecewise correspondence.** Each part of the mark morphs into the matching part of the arrow:

- the AJ's **diagonal "/"** becomes the arrow's **chevron "<"**;
- the AJ's **J stroke** becomes the arrow's **shaft "—"**.

Anchor pairs, in traversal order. AJ coordinates are in the mark's own 28×29 space, before the
`0.75 + x*0.517` / `0.5 + y*0.517` mapping. Arrow coordinates are in the 16×16 space.

| # | AJ point (28×29) | Arrow point (16×16) | Meaning |
|---|---|---|---|
| 1 | (22.2, 0.6) | (7.1, 3.5) | top of mark ↔ upper chevron end |
| 2 | (26.6, 18.7) | (13.4, 7.15) | J right side, bottom of straight ↔ shaft top-right |
| 3 | (20.3, 28.6) | (13.4, 8.85) | bottom of J curl ↔ shaft bottom-right |
| 4 | (20.2, 7.7) | (5.85, 8.85) | top of J inner edge ↔ shaft meets lower chevron |
| 5 | (1.2, 28.4) | (7.1, 12.5) | foot of diagonal ↔ lower chevron end |
| 6 | (10.5, 15.5) | (2.6, 8.0) | middle of diagonal's outer edge ↔ arrow tip |

Algorithm (replace `sample`, `area`, the rotation search and `draw` with this):

1. **Sample densely.** Sample each outline at **M = 1200** points with `getPointAtLength`. Keep the arc length
   of each point. Apply the existing coordinate mapping to the AJ points.
2. **Snap the anchors.** For each table row, snap the AJ point to the AJ sample nearest to it (after mapping) and
   the arrow point to the nearest arrow sample. Record both indices.
3. **Check the order.** The anchor indices must increase cyclically in the same direction on both outlines. If the
   arrow's run backwards relative to the AJ's, reverse the arrow sample array and re-snap. Add a
   `console.assert` so a wrong order is caught in development.
4. **Resample each segment.** For each segment k between anchor k and anchor k+1 (cyclic), resample both
   outlines' segment by arc length to the same count:
   `n_k = max(8, round(N * max(lenA_k/LA, lenB_k/LB)))`
   - Use **N = 240** as the target total.
   - `lenA_k` / `lenB_k` are the segment arc lengths; `LA` / `LB` are the total outline lengths.
   - Concatenate the segments to get arrays A and B of equal length.
5. **Interpolate linearly.** Same as now: `A[i] + (B[i] - A[i]) * e`, where `e` is the eased progress.
6. **Exact ends.**
   - When `e === 0`, restore the original AJ `d` with `transform="translate(0.75 0.5) scale(0.517)"`.
   - When `e === 1`, set the arrow path `d` exactly.
   - This keeps the resting states pixel-identical to the real assets.

**2. Mask the middle with a touch of blur.** During the morph, set `svg.style.filter = 'blur(' + (0.5 * Math.sin(Math.PI * e)).toFixed(2) + 'px)'`. It peaks at 0.5px in the middle and is exactly 0 at both ends. Clear `filter` when the morph settles.

**3. Timing.**

- **Hover in:** 260ms, eased with ease-out-quart, `e = 1 - (1 - t)^4`. This approximates `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Hover out:** 200ms, same curve. Leaving should be quicker than arriving.
- **Interruptible:** keep the current rAF loop that reverses from the current `t`. Do not restart from 0.
- **Reduced motion:** keep the existing instant jump.

Do not change the text swap (`.pf-title` / `.pf-back` CSS), the link, or any other bar styles.

## Repo conventions to follow

- The bar is built as a template string `BAR` in `site/scripts/sync-case-studies.mjs`. Its morph is an inline
  ES5-style IIFE (`var`, `function`, no modules, no dependencies).
- Keep that style and keep it in the same `<script>` block.
- No new files and no packages.
- Easing in this repo is `--ease: cubic-bezier(0.22, 0.8, 0.2, 1)` (CSS). For JS-driven motion, ease-out-quart
  is the agreed stand-in for the strong ease-out curve `cubic-bezier(0.23, 1, 0.32, 1)`.

## Steps

1. In `site/scripts/sync-case-studies.mjs`, inside the `BAR` template's `<script>`, replace lines 55–70 (from
   `var N=140` through the end of `step`) with the algorithm above. Keep the event listeners below it unchanged.
2. Run `node site/scripts/sync-case-studies.mjs` to regenerate `site/public/work/*/index.html`.
3. Serve `site/public` (`python3 -m http.server 3124` from `site/public`) and open
   `http://localhost:3124/work/multi-ticket/index.html` at 1440×900.

## Scope boundaries

- Only the morph script. Do not touch the deck shell (`case-study/index.html`), the decks' `build.py` files, or the
  homepage.
- Do not add libraries (no flubber, no GSAP).

## Verification

1. **Frame check.** With Playwright at deviceScaleFactor 4, hover `.pf-home` and screenshot `.pf-ico` every 30ms
   for 300ms. Every frame must be one solid, connected shape or a clean two-part "<" + "—".
   - Fail if any frame has detached dots or threads thinner than ~0.6px at 16px size.
   - Fail if a stroke inverts into a hole.
2. **Ends.** At rest the icon must match the current AJ render pixel-for-pixel; fully hovered, it must match the
   arrow render.
3. **Reverse mid-way.** Hover for 120ms, then leave. The shape must reverse from where it is, with no jump.
4. **Feel check.**
   - In Chrome DevTools → Animations, set speed to 10%, hover in and out, and watch for crossing strokes.
   - Then at 100%: the J should read as straightening into the shaft while the diagonal folds into the chevron.
5. Console has no assertion failures and no errors.
