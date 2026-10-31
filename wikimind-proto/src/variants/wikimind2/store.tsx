import type React from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { cl, dom, proc, type Answer } from './data'
import { camFor, corpus, localAnswer, RM, type Cam, type MapLvl } from './logic'

export type View = 'ask' | 'map' | 'proc' | 'claim'
type Claude = { use: (k: string) => Promise<{ json: (p: string, o?: object) => Promise<any> } | null> }
const CLAUDE: Claude | null = (() => {
  const w = window as any
  try { if (w.claude?.use) return w.claude } catch { /* cross-origin */ }
  try { if (w.parent && w.parent !== w && w.parent.claude?.use) return w.parent.claude } catch { /* cross-origin */ }
  return null
})()
const sampleP = CLAUDE ? CLAUDE.use('sample').catch(() => null) : Promise.resolve(null)

const MAP0: MapLvl = { lvl: 0, dom: null, proc: null, claim: null }

function initial() {
  const h = location.hash.slice(1)
  let m: RegExpMatchArray | null
  if ((m = h.match(/^p-(\w+)$/)) && proc(m[1])) return { view: 'proc' as View, pid: m[1], cid: '', map: MAP0 }
  if ((m = h.match(/^c-(\w+)$/)) && cl(m[1])) return { view: 'claim' as View, pid: '', cid: m[1], map: MAP0 }
  if ((m = h.match(/^map(?:-(\w+))?(?:-(\w+))?$/))) {
    const map: MapLvl = { ...MAP0 }
    if (m[1] && dom(m[1])) { map.lvl = 1; map.dom = m[1] }
    if (m[2] && proc(m[2])) { map.lvl = 2; map.proc = m[2] }
    return { view: 'map' as View, pid: '', cid: '', map }
  }
  return { view: 'ask' as View, pid: '', cid: '', map: MAP0 }
}

function useW2() {
  const init = useRef(initial()).current
  const [view, setView] = useState<View>(init.view)
  const [pid, setPid] = useState(init.pid)
  const [cid, setCid] = useState(init.cid)
  const [map, setMap] = useState<MapLvl>(init.map)
  const [camReq, setCamReq] = useState<{ cam: Cam; anim: boolean; n: number }>({ cam: camFor(init.map), anim: false, n: 0 })
  const [navKey, setNavKey] = useState(0)
  const [q, setQ] = useState('')
  const [ans, setAns] = useState<Answer | null>(null)
  const [blast, setBlast] = useState(false)
  const [unk, setUnk] = useState<Record<string, true>>({})
  const [tt, setTT] = useState<Record<string, number>>({})
  const [asked, setAsked] = useState<string[]>([])
  const [watch, setWatch] = useState<Record<string, true>>({})
  const [hint, setHint] = useState(init.map.lvl === 0)
  const [peek, setPeek] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null)

  const latest = useRef({ view, map, ans, q, asked })
  latest.current = { view, map, ans, q, asked }
  const askSeq = useRef(0), askCtl = useRef<AbortController | null>(null), camN = useRef(0), timers = useRef<number[]>([])
  const later = (f: () => void, ms: number) => { timers.current.push(window.setTimeout(f, ms)) }
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  // URL hash mirrors where you are, so a link can open any view or zoom level.
  useEffect(() => {
    const h = view === 'ask' ? 'ask' : view === 'map' ? 'map' + (map.lvl >= 1 ? '-' + map.dom : '') + (map.lvl === 2 ? '-' + map.proc : '') : view === 'proc' ? 'p-' + pid : 'c-' + cid
    if (location.hash.slice(1) !== h) history.replaceState(null, '', location.pathname + location.search + '#' + h)
  }, [view, pid, cid, map.lvl, map.dom, map.proc])

  const showToast = (msg: string) => setToast({ msg, id: Date.now() })
  const closePeek = () => setPeek(null)

  /* ---------- navigation ---------- */
  const go = (v: View, o: { cid?: string; pid?: string; scrollTo?: string } = {}) => {
    setView(v); if (o.cid) setCid(o.cid); if (o.pid) setPid(o.pid); closePeek(); setNavKey((k) => k + 1)
    if (o.scrollTo) later(() => document.getElementById(o.scrollTo!)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }), 80)
    else window.scrollTo(0, 0)
  }
  const moveCam = (m: MapLvl, anim: boolean) => setCamReq({ cam: camFor(m), anim, n: ++camN.current })
  const setLvl = (lvl: MapLvl['lvl'], d: string | null, p: string | null) => {
    const m: MapLvl = { lvl, dom: d, proc: p, claim: null }
    setMap(m); moveCam(m, true); if (lvl > 0) setHint(false)
  }
  const goMap = (lvl: MapLvl['lvl'] = 0, d: string | null = null, p: string | null = null, then?: () => void) => {
    setView('map'); setMap(MAP0); moveCam(MAP0, false); closePeek(); setNavKey((k) => k + 1); window.scrollTo(0, 0)
    if (lvl > 0) later(() => { setLvl(lvl, d, p); then?.() }, 60)
  }
  /** Fly out to the whole map, then into another area, so the reader sees where it is. */
  const flyTo = (lvl: MapLvl['lvl'], d: string, p: string | null) => {
    const m = latest.current.map
    if (RM || m.lvl === 0 || (m.dom === d && lvl >= 1)) { setLvl(lvl, d, p); return }
    setLvl(0, null, null); later(() => setLvl(lvl, d, p), 560)
  }
  const selectClaim = (id: string | null) => setMap((m) => ({ ...m, claim: id }))
  const zoomOut = () => {
    const m = latest.current.map
    if (m.claim) selectClaim(null); else if (m.lvl === 2) setLvl(1, m.dom, null); else setLvl(0, null, null)
  }
  /** Gestures move the camera directly; this only updates which level the reader is at. */
  const levelChanged = (l: Omit<MapLvl, 'claim'>) => {
    const m = latest.current.map
    if (m.lvl !== l.lvl || m.dom !== l.dom || m.proc !== l.proc) { setMap({ ...l, claim: null }); if (l.lvl > 0) setHint(false) }
  }
  const openProc = (id: string) => { setBlast(false); go('proc', { pid: id }) }
  const openBlast = (id: string) => { setBlast(true); go('proc', { pid: id, scrollTo: 'blastsec' }) }
  const openClaim = (id: string) => go('claim', { cid: id })
  const home = () => { setAns(null); setQ(''); go('ask') }
  const curProc = () => (view === 'proc' ? proc(pid) : view === 'claim' ? proc(cl(cid)!.p) : undefined)
  const mapHere = () => {
    const cp = curProc()
    if (view === 'claim') { const c = cl(cid)!; goMap(2, proc(c.p)!.d, c.p, () => later(() => selectClaim(c.id), 700)) }
    else if (cp) goMap(2, cp.d, cp.id)
    else goMap(0)
  }
  const crumb = (level: 0 | 1 | 2, v?: string) => {
    if (level === 0) { if (view === 'map') setLvl(0, null, null); else goMap(0) }
    else if (level === 1) { if (view === 'map') setLvl(1, v!, null); else goMap(1, v!) }
    else { const p = proc(v!)!; if (view === 'map') setLvl(2, p.d, p.id); else goMap(2, p.d, p.id) }
  }
  const toggleBlast = () => { const on = !blast; setBlast(on); if (on) later(() => document.getElementById('blastsec')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }), 40) }
  const doWatch = (id: string) => { setWatch((w) => ({ ...w, [id]: true })); showToast('You’ll get a Slack note when ' + proc(id)!.n.toLowerCase() + ' changes.') }
  const findOut = (key: string) => { setUnk((u) => ({ ...u, [key]: true })); showToast('Asoka will ask the person most likely to know.') }

  /* ---------- asking ---------- */
  const addAsked = (x: string) => setAsked((a) => (a.includes(x) ? a : [...a, x]))
  const askClaude = (question: string, seq: number) => {
    sampleP.then((sample) => {
      if (!sample || seq !== askSeq.current) { if (seq === askSeq.current) setAns((a) => (a ? { ...a, pending: false } : a)); return }
      askCtl.current = new AbortController()
      const prompt = 'You are Asoka, a digital coworker that knows how a company named Northwind works. Answer ONLY from the knowledge below. Each line is: id | process | trust | claim.\n\nRules:\n- Answer in at most 2 short, plain sentences. No jargon, no hedging words like "typically".\n- Cite the ids you used (1 to 4).\n- If you rely on a line marked CHECK, add a one-sentence note saying what to double-check, in plain words.\n- If the knowledge does not answer the question, set unknown to true and leave lead empty. Never guess.\n\nReturn JSON only: {"lead": string, "note": string, "ids": string[], "unknown": boolean}\n\nKnowledge:\n' + corpus() + '\n\nQuestion: ' + question
      sample.json(prompt, { modelTier: 'quick', signal: askCtl.current.signal }).then((r) => {
        if (seq !== askSeq.current) return
        const ids = (r && Array.isArray(r.ids) ? r.ids : []).filter((id: string) => cl(id)).slice(0, 4)
        if ((r && r.unknown) || !ids.length || !r.lead) { setAns({ unknown: true, ids: [], src: 'asoka', up: true }); addAsked(question) }
        else setAns({ lead: String(r.lead), note: r.note ? String(r.note) : '', ids, open: cl(ids[0])!.p, src: 'asoka', blast: /break|depend|impact/.test(question.toLowerCase()), up: true })
      }).catch(() => { if (seq === askSeq.current) setAns((a) => (a ? { ...a, pending: false } : a)) })
    })
  }
  const doAsk = (raw: string) => {
    const question = (raw || '').trim(); if (!question) return
    setQ(question); askSeq.current++; try { askCtl.current?.abort() } catch { /* already done */ }
    const a: Answer = { ...localAnswer(question), src: 'local', pending: !!CLAUDE }
    if (a.unknown && !CLAUDE) addAsked(question)
    setAns(a)
    if (latest.current.view !== 'ask') go('ask')
    else later(() => document.querySelector('.ans')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }), 40)
    if (CLAUDE) askClaude(question, askSeq.current)
  }
  const stopAsk = () => {
    askSeq.current++; try { askCtl.current?.abort() } catch { /* already done */ }
    const a = latest.current.ans
    if (a) { setAns({ ...a, pending: false }); if (a.unknown) addAsked(latest.current.q) }
  }

  return {
    view, pid, cid, map, camReq, navKey, q, ans, blast, unk, tt, asked, watch, hint, peek, toast,
    setTT, setHint, setPeek, closePeek, showToast, setToast,
    go, goMap, setLvl, flyTo, selectClaim, zoomOut, levelChanged, openProc, openBlast, openClaim, home, mapHere, crumb, curProc,
    toggleBlast, doWatch, findOut, doAsk, stopAsk,
  }
}

export type W2 = ReturnType<typeof useW2>
const Ctx = createContext<W2 | null>(null)
export function W2Provider({ children }: { children: React.ReactNode }) { const w = useW2(); return <Ctx.Provider value={w}>{children}</Ctx.Provider> }
export function useW() { const w = useContext(Ctx); if (!w) throw new Error('useW outside W2Provider'); return w }
