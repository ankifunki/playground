import { CLAIMS, CUR, DOMAINS, PROCS, cl, claimsOf, dependents, dom, proc, type Answer, type Claim, type Proc } from './data'

export const RM = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- answering: curated answers first, then a small keyword retriever ---------- */
const STOP = 'a an the is are do does did i we my our to of for in on at it be by and or what who why how when where which can should would could if this that with about me you there any get'.split(' ')
const toks = (s: string) => s.toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9$%]+/).filter((w) => w && !STOP.includes(w)).map((w) => w.replace(/(ing|ed|es|s)$/, ''))
const SYN: Record<string, string> = { valid: 'expire', last: 'expire', long: 'expire', lifetime: 'expire', boss: 'approv', owner: 'own', owns: 'own', fast: 'within', quick: 'within', respond: 'response', reply: 'response', price: 'discount', deal: 'deal', renew: 'renewal', lead: 'lead' }

export function retrieve(q: string, n = 3): Claim[] {
  const qt = toks(q).map((w) => SYN[w] || w)
  if (!qt.length) return []
  const pre = (arr: string[], w: string) => arr.some((h) => h.length > 3 && w.length > 3 && (h.indexOf(w) === 0 || w.indexOf(h) === 0))
  return CLAIMS.map((c) => {
    const p = proc(c.p)!, main = toks(c.t + ' ' + c.s + ' ' + p.n), side = toks(p.w + ' ' + c.why.map((w) => w.t).join(' ') + ' ' + (c.drift ? c.drift.practice : ''))
    let sc = 0
    qt.forEach((w) => { if (main.includes(w)) sc += 2; else if (pre(main, w)) sc += 1.2; else if (side.includes(w)) sc += 0.6; else if (pre(side, w)) sc += 0.3 })
    return { c, sc }
  }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, n).map((x) => x.c)
}

export function localAnswer(q: string): Answer {
  const l = q.toLowerCase()
  for (const [re, a] of CUR) if (re.test(l)) return { ...a, ids: a.ids.slice(), open: cl(a.ids[0])!.p }
  const hits = retrieve(q, 3)
  if (!hits.length) return { unknown: true, ids: [] }
  const chk = hits.find((c) => c.st === 'chk')
  return { local: true, lead: hits[0].t, note: chk ? 'One related item needs attention: ' + chk.reason.toLowerCase() + '.' : '', ids: hits.map((c) => c.id), open: hits[0].p }
}

export const corpus = () => CLAIMS.map((c) => {
  const p = proc(c.p)!
  return c.id + ' | ' + p.n + ' | ' + (c.st === 'chk' ? 'CHECK (' + c.reason + ')' : c.st === 'chg' ? 'SOLID, ' + c.reason : 'SOLID') + ' | ' + c.t + (c.why.length ? ' Why: ' + c.why.map((w) => w.t).join(' ') : '') + (c.drift ? ' In practice: ' + c.drift.practice : '')
}).join('\n')

/* ---------- map geometry ---------- */
export type Cam = { x: number; y: number; s: number }
export type MapLvl = { lvl: 0 | 1 | 2; dom: string | null; proc: string | null; claim: string | null }

export function camFor(m: MapLvl): Cam {
  if (m.lvl === 0 || !m.dom) return { x: 200, y: 200, s: 1 }
  const d = dom(m.dom)
  if (m.lvl === 1 || !m.proc) return { x: d.x, y: d.y, s: 150 / d.r }
  const p = proc(m.proc)!
  return { x: d.x + p.dx, y: d.y + p.dy, s: 120 / p.r }
}

/** Which area or process the camera is looking at, from its position and zoom. */
export function levelFromCam(c: Cam): Omit<MapLvl, 'claim'> {
  if (c.s < 1.8) return { lvl: 0, dom: null, proc: null }
  let best: (typeof DOMAINS)[number] | null = null, bd = 1e9
  DOMAINS.forEach((d) => { const dist = Math.hypot(c.x - d.x, c.y - d.y) / d.r; if (dist < bd) { bd = dist; best = d } })
  if (!best || bd >= 1.6) return { lvl: 0, dom: null, proc: null }
  const b = best as (typeof DOMAINS)[number]
  if (c.s >= (150 / b.r) * 1.9) {
    let bp: Proc | null = null, bpd = 1e9
    PROCS.filter((p) => p.d === b.id).forEach((p) => { const dist = Math.hypot(c.x - (b.x + p.dx), c.y - (b.y + p.dy)) / p.r; if (dist < bpd) { bpd = dist; bp = p } })
    if (bp && bpd < 2.2) return { lvl: 2, dom: b.id, proc: (bp as Proc).id }
  }
  return { lvl: 1, dom: b.id, proc: null }
}

/** Cross-area dependency counts, keyed "a|b". */
export function links() {
  const m: Record<string, number> = {}
  PROCS.forEach((p) => p.deps.forEach((q) => { const pq = proc(q); if (pq && pq.d !== p.d) { const k = [p.d, pq.d].sort().join('|'); m[k] = (m[k] || 0) + 1 } }))
  return m
}

/** What depends on a process, in two rings. Approvals has a hand-written ripple for the demo. */
export function ripple(p: Proc): { r1: [string, number][]; r2: [string, number][]; list: [string, string, number][] } {
  if (p.id === 'approvals') return {
    r1: [['Lock handler', 0], ['Amount lock rule', 0], ['CPQ quote sync', 1], ['Deal Desk SLA dashboard', 0]],
    r2: [['38 reps', 0], ['Pipeline report', 0], ['Quote PDFs', 1]],
    list: [['Lock handler', 'Locks and unlocks records', 0], ['Amount lock rule', 'Stops edits after approval', 0], ['CPQ quote sync', 'Already failing for multi-currency', 1], ['Deal Desk SLA dashboard', 'Measures approval time', 0], ['Pipeline report', 'Groups deals by approval stage', 0], ['Quote PDFs', 'Show approved discounts. Fed by CPQ sync', 1], ['38 reps', 'Submit approvals every week', 0]],
  }
  const dps = dependents(p.id)
  const r1: [string, number][] = dps.map((q) => [q.n, claimsOf(q.id).some((c) => c.reason === 'Failing now') ? 1 : 0])
  const r2s: Record<string, 1> = {}
  dps.forEach((q) => dependents(q.id).forEach((z) => { if (z.id !== p.id && !dps.includes(z)) r2s[z.n] = 1 }))
  const r2: [string, number][] = Object.keys(r2s).slice(0, 4).map((n) => [n, 0])
  return { r1, r2, list: [...r1.map(([n, w]) => [n, 'Depends on it directly', w] as [string, string, number]), ...r2.map(([n]) => [n, 'Depends on it indirectly', 0] as [string, string, number])] }
}
