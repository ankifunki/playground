// Copies the standalone case studies into public/work/<slug>/ before dev and build.
// The source folders stay the place you edit; the copies are generated and git-ignored.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(site, "..");

const CASE_STUDIES = [
  { slug: "multi-location", title: "Multi Location", from: "case-study", copy: ["img", "assets"] },
  { slug: "multi-ticket", title: "Multi Ticket", from: "multi-ticket", copy: ["img"] },
  { slug: "order-issue-reporting", title: "Order Issue Reporting", from: "instacart", copy: ["img"] },
];

// The portfolio's folio bar, added to the portfolio copy only: Ankit's mark (home) / the case study. It sits above
// the deck (the shell leaves --top for it), on the same dark canvas, and on large screens its edges line up with the
// slide content. Slide controls stay with the deck itself (its pill at the bottom).
const AJ_PATH =
  "M22.2,0.6c2.1-0.7,3.5,0.9,3.5,0.9c0.9,0.9,0.9,1.9,0.9,1.9v15.3c0,3,0,4.9-0.8,6.6c-0.9,2.2-3.4,3.5-5.5,3.5c-1.9,0-4.1-1-4.1-3.3c0-1.6,1.2-2,1.8-2c0.9,0,1.8,0.7,1.8,1.9c0,0.2,0,0.5-0.1,0.7l0,0.5c0,0.5,0,1.2,0.9,1.2c1.6,0,1.6-2.1,1.6-4.1l0-17L9.3,27h2.3l-0.8,1.4H8.5H3.1H1.2L2,27h1.9C6.4,23,17.7,5.6,20.3,2C20.3,2,21.1,0.9,22.2,0.6z";
const BAR = (title) => `<header class="pf-bar">
<a href="/" class="pf-home" aria-label="Ankit Joshi, all work"><svg viewBox="0 0 28 29" aria-hidden="true"><path d="${AJ_PATH}"/></svg></a>
<span class="pf-sep" aria-hidden="true">/</span><span class="pf-title">${title}</span>
</header>
<style>
:root{--top:calc(48px + env(safe-area-inset-top,0px));--safe-top:0px}
.pf-bar{position:fixed;z-index:20;inset:0 0 auto;height:var(--top);display:flex;align-items:center;gap:10px;
  padding:env(safe-area-inset-top,0px) max(24px,env(safe-area-inset-right,0px)) 0 max(24px,env(safe-area-inset-left,0px));
  background:#0E1011;color:#EEF1F1;font:500 15px/1 var(--head);letter-spacing:-.01em}
.pf-home{display:grid;place-items:center;margin:-8px;padding:8px;border-radius:999px;color:inherit;transition:opacity .2s var(--ease)}
.pf-home svg{display:block;height:15px;width:auto;fill:currentColor}
.pf-home:hover{opacity:.7}
.pf-sep{color:#3A3F3E}
.pf-title{color:#959C9B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-home:focus-visible{outline:2px solid #5C8DFF;outline-offset:2px}
@media (min-width:900px) and (min-aspect-ratio:1/1){
  :root{--top:56px}
  .pf-bar{--U:min(100vw / 1504,(100dvh - 56px) / 846);padding:0 calc((100vw - var(--U) * 1504) / 2 + var(--U) * 96 - 8px)}
}
</style>`;

for (const cs of CASE_STUDIES) {
  const src = join(repo, cs.from);
  const out = join(site, "public", "work", cs.slug);
  if (!existsSync(join(src, "index.html"))) throw new Error(`Missing ${cs.from}/index.html`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const dir of cs.copy) if (existsSync(join(src, dir))) cpSync(join(src, dir), join(out, dir), { recursive: true });

  let html = readFileSync(join(src, "index.html"), "utf8");
  // The source is written as an artifact fragment (no doctype or head); give it a real document.
  if (!/^\s*<!doctype/i.test(html)) {
    html = `<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${html}`;
  }
  // The site's favicon (the transparent AJ mark), versioned so browsers drop any older cached icon
  html = html.replace(/(<meta name="viewport"[^>]*>)/, `$1\n<link rel="icon" href="/icon.svg?v=2" type="image/svg+xml">`);
  html = html.replace(/<meta name="claude:[^>]*>\n?/g, "");
  html = html.replace(/<main/, `${BAR(cs.title)}\n<main`);
  writeFileSync(join(out, "index.html"), html);
  console.log(`synced ${cs.from} → public/work/${cs.slug}/`);
}
