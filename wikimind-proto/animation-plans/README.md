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

## Backlog (not planned)

- **Cohesion:** `cubic-bezier(.32,.72,0,1)` is hand-typed 5 times and `cubic-bezier(.77,0,.175,1)` twice. Add `--ease-drawer` and `--ease-in-out` tokens next to `--eo`.
- **Dead CSS:** about 162 rules for `.fo`, `.fx` and `.fl` came over from Wikimind 7. No Wikimind 8 component uses them; delete them.
- **Missed opportunity (optional):** expanding an agent row on Home makes the rows below jump. A `grid-template-rows: 0fr → 1fr` transition at 250ms `--eo` would smooth it. It's a layout animation, but on a rare action, so it's acceptable if wanted.
