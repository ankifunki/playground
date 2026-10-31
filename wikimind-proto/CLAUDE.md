# Wikimind prototypes

Front-end-only React prototypes for **Wikimind**: a read-only surface that exposes the knowledge inside Asoka (a "digital human" sysadmin agent) to customers. Everything is faked in the browser. No backend. Vite + React + TypeScript, run locally.

Brief: https://docs.google.com/document/d/1hVtsbMiSN-4_3rn8jfR_p6HhGTC3foUkvRIHkwXpc3c (Asoka design on-site, "How do you expose everything in a digital human's brain?").

## Layout

```
src/App.tsx                 variant switcher (?v=b..f), loads one variant at a time
src/useVariantCss.ts        mounts a variant's stylesheet only while it is on screen
src/fonts.css               Figtree, DM Mono (@fontsource) and Geist Serif (geist package), bundled locally
src/variants/<name>/        one folder per variant: index.tsx, store.tsx (state + actions), components, styles.css
legacy/                     original single-file HTML for variants not yet ported (shown in an iframe)
```

Each variant's CSS is the original stylesheet, loaded with `?inline` and injected while the variant is mounted, so generic class names in different variants never collide.

## Running it

Local only. Do not deploy (no Vercel or other hosting).

```
npm install
npm run dev        # http://localhost:5173/?v=f  (f = Wikimind 3)
npm run build      # type-check and production build into dist/
```

## Demo controls (Wikimind 3)

- `L`: Maria answers the flat-renewals question. Asoka rewrites the card (old sentence struck, new one written in). Also reachable via "Simulate her reply" in Questions. There is no automatic timer.
- `A`: the person Asoka is asking answers the visitor's newest open question immediately. Otherwise they answer 15 seconds after the visitor taps "Ask".
- `/` focuses the ask box. Esc closes the source sheet, then the conversation.
- Unknown questions offer "Ask <name>" or "Not now". Undo is available for 5 seconds after asking. Asoka never contacts anyone without the visitor's tap.

## Variants

| Key | File | Idea |
|---|---|---|
| b | warden-team.html | Agent fleet: avatars, brain map, operating-profile dials, traces |
| c | warden-v2.html | Decision classes, spot checks, correct-on-example |
| d | wikimind.html | Pages with arrival context, actions, relationship map |
| e | wikimind2.html | Ask-first, semantic-zoom map, claims, time travel, policy vs. practice |
| f | wikimind3.html | **Current focus.** Cited sentences, Questions and Changes views, live learning loop, persistent composer with voice and attachments |

## Design goals (from the brief)

Trust, alive and living, AI-native, beautiful. Two specs: **Page** (trust is the central challenge: evidence tied to each block, git-blame style provenance) and **Home** (front page that makes Asoka's scale and aliveness obvious).

Audiences in priority order: CIO buyer in a demo, architects and developers (real users), business users arriving from Asoka's citations in Slack.

## Decisions already made (don't relitigate without asking)

- **Never use neumorphism / soft-UI.** Not for anything, not even the map.
- **Nothing should look or read like a wiki.** No gray bordered boxes, blue bracketed citations, infoboxes, underlined tabs, or wiki vocabulary (Talk, History, References, See also, Did you know, Featured article). Borrowed *ideas* are fine if restyled.
- House visual language: fog background `#F7F8F6`, white cards with soft shadows (no hairline borders), indigo accent `#4B45D6`, Figtree for UI, Newsreader serif for headlines and long reading text. Full dark mode via CSS variables.
- Trust by exception: solid facts carry no mark. Only uncertain, changed, unofficial, or stale content gets marked.
- Ask is persistent at the bottom (composer with attachments, voice, scope toggle), not a header search.
- Unknown questions get "I don't know that yet, and I won't guess," then become open questions.

## Craft rules

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
- Fold Questions and Changes into the page itself if the separate views still feel too wiki-like.
