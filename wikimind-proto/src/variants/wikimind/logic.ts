import { CL, KIND, ORDER, TIER, type Block, type BlockId, type Tier } from './data'

export const RM = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function counts(B: Record<BlockId, Block>) { const c: Record<Tier, number> = { ver: 0, cor: 0, one: 0, gap: 0 }; ORDER.forEach((k) => c[B[k].tier]++); return c }
/** Trust by exception: only uncertain, unofficial or changed facts carry a mark. */
export const isExc = (b: Block) => b.tier === 'one' || b.tier === 'gap' || !!b.flag || !!b.changed
export function blameLine(b: Block) {
  const v = b.prov.find((p) => p.k === 'ver'), n = b.prov.filter((p) => p.k !== 'think' && p.k !== 'ver').length, last = b.prov[b.prov.length - 1].w
  return TIER[b.tier][0] + (v ? ' by ' + v.s.split(',')[0] : '') + '. ' + n + ' source' + (n === 1 ? '' : 's') + ', latest ' + last + '.'
}
export function whyLine(b: Block) {
  const NM: Partial<Record<string, string>> = { sf: 'the Salesforce setup', slack: 'Slack', ticket: 'Jira', meet: 'a meeting', doc: 'the sales policy', watch: 'approvals Asoka watched' }
  const names: string[] = []
  b.prov.forEach((p) => { const n = NM[p.k]; if (n && !names.includes(n)) names.push(n) })
  const src = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0] || 'a conversation'
  const v = b.prov.find((p) => p.k === 'ver'), last = b.prov[b.prov.length - 1].w
  const tail = v ? 'Verified by ' + v.s.split(',')[0] + ' on ' + v.w + '.' : b.tier === 'cor' ? 'The sources agree. Not verified by a person yet.' : b.tier === 'one' ? 'Only one source so far.' : 'Waiting on an answer from RevOps.'
  return 'From ' + src + '. ' + tail + (v ? '' : ' Latest: ' + last + '.')
}
export function hintOf(B: Record<BlockId, Block>, base: string, ids: BlockId[]) {
  let o = 0, g = 0, f = 0, ch = 0
  ids.forEach((i) => { const b = B[i]; if (b.tier === 'one') o++; if (b.tier === 'gap') g++; if (b.flag) f++; if (b.changed) ch++ })
  const p: string[] = []
  if (ch) p.push(ch + ' updated'); if (f) p.push(f + ' unofficial'); if (o) p.push(o + ' seen once'); if (g) p.push(g + ' open question')
  return base + (p.length ? '. ' + p.join(', ').replace(/^./, (c) => c.toUpperCase()) : '')
}
export function askAboutAnswer(b: Block, id: BlockId): Ans {
  const src = b.prov.filter((p) => p.k !== 'think')
  return { t: 'I believe this because of ' + src.length + ' source' + (src.length === 1 ? '' : 's') + ': ' + src.map((p) => KIND[p.k][1].toLowerCase() + ' (' + p.s + ')').join(', ') + '.', cav: TIER[b.tier][1], c: [id] }
}

export type Ans = { t: string; cav?: string; c: BlockId[] }
/** Answers from this page. Some answers also steer the page (e.g. open the map on what a change would break). */
export function answer(q: string, ctx: { updated: boolean; onPage: boolean; focus: BlockId | null; B: Record<BlockId, Block> }): { a: Ans; showTouches?: boolean; unknown?: string } {
  const l = q.toLowerCase(), u = ctx.updated
  if (/extension|extend|exception/.test(l)) return { a: { t: 'Yes, Deal Desk can extend it. Ask in #deal-desk with the deal link, and they usually reply within an hour. Near quarter end they often approve right in the thread.', cav: 'That quarter-end habit is unofficial, so don’t count on it.', c: ['b4', 'b6'] } }
  if (/my deal|who approves (it|my)|route/.test(l)) return { a: { t: 'For Helios expansion (28% off, EMEA): Sofia, the EMEA director, then your sales manager, then Finance, because the discount is over 20%.', cav: 'The EMEA step comes from one source. Asoka will confirm it when your request routes.', c: ['b3', 'b2'] } }
  if (/why 14|why two weeks|why does it expire/.test(l)) return { a: { t: 'So pricing and terms don’t go stale while a deal waits. The sales policy sets two weeks, and the approval process enforces it automatically.', c: ['b4'] } }
  if (/which deals|affected/.test(l)) return { a: { t: 'Four open deals now need the CRO: Kestrel platform (41%), Lumen EMEA (38%), Northstar renewal (37%), and Orbit add-on (36%).', c: ['b2'] } }
  if (/break|impact|depend|change the approval/.test(l)) return { showTouches: true, a: { t: 'Three automations depend on Large Deal Approval: the lock handler, the amount lock rule, and CPQ quote sync, which is already failing for multi-currency deals. 212 approvals ran through it this quarter. Talk to Maria Okafor in RevOps before changing it.', c: ['b1'] } }
  if (/unsure|not sure|uncertain|still asking/.test(l)) return { a: { t: 'Two things. The EMEA approval step, which I’ve seen only once' + (u ? '.' : '. And whether flat renewals skip approval on purpose, which I’ve asked RevOps about.'), c: u ? ['b3'] : ['b3', 'b7'] } }
  if (/how do you know|where.*(from|come)|\bsources?\b|why do you (think|believe)/.test(l)) {
    const fid = ctx.onPage ? ctx.focus : null
    if (fid) return { a: { t: whyLine(ctx.B[fid]), c: [fid] } }
    return { a: { t: 'This page comes from 23 observations across 6 sources: the Salesforce setup and audit trail, Slack, Jira, meeting transcripts, the sales policy, and approvals I watched happen. Most of it is solid. The parts to treat with care are the EMEA step, which I’ve seen only once' + (u ? '.' : ', and flat renewals, which I’m still asking about.'), c: u ? ['b3'] : ['b3', 'b7'] } }
  }
  if (/current|up to date|stale|fresh|still true|accurate/.test(l)) return { a: { t: 'Yes. I saw this process run 2 hours ago and nothing has contradicted it. One rule changed recently: the CRO threshold dropped from 40% to 35% on Oct 28.', c: ['b2'] } }
  if (/emea|30 ?%|who approves|discount/.test(l)) return { a: { t: 'An EMEA deal with a 30% discount goes to the EMEA sales director first, then the sales manager and Finance, because it’s between 20% and 35%.', cav: 'The EMEA step comes from a single Slack message, so treat it as likely, not certain.', c: ['b3', 'b2'] } }
  if (/expire|14|how long|resubmit/.test(l)) return { a: { t: 'Approval requests expire after 14 days. The record unlocks and the rep submits it again.', c: ['b4'] } }
  if (/quarter|fast/.test(l)) return { a: { t: 'At quarter end, Deal Desk approves large deals in #deal-desk and logs them afterward.', cav: 'This is corroborated but not verified, and it bypasses the official process.', c: ['b6'] } }
  if (/renewal/.test(l)) return { a: u ? { t: 'Renewals with no price change skip approval on purpose. RevOps confirmed it’s been the policy since 2023.', cav: 'Confirmed by the process owner, waiting for Dana to verify.', c: ['b7'] } : { t: 'I’m not sure yet. Flat renewals do skip approval in practice, but no rule explains it. I asked Maria Okafor in RevOps yesterday.', c: ['b7'] } }
  if (/changed|this week|new|what.?s up/.test(l)) return { a: { t: 'Since your last visit, one rule changed: discounts over 35% now go straight to the CRO. It used to be 40%. Quarter-end Slack approvals were also written down for the first time, and CPQ quote sync started failing for multi-currency deals.', c: ['b2', 'b6'] } }
  return { unknown: q.charAt(0).toUpperCase() + q.slice(1).replace(/\?*$/, '?'), a: { t: 'I don’t know that yet, and I won’t guess. I’ve added it to my open questions and I’ll ask the person most likely to know.', cav: 'You’ll find it under “Asoka is asking” on the home page.', c: [] } }
}

/* ---------- the constellation: one dot per ten pages, seeded so it's stable ---------- */
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
export type Dot = { x: number; y: number; s: number; f: boolean }
export const DOTS: Dot[][] = (() => {
  const r = rng(7)
  return CL.map((c) => {
    const n = Math.round(c.p / 10), R = Math.sqrt(n) * 5.6, arr: Dot[] = []
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R; arr.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d * 0.8, s: 1.4 + r() * 1.8, f: i < 2 }) }
    return arr
  })
})()
