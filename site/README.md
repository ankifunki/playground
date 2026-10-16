# joshiankit.com

The new portfolio. A Next.js site whose homepage is a typeset index of work. Case studies live as standalone pages elsewhere in this repo and are copied in at build time.

```bash
cd site
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Editing

- **Copy and projects:** `content/site.ts`. The About text there is a draft for Ankit to rewrite.
- **Case studies:** edit them where they live (Multi Location is `../case-study/index.html`). `scripts/sync-case-studies.mjs` copies each one into `public/work/<slug>/` before every dev or build run, wraps it in a full HTML document, and adds a "← Ankit Joshi" link back to the homepage. Those copies are git-ignored, so don't edit them.
- **Adding a case study:** add a folder with an `index.html`, add an entry to `CASE_STUDIES` in the sync script, and add a project to `content/site.ts` with the same `slug`.

## Password-protected work

Set `access: "password"` on a project. On the homepage its tile shows a "Password" chip and its `lockedMark` logo instead of the screens, which aren't sent to the browser. Add `redactCompany: true` to hide a confidential client's name behind a redaction bar. Every request under `/work/<slug>/`, the page and its images alike, goes through `middleware.ts` and redirects to `/unlock/<slug>/` until the visitor enters the password.

Environment variables (Vercel → Project → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `CASE_COOKIE_SECRET` | A long random string, e.g. from `openssl rand -hex 32` |
| `CASE_PASSWORD_<SLUG>` | One per locked project, e.g. `CASE_PASSWORD_MULTI_LOCATION` |

A correct password sets an httpOnly cookie scoped to that case study for 30 days. Changing a project's password signs everyone out of it. If either variable is missing, the project stays locked (fails closed).

## Deploying on Vercel

Import the repo, set **Root Directory** to `site`, and leave "Include files outside the root directory in the Build Step" on, because the sync script reads `../case-study`. Then point joshiankit.com at the project and retire the old WordPress install.
