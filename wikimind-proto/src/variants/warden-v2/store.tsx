import type React from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AG, CL0, T0, type AgentId, type DClass, type Gen, type Trace } from './data'

export type Need = { id: string; type: 'spot' | 'hand' | 'ask'; agent: AgentId; trace?: string; cls?: string; sent?: boolean }
const NEEDS0: Need[] = [{ id: 'n1', type: 'spot', agent: 'iris', trace: 't1' }, { id: 'n2', type: 'hand', agent: 'iris', cls: 'lic' }, { id: 'n3', type: 'ask', agent: 'fen' }]
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x, (_, v) => (v instanceof RegExp ? undefined : v)))

function viewFromHash(tr: Trace[]) {
  const h = location.hash.slice(1)
  return h === 'home' || AG.some((a) => a.id === h) || (h.startsWith('trace-') && tr.some((t) => t.id === h.slice(6))) ? h : null
}

function useWarden() {
  const [classes, setClasses] = useState<DClass[]>(() => clone(CL0))
  const [traces, setTraces] = useState<Trace[]>(() => clone(T0))
  const [paused, setPaused] = useState<Record<AgentId, boolean>>({ iris: false, sol: false, fen: false, pia: false })
  const [needs, setNeeds] = useState<Need[]>(NEEDS0)
  const [view, setView] = useState<string>(() => viewFromHash(T0) || 'home')
  const [open, setOpen] = useState<string | null>(null)
  const [reply, setReply] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null)
  const uid = useRef(0), timers = useRef<number[]>([]), latest = useRef({ paused }); latest.current = { paused }
  const later = (f: () => void, ms: number) => timers.current.push(window.setTimeout(f, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    const on = () => { const h = viewFromHash(traces); if (h) { setView(h); window.scrollTo(0, 0) } }
    addEventListener('hashchange', on); return () => removeEventListener('hashchange', on)
  }, [traces])

  const ag = (id: string) => AG.find((a) => a.id === id)
  const cl = (id: string) => classes.find((c) => c.id === id)!
  const tr = (id: string) => traces.find((t) => t.id === id)
  const pct = (c: DClass) => (c.a[1] ? Math.round((c.a[0] / c.a[1]) * 100) : null)
  const agree = (id: AgentId) => { let x = 0, y = 0; classes.forEach((c) => { if (c.agent === id) { x += c.a[0]; y += c.a[1] } }); return y ? Math.round((x / y) * 100) : 0 }
  const needsOf = (id: AgentId) => needs.filter((n) => n.agent === id)
  const allPaused = AG.every((a) => paused[a.id])
  const showToast = (msg: string) => setToast({ msg, id: Date.now() })

  const go = (v: string, keepOpen = false) => {
    setView(v); setReply(null); if (ag(v) && !keepOpen) setOpen(null)
    if (location.hash.slice(1) !== v) location.hash = v
    window.scrollTo(0, 0)
  }
  const patchClass = (id: string, f: (c: DClass) => DClass) => setClasses((cs) => cs.map((c) => (c.id === id ? f(c) : c)))
  const patchTrace = (id: string, f: (t: Trace) => Trace) => setTraces((ts) => ts.map((t) => (t.id === id ? f(t) : t)))
  /** Each review adds evidence to the class's track record. */
  const addDot = (c: DClass, ch: string): DClass => ({ ...c, dots: (c.dots + ch).slice(-20), a: [c.a[0] + (ch === 'g' ? 1 : 0), c.a[1] + 1] })
  const spotDone = (tid: string) => setNeeds((ns) => ns.filter((n) => !(n.type === 'spot' && n.trace === tid)))

  /** Widening autonomy needs a second person; Dev approves after a beat. */
  const handOver = (cid: string, needId: string | null) => {
    const c = cl(cid), a = ag(c.agent)!
    if (needId) setNeeds((ns) => ns.map((n) => (n.id === needId ? { ...n, sent: true } : n)))
    else setNeeds((ns) => ns.filter((n) => !(n.type === 'hand' && n.cls === cid)))
    showToast('Sent to Dev for a second OK.')
    later(() => { patchClass(cid, (x) => ({ ...x, lvl: 'alone', ready: false })); if (needId) setNeeds((ns) => ns.filter((n) => n.id !== needId)); showToast(`Dev approved. ${a.name} now handles ${c.name.toLowerCase()} on its own.`) }, 2200)
  }
  const takeBack = (cid: string) => { const c = cl(cid); patchClass(cid, (x) => ({ ...x, lvl: 'asks', ready: true })); showToast(`${ag(c.agent)!.name} will ask you about ${c.name.toLowerCase()} again.`) }
  const pauseAll = () => { setPaused({ iris: true, sol: true, fen: true, pia: true }); setReply('Everyone is paused. Nothing runs until you resume.') }
  const resumeAll = () => {
    if (!AG.some((a) => latest.current.paused[a.id])) { setReply('Everyone is already working.'); return }
    setReply('Resuming the whole team needs a second person. I’ve asked Dev.')
    later(() => { setPaused({ iris: false, sol: false, fen: false, pia: false }); setReply('Dev confirmed. Everyone is back.') }, 2200)
  }
  const togglePause = (id: AgentId) => { const on = !paused[id]; setPaused((p) => ({ ...p, [id]: on })); const a = ag(id)!; showToast(on ? a.name + ' is paused.' : a.name + ' is back.') }
  const skip = (id: string) => { setNeeds((ns) => ns.filter((n) => n.id !== id)); showToast('Okay. It’ll come back later if it still matters.') }
  const bank = (yes: boolean) => { setNeeds((ns) => ns.filter((n) => n.type !== 'ask')); showToast(yes ? 'Fen paid Acme. Your check is on record.' : 'Fen keeps holding it.') }
  const toggleClass = (id: string) => setOpen((o) => (o === id ? null : id))
  const toClass = (cid: string) => { setOpen(cid); go(cl(cid).agent, true) }

  /* ---------- correcting on an example ---------- */
  const genOf = (t: Trace): Gen => t.gen || (() => { const c = cl(t.cls); return { name: c.name + ' like this one', scope: 'Cases like this one ask you first.', affected: [t.title.split(' ').slice(-1)[0]], of: c.week } })()
  const reviewOk = (tid: string) => { const t = tr(tid)!; patchTrace(tid, (x) => ({ ...x, rv: 'ok' })); patchClass(t.cls, (c) => addDot(c, 'g')); spotDone(tid); showToast(`Thanks. That counts as evidence for ${cl(t.cls).name.toLowerCase()}.`) }
  const reviewNo = (tid: string) => patchTrace(tid, (x) => ({ ...x, rr: { stage: 'reason' } }))
  const pickReason = (tid: string, i: number) => { patchTrace(tid, (x) => ({ ...x, rr: { stage: 'why', reason: i } })); later(() => document.getElementById('why')?.focus(), 50) }
  const submitWhy = (tid: string, why: string) => {
    if (!why.trim()) { showToast('Add a few words, or tap the suggestion.'); return }
    patchTrace(tid, (x) => ({ ...x, rr: { ...x.rr!, why: why.trim(), stage: 'gen' } }))
  }
  /** Apply: a new, narrower class that asks first. Narrowing takes effect right away. */
  const applyGen = (tid: string) => {
    const t = tr(tid)!, g = genOf(t), a = ag(t.agent)!, id = 'c' + ++uid.current
    setClasses((cs) => [...cs.map((c) => (c.id === t.cls ? addDot(g.parent ? { ...c, scope: g.parent } : c, 'r') : c)), { id, agent: t.agent, name: g.name, scope: g.scope, lvl: 'asks', a: [0, 0], dots: '', week: 0, need: 'New. Learned from your correction on ' + t.title.toLowerCase() + '.', rules: [], ex: [t.id] }])
    patchTrace(tid, (x) => ({ ...x, rv: 'fixed', fixCls: id, fixMsg: `${a.name} will ask you about ${g.name.toLowerCase()} from now on.` }))
    spotDone(tid); showToast('Applied. Narrowing takes effect right away.')
  }
  const justOnce = (tid: string) => { const t = tr(tid)!; patchTrace(tid, (x) => ({ ...x, rv: 'once' })); patchClass(t.cls, (c) => addDot(c, 'r')); spotDone(tid) }
  const undo = (tid: string) => { patchTrace(tid, (x) => ({ ...x, undone: true, steps: [...x.steps, ['You undid it. Every change was rolled back.', 'you']] })); showToast('Undone. The record keeps both.') }

  /* ---------- the message bar ---------- */
  const STOPW = ['find', 'show', 'what', 'who', 'did', 'the', 'why', 'with', 'for', 'and', 'about', 'open', 'where']
  const handle = (raw: string) => {
    const t = raw.trim(); if (!t) return
    const l = t.toLowerCase()
    if (/\b(stop|pause)\b/.test(l)) return pauseAll()
    if (/\bresume\b/.test(l)) return resumeAll()
    if (/catch me up|today|summary|what did|how('s| is| are)/.test(l)) { const n = needs.length; setReply('Since yesterday the team handled 64 things: 61 on their own and 3 with your yes. Nothing was reversed. ' + (n ? (n === 1 ? 'One thing needs you.' : n + ' things need you.') : 'Nothing needs you.')); return }
    for (const a of AG) if (a.re.test(t) && !/find|why/.test(l)) return go(a.id)
    const toks = l.split(/[^a-z0-9.’']+/).filter((w) => w.length >= 3 && !STOPW.includes(w))
    for (const w of toks) {
      const hit = traces.find((x) => x.title.toLowerCase().includes(w) || x.steps.some((s) => s[0].toLowerCase().includes(w)))
      if (hit) return go('trace-' + hit.id)
      const ch = classes.find((x) => x.name.toLowerCase().includes(w))
      if (ch) { setOpen(ch.id); return go(ch.agent, true) }
    }
    setReply('I can catch you up, find any piece of work (try “j.park”), open a teammate, or pause everyone.')
  }

  return {
    classes, traces, paused, needs, view, open, reply, toast, allPaused,
    ag, cl, tr, pct, agree, needsOf, genOf, setReply, setToast, showToast,
    go, handOver, takeBack, pauseAll, resumeAll, togglePause, skip, bank, toggleClass, toClass,
    reviewOk, reviewNo, pickReason, submitWhy, applyGen, justOnce, undo, handle,
  }
}

export type WV = ReturnType<typeof useWarden>
const Ctx = createContext<WV | null>(null)
export function WardenProvider({ children }: { children: React.ReactNode }) { const w = useWarden(); return <Ctx.Provider value={w}>{children}</Ctx.Provider> }
export function useW() { const w = useContext(Ctx); if (!w) throw new Error('useW outside WardenProvider'); return w }
