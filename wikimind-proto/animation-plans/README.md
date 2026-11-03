# Animation plans — Wikimind 8

Written by `improve-animations` at commit `da6b3f9`, against `src/variants/wikimind8/`. Each plan is self-contained, so any agent can execute it without extra context. `/improve-animations execute <plan>` runs one in an isolated worktree and reviews the diff.

`plans/` at the repo root belongs to the case-study work, so these live here.

| # | Plan | Severity | Status |
|---|---|---|---|
| 001 | [Morph the ask bar with clip-path, not width/height](001-ask-bar-morph-without-layout.md) | HIGH | DONE |
| 002 | [Give every `rise` entrance a reduced-motion fallback](002-reduced-motion-for-rise.md) | MEDIUM | DONE |
| 003 | [Bring the path-bar entrance inside budget, and play it once](003-path-bar-entrance-budget.md) | MEDIUM | DONE |
| 004 | [Open the ask bar's suggestions instantly](004-instant-suggestions.md) | MEDIUM | DONE |
| 005 | [Press, hover and hamburger polish](005-press-and-hover-polish.md) | LOW | DONE |

## Recommended order

1. **004**: one line, no dependencies.
2. **002**: CSS only, no dependencies.
3. **005**: CSS only, no dependencies.
4. **003**: small TSX and CSS change.
5. **001**: the largest. It touches `Omni.tsx` structure; run it after 004 so the suggestion list is already instant.

002 and 004 both touch `.om-ans` / `.om-sug` neighbours but different selectors, so they don't conflict.

## Also applied (from find-animation-opportunities)

- The open question on Discount approvals resolves in place: one block whose warm note eases into a plain paragraph (background 600ms ease, padding 250ms `--eo`) while the new sentence fades in.
- Agent rows on Home and the Rules toggles open in place: a `grid-template-rows` 0fr → 1fr track (250ms `--eo`) with a 200ms opacity fade; closed content is `inert`.
- The "Verified by" value crossfades (200ms) when Dana's verification is withdrawn and restored.
- Wide row buttons (agent rows, nav pages, feed items) get an instant press tint; the In focus CTA nudges its arrow 2px on press (160ms `--eo`).

## Backlog (done)

- **Cohesion:** `--ease-drawer` (`cubic-bezier(.32,.72,0,1)`) and `--ease-in-out` (`cubic-bezier(.77,0,.175,1)`) now sit next to `--eo`; the six hand-typed copies use the tokens.
- **Dead CSS:** 167 rules and 4 keyframes (`foIn`, `foDeal`, `foPulse`, `foPop`) for Wikimind 7's `.fo`, `.fx` and `.fl` components are gone, and 14 mixed selectors were trimmed. Computed styles of every element on Home and the page match the old stylesheet (only mid-loop live-pulse opacity differs).
- **Missed opportunity:** agent rows opening in place shipped with the opportunities above.
