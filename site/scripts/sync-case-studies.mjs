// Copies the standalone case studies into public/work/<slug>/ before dev and build.
// The source folders stay the place you edit; the copies are generated and git-ignored.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(site, "..");

const CASE_STUDIES = [
  { slug: "multi-location", from: "case-study", copy: ["img", "assets"] },
  { slug: "multi-ticket", from: "multi-ticket", copy: ["img"] },
];

// A quiet way back to the homepage, added to the portfolio copy only.
const BACK_LINK = `<a href="/" class="pf-back" aria-label="Back to Ankit Joshi’s portfolio">← Ankit Joshi</a>
<style>.pf-back{position:fixed;z-index:20;top:calc(14px + env(safe-area-inset-top,0px));left:calc(16px + env(safe-area-inset-left,0px));
font:400 11px/1 "Geist Mono",ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#6E7675;text-decoration:none;padding:6px 0}
.pf-back:hover{color:#6663F4}.pf-back:focus-visible{outline:2px solid #6663F4;outline-offset:3px}</style>`;

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
  html = html.replace(/<meta name="claude:[^>]*>\n?/g, "");
  html = html.replace(/<main/, `${BACK_LINK}\n<main`);
  writeFileSync(join(out, "index.html"), html);
  console.log(`synced ${cs.from} → public/work/${cs.slug}/`);
}
