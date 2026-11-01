# Wikimind prototypes

Front-end-only React prototypes for **Wikimind**: a read-only surface that exposes the knowledge inside Asoka to customers. **Asoka is not one agent:** it is a team of specialist sysadmin agents, each with one job (Approvals, Access, Security, Finance ops, Integrations, Support). Everything is faked in the browser. No backend. Vite + React + TypeScript, run locally.

Brief: https://docs.google.com/document/d/1hVtsbMiSN-4_3rn8jfR_p6HhGTC3foUkvRIHkwXpc3c (Asoka design on-site, "How do you expose everything in a digital human's brain?").

## Layout

```
src/App.tsx                 variant switcher (?v=b..g), loads one variant at a time
src/useVariantCss.ts        mounts a variant's stylesheet only while it is on screen
src/fonts.css               Figtree, DM Mono (@fontsource) and Geist Serif (geist package), bundled locally
src/variants/<name>/        one folder per variant: index.tsx, a store (state + actions), components, data.ts, styles.css
```

Each variant's CSS is the original stylesheet, loaded with `?inline` and injected while the variant is mounted, so generic class names in different variants never collide.

## Running it

```
npm install
npm run dev        # http://localhost:5173/?v=g  (g = Wikimind 4, the default)
npm run build      # type-check and production build into dist/
```

Hosted for preview on Vercel (project `wikimind-proto`, root directory `wikimind-proto`, Vite build) behind a password page: `middleware.js` reads `WIKIMIND_PASSWORD` from the Vercel env (never commit it). The project is not Git-connected, so deploy explicitly after pushing.

## Demo controls (Wikimind 3 and 4)

- `L`: Maria answers the flat-renewals question. The Approvals agent rewrites the card (old sentence struck, new one written in). Also reachable via "Simulate her reply" in Questions. There is no automatic timer.
- `A`: the person an agent is asking answers the visitor's newest open question immediately. Otherwise they answer 15 seconds after the visitor taps "Ask".
- Wikimind 4 only: `S` (or the Demo link at the bottom of Home, or `#approvals-slack`) opens the page as a visitor arriving from a Slack citation. Maria also answers on her own about 20 seconds after the page opens.
- `/` focuses the ask box. Esc closes the source sheet, then the conversation.
- Unknown questions offer "Ask <name>" or "Not now". Undo is available for 5 seconds after asking. No agent contacts anyone without the visitor's tap.

## Variants

| Key | Folder | Idea |
|---|---|---|
| b | warden-team | Agent fleet: avatars, brain map, operating-profile dials, traces. The simulation is an engine (`engine.ts`) React subscribes to via `useSyncExternalStore` |
| c | warden-v2 | Decision classes, spot checks, correct-on-example |
| d | wikimind | Pages with arrival context, actions, relationship map |
| e | wikimind2 | Ask-first, semantic-zoom map, claims, time travel, policy vs. practice. Map gestures move the camera through a ref; level and selection are React state |
| f | wikimind3 | Cited sentences (each citation is a small icon pile, `Pile.tsx`), icon section rail and tabs, Questions and Changes views, live learning loop, persistent composer with voice and attachments |
| g | wikimind4 | **Current focus.** Wikimind 3 without the wiki scaffolding: each sentence shows its provenance in a margin (git-blame style, sheet on phones), answers are written into the page beside what they rest on, arrival from Slack, a live line and one feed on Home. `Claim.tsx` (sentence, margin, provenance, source pile), `Answer.tsx` (answer blocks). Section nav with hover-animated icons: a rail at 1240px+, sticky chips below |

## Design goals (from the brief)

Trust, alive and living, AI-native, beautiful. Two specs: **Page** (trust is the central challenge: evidence tied to each block, git-blame style provenance) and **Home** (front page that makes Asoka's scale and aliveness obvious).

Audiences in priority order: CIO buyer in a demo, architects and developers (real users), business users arriving from Asoka's citations in Slack.

## Decisions already made (don't relitigate without asking)

- **Never use neumorphism / soft-UI.** Not for anything, not even the map.
- **Nothing should look or read like a wiki.** No gray bordered boxes, blue bracketed citations, infoboxes, underlined tabs, or wiki vocabulary (Talk, History, References, See also, Did you know, Featured article). Borrowed *ideas* are fine if restyled.
- House visual language: warm stone background `#F8F6F2` with warm neutrals, white cards with soft shadows (no hairline borders), indigo accent `#4B45D6`, Geist for UI and body, Geist Mono for tags, labels and counts, Geist Serif for headlines and long reading text. Full dark mode via CSS variables.
- Trust by exception: solid facts carry no mark. Only uncertain, changed, unofficial, or stale content gets marked.
- Ask is persistent at the bottom (composer with attachments, voice, scope toggle), not a header search.
- Unknown questions get "No agent knows that yet, and none will guess," then become open questions that the relevant agent asks a person.
- **Asoka is a team of specialist agents, not one entity.** Never write "Asoka is…" or "Asoka learned…" as if it were a single actor. Every fact, change, question and answer is credited to the agent that did it (`agents.tsx`: square indigo tile + name; sources stay round and neutral). Home shows each agent's reliability, share running on its own, and what is holding it back.

## Craft rules

- **Wikimind 3 and 4 design system** (stay on it): type 12 / 13 / 14 / 15 / 16 / 18 / 21 / 24 / 28 / 38px plus the clamped display headline; radii 8 (small controls), 14 (inner panels), 20 (cards), 24 (floating surfaces: chat, composer, sheets), pills 999; spacing in 4px steps. Both are now airier: 24px card padding (20px on phones), 48px between Home's main sections, 64px above page section headings. Both show sources as an icon pile (one Lucide icon per source kind, green dot when verified) rather than names, and keeps UI copy to what a person needs to act: no explanatory sublines. Labels and kickers are Geist Mono 12px. Line work: 1px `--hl` hairlines for structure, 2px square bars for data, 1.5px trends. Headlines `text-wrap: balance`, body `text-wrap: pretty`.
- Motion: custom ease-out `cubic-bezier(.23,1,.32,1)`, press feedback `scale(.97)`, hover only inside `@media (hover:hover) and (pointer:fine)`, `-webkit-tap-highlight-color: transparent`, reduced-motion keeps fades but drops movement (Emil Kowalski's design-engineering skill rules).
- Entrances animate only on view change; reveals animate only the element just opened (see the `S.entering` / `S.flash` pattern in wikimind.html).
- Watch for **CSS class collisions**. Two real bugs came from reusing generic class names (`.x`, `.cite`, `.ck`) across components. Prefer component-specific names.
- Verify layout at 390px and 1100px+ before calling something done. Playwright screenshots worked well for this.

## Known gaps

- Only "Opportunity approvals" has full content in Wikimind 3. Other links open preview cards.
- Answers are local keyword matches. Live Claude answers (`window.claude.use('sample')`) only work when published as a claude.ai artifact, and fall back gracefully elsewhere.
- Attachments are not actually read. Answers are canned per file type.
- Voice uses the browser's SpeechRecognition API (Chrome, Safari).

## Next up

- Install and apply the `stageshow` skill: `npx skills add benjitaylor/skills --skill stageshow` (couldn't be found in public indexes from claude.ai; check the repo).
