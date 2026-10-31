# Wikimind prototypes

Front-end-only prototypes for **Wikimind**: a read-only surface that exposes the knowledge inside Asoka (a "digital human" sysadmin agent) to customers. Everything is faked in the browser. No backend, no build tooling beyond `build.py`.

Brief: https://docs.google.com/document/d/1hVtsbMiSN-4_3rn8jfR_p6HhGTC3foUkvRIHkwXpc3c (Asoka design on-site, "How do you expose everything in a digital human's brain?").

## Layout

```
variants/          one self-contained HTML file per variant (edit these)
shell.html         the tab switcher template
build.py           bundles variants into dist/index.html
dist/index.html    open this in a browser to switch between variants
```

Open a single variant directly (`variants/wikimind3.html`) when iterating on it. Run `python3 build.py` to refresh the bundle.

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
