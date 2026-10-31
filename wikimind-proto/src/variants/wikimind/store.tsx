import type React from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { blocks, OPEN_SECS, POOL, type BlockId, type Focus, type Mode } from './data'
import { answer, askAboutAnswer, RM, type Ans } from './logic'

export type View = 'home' | 'page'
export type Ask = { q: string; who: string; when: string; done: boolean }
type Tick = { k: string; t: string; ago: number }

function fromHash(): { v: View; mode?: Mode } | null {
  const h = location.hash.slice(1)
  if (h === 'home') return { v: 'home' }
  const m = h.match(/^page(?:-(cite|change|browse|demo))?$/)
  return m ? { v: 'page', mode: (m[1] as Mode) || 'browse' } : null
}

function useW1() {
  const [view, setView] = useState<View>('home')
  const [mode, setMode] = useState<Mode>('browse')
  const [secs, setSecs] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState<Record<string, string>>({})
  const [show, setShow] = useState<'path' | 'deals' | null>(null)
  const [gfocus, setGfocus] = useState<Focus | null>(null)
  const [gsel, setGsel] = useState<string | null>(null)
  const [sel, setSel] = useState<BlockId | null>(null)
  const [why, setWhy] = useState<BlockId | null>(null)
  const [diff, setDiff] = useState<BlockId | null>(null)
  const [blame, setBlame] = useState(false)
  const [cite, setCite] = useState<BlockId | null>(null)
  const [cluster, setCluster] = useState<number | null>(null)
  const [ans, setAns] = useState<(Ans & { n: number }) | null>(null)
  const [updated, setUpdated] = useState(false)
  const [fresh, setFresh] = useState(false)
  const [obs, setObs] = useState(3912)
  const [ticks, setTicks] = useState<Tick[]>([{ k: 'Slack', t: 'Read 2 new #deal-desk threads about approvals', ago: 0 }, { k: 'Salesforce', t: 'Approval step changed on Large Deal Approval', ago: 3 }, { k: 'Verified', t: 'Dana verified “Opportunity approvals, rules”', ago: 9 }, { k: 'Meeting', t: 'Transcribed RevOps weekly (42 minutes)', ago: 15 }])
  const [tickFresh, setTickFresh] = useState(false)
  const [asking, setAsking] = useState<Ask[]>([{ q: 'Do renewals with no price change really skip approval?', who: 'Asked Maria Okafor, RevOps', when: 'yesterday', done: false }, { q: 'Why does CPQ quote sync fail for multi-currency deals?', who: 'Asked Ben Ito, Integrations', when: '2 days ago', done: false }])
  const [flash, setFlash] = useState<string | null>(null)
  const [navKey, setNavKey] = useState(0)
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null)
  const B = blocks(updated)

  const latest = useRef({ view, mode, updated }); latest.current = { view, mode, updated }
  const obsT = useRef(0), ansN = useRef(0), ti = useRef(4)
  const showToast = (msg: string) => setToast({ msg, id: Date.now() })
  // A "just opened" flash class lives for one beat, so only the thing just opened animates.
  useEffect(() => { if (!flash) return; const t = window.setTimeout(() => setFlash(null), 450); return () => clearTimeout(t) }, [flash])

  /** Maria answers: the renewals fact is rewritten, the open question closes. */
  const observe = () => {
    if (latest.current.updated) return
    setUpdated(true); setFresh(true)
    setAsking((a) => a.map((x, i) => (i === 0 ? { ...x, done: true, when: 'answered just now' } : x)))
    if (latest.current.view === 'page') showToast('Maria Okafor answered. Asoka updated a fact on this page.')
    window.setTimeout(() => setFresh(false), 2600)
  }

  const go = (v: View, opt: { mode?: Mode } = {}) => {
    setView(v); setSel(null); setWhy(null); setDiff(null); setDone({}); setShow(null); setGfocus(null); setGsel(null); setFlash(null); setNavKey((k) => k + 1)
    let m: Mode = latest.current.mode
    if (v === 'page') {
      m = opt.mode || 'browse'; setMode(m); setCite(m === 'cite' ? 'b4' : null); setSecs({ ...OPEN_SECS[m] })
      if (m === 'change') setDiff('b2')
      if (m === 'browse') setBlame(false)
    }
    const h = v === 'page' ? 'page-' + m : v
    if (location.hash.slice(1) !== h) location.hash = h
    window.scrollTo(0, 0)
    clearTimeout(obsT.current)
    if (v === 'page' && m === 'browse' && !latest.current.updated) obsT.current = window.setTimeout(observe, 20000)
  }

  // Back and forward move between home and the page modes.
  useEffect(() => {
    const f0 = fromHash(); if (f0 && f0.v === 'page') go('page', { mode: f0.mode })
    const onHash = () => { const f = fromHash(), L = latest.current; if (!f) return; if (f.v === 'home' && L.view !== 'home') go('home'); else if (f.v === 'page' && (L.view !== 'page' || L.mode !== f.mode)) go('page', { mode: f.mode }) }
    addEventListener('hashchange', onHash)
    return () => { removeEventListener('hashchange', onHash); clearTimeout(obsT.current) }
  }, [])

  // Asoka keeps observing: the ticker, the counter, and a ping in the constellation.
  useEffect(() => {
    const t = window.setInterval(() => {
      const o = POOL[ti.current++ % POOL.length]
      setObs((x) => x + 1 + Math.floor(Math.random() * 3))
      setTicks((ts) => [{ k: o.k, t: o.t, ago: 0 }, ...ts.map((x) => ({ ...x, ago: x.ago + 1 }))].slice(0, 4)); setTickFresh(true)
      if (latest.current.view !== 'home') return
      const ob = document.getElementById('obs'); if (ob) { ob.classList.remove('bump'); void ob.offsetWidth; ob.classList.add('bump') }
      ping(o.c)
    }, 3800)
    return () => clearInterval(t)
  }, [])

  const scrollToEl = (id: string, block: ScrollLogicalPosition = 'start') => window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block }), 60)
  const openSec = (k: string, scrollId?: string) => { setSecs((s) => ({ ...s, [k]: true })); scrollToEl(scrollId || 'sec-' + k) }
  const doAct = (k: string) => {
    if (done[k]) return
    if (k === 'path' || k === 'deals') { const on = show !== k; setShow(on ? k : null); setFlash(on ? k : null); return }
    const msg: Record<string, string> = { resub: 'Sent. Sofia, the EMEA director, has it now. Usual wait is about 3 hours.', exc: 'Asoka asked Deal Desk in #deal-desk and linked your deal.', tell: 'Asoka messaged Ana, Sam, Léa, and Raj in Slack.', watch: 'You’ll get a Slack note when this page changes.' }
    if (msg[k]) { setDone((d) => ({ ...d, [k]: msg[k] })); setFlash('done-' + k); return }
    if (k === 'touches') { setGfocus('touches'); setGsel(null); openSec('map'); return }
    if (k === 'ask') { document.getElementById('in')?.focus(); return }
    if (k === 'lens') { setBlame((b) => !b); return }
    if (k === 'learn') { setSecs((s) => ({ ...s, unw: true })); setDone((d) => ({ ...d, learn: 'Maria just answered. The renewals rule below is updated.' })); setFlash('done-learn'); observe(); scrollToEl('blk-b7', 'center'); return }
    if (k === 'asking') openSec('unw', 'blk-b7')
  }

  const ask = (raw: string) => {
    const q = raw.trim(); if (!q) return
    const r = answer(q, { updated, onPage: view === 'page', focus: sel || why, B })
    if (r.showTouches) { setGfocus('touches'); setGsel(null); if (view === 'page') setSecs((s) => ({ ...s, map: true })) }
    if (r.unknown) setAsking((a) => [...a, { q: r.unknown!, who: 'Asoka will ask the right person', when: 'just now', done: false }])
    setAns({ ...r.a, n: ++ansN.current })
  }
  const askAbout = (id: BlockId) => setAns({ ...askAboutAnswer(B[id], id), n: ++ansN.current })
  const goBlock = (id: BlockId) => { if (view !== 'page') go('page'); setWhy(id); scrollToEl('blk-' + id, 'center') }
  const toggleWhy = (id: BlockId) => { const on = why !== id; setWhy(on ? id : null); setFlash(on ? 'why-' + id : null) }
  const toggleDiff = (id: BlockId) => { const on = diff !== id; setDiff(on ? id : null); setFlash(on ? 'diff-' + id : null) }
  const filterGraph = (f: Focus | null) => { setGfocus(f); setGsel(null); setFlash('cap') }
  const pickNode = (id: string) => { setGsel((s) => (s === id ? null : id)); setFlash('cap') }
  const stub = () => showToast('Only “Opportunity approvals” is built in this prototype.')

  return {
    view, mode, secs, done, show, gfocus, gsel, sel, why, diff, blame, cite, cluster, ans, updated, fresh, obs, ticks, tickFresh, asking, flash, navKey, toast, B,
    setSecs, setSel, setWhy, setBlame, setCluster, setAns, setGfocus, setGsel, setToast,
    go, observe, doAct, ask, askAbout, goBlock, toggleWhy, toggleDiff, filterGraph, pickNode, stub,
  }
}

/** A brief ring where Asoka just observed something. */
function ping(ci: number) {
  if (RM) return
  const g = document.getElementById('cl' + ci); if (!g) return
  const dots = g.querySelectorAll('circle.dot'), d = dots[Math.floor(Math.random() * dots.length)] as SVGCircleElement | undefined
  if (!d) return
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  c.setAttribute('class', 'ping'); c.setAttribute('cx', d.getAttribute('cx')!); c.setAttribute('cy', d.getAttribute('cy')!); c.setAttribute('r', '4')
  g.appendChild(c); window.setTimeout(() => c.remove(), 1700)
}

export type W1 = ReturnType<typeof useW1>
const Ctx = createContext<W1 | null>(null)
export function W1Provider({ children }: { children: React.ReactNode }) { const w = useW1(); return <Ctx.Provider value={w}>{children}</Ctx.Provider> }
export function useW() { const w = useContext(Ctx); if (!w) throw new Error('useW outside W1Provider'); return w }
