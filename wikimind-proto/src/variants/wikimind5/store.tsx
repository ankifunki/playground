import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { corpus, RECEIPT_LIVE, RECEIPTS0, REF_CFG, REF_SEC, refFor, WIRE_POOL, type Receipt, type Wire } from './data'
import { answerFor, bump, fileAnswer, inView, localAns, RM, route, type Att, type Cand } from './logic'

export type View = 'home' | 'page'
/** An unknown question's lifecycle. Nobody is contacted until the visitor taps Ask. */
export type QState = 'offer' | 'asking' | 'asked' | 'dup' | 'answered' | 'dismissed'
export type OpenQ = Cand & { id: string; qaId: string; resolved: boolean; ans?: string; fresh?: boolean }
/**
 * A question and its answer. There is no separate chat: the block is written into the view it was asked from,
 * next to the sentences it rests on (sec), and only the visitor sees it.
 */
export type QA = {
  id: string; q: string; files: Att[]; where: View; sec: string
  t?: string; n?: number[]; note?: string; src?: 'local' | 'asoka'; pending?: boolean
  unknown?: boolean; cand?: Cand; qid?: string; qs?: QState; reply?: { who: string; ans: string }
}
export type Proof = 'complete' | 'right' | 'current'
export type Pop = { kind: 'blame'; ns: number[] } | { kind: 'prev'; name: string } | { kind: 'page'; i: number } | { kind: 'proof'; k: Proof }
/** The sentence whose provenance is showing in the margin. Pinned by a click, transient on hover. */
export type Blame = { ns: number[]; el: HTMLElement; pinned: boolean }
export type Toast = { id: number; msg: string; act?: ToastAct; label?: string; qa?: string }
export type ToastAct = 'showqa' | 'goRenewal' | 'goCfg'
/** The live Salesforce change: observed, then re-verified by Dana. */
export type Cfg = 'idle' | 'changed' | 'verified'
/** A request to load a deal into the simulator (from the arrival card or the tour). */
export type SimReq = { amt: number; disc: number; n: number }

type Claude = { use: (k: string) => Promise<{ json: (p: string, o?: object) => Promise<any> } | null> }
const CLAUDE: Claude | null = (() => {
  const w = window as any
  try { if (w.claude?.use) return w.claude } catch { /* cross-origin */ }
  try { if (w.parent && w.parent !== w && w.parent.claude?.use) return w.parent.claude } catch { /* cross-origin */ }
  return null
})()
const sampleP = CLAUDE ? CLAUDE.use('sample').catch(() => null) : Promise.resolve(null)

let uid = 0
const nid = (p: string) => p + ++uid

function initialRoute(): { view: View; arrival: boolean } {
  const m = location.hash.slice(1).match(/^approvals(-slack)?$/)
  return m ? { view: 'page', arrival: !!m[1] } : { view: 'home', arrival: false }
}
/** The margin exists on wide screens. Narrower ones show provenance in the bottom sheet. */
const wide = () => window.matchMedia('(min-width:1100px)').matches

function useWikimindState() {
  const init = useRef(initialRoute()).current
  const [view, setView] = useState<View>(init.view)
  const [arrival, setArrival] = useState(init.arrival)
  const [learned, setLearned] = useState(false)
  const [talkTyping, setTalkTyping] = useState(false)
  const [learnSeen, setLearnSeen] = useState(false)
  const [diffPlay, setDiffPlay] = useState(false)
  const [obs, setObs] = useState(3912)
  const [wire, setWire] = useState<Wire[]>(() => WIRE_POOL.slice(0, 5).map((x, i) => ({ ...x, id: -i - 1 })))
  const [wireOn, setWireOn] = useState(true)
  const [lastObs, setLastObs] = useState(() => Date.now() - 4000)
  const [receipts, setReceipts] = useState<Receipt[]>(RECEIPTS0)
  const [lens, setLens] = useState(false)
  const [fin, setFin] = useState(() => { REF_CFG.v = null; return 20 })
  const [cfg, setCfg] = useState<Cfg>('idle')
  const [cfgAnim, setCfgAnim] = useState(false)
  const [tour, setTour] = useState<number | null>(null)
  const [simReq, setSimReq] = useState<SimReq | null>(null)
  const [replayN, setReplayN] = useState(0)
  const [newQs, setNewQs] = useState<OpenQ[]>([])
  const [qas, setQas] = useState<QA[]>([])
  const [freshQa, setFreshQa] = useState<string | null>(null)
  const [files, setFiles] = useState<Att[]>([])
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [pop, setPop] = useState<Pop | null>(null)
  const [blame, setBlame] = useState<Blame | null>(null)
  /** Sentences lit up by "Show on page". State, not a DOM class, so a re-render (e.g. hover) can't wipe it. */
  const [flash, setFlash] = useState<number[] | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  // Derived counts, so they can never drift out of sync.
  const asks = 9 - (learned ? 1 : 0) + newQs.filter((q) => !q.resolved).length

  // Timers and callbacks read the latest state through this ref.
  const S = { view, learned, qas, newQs, text, files, pop, blame, cfg, wireOn, fin }
  const latest = useRef(S)
  latest.current = S
  const timers = useRef<Record<string, number>>({})
  const popFrom = useRef<HTMLElement | null>(null)
  const learning = useRef(false)
  const observing = useRef(false)
  const wireI = useRef(5)
  const rec = useRef<any>(null)

  useEffect(() => {
    const h = view === 'home' ? 'home' : arrival ? 'approvals-slack' : 'approvals'
    if (location.hash.slice(1) !== h) history.replaceState(null, '', location.pathname + location.search + '#' + h)
  }, [view, arrival])

  // The agents keep working in the background: the wire on Home and the observation count tick (pausable).
  useEffect(() => {
    const t = window.setInterval(() => {
      setObs((o) => o + 1 + Math.floor(Math.random() * 3)); setLastObs(Date.now())
      if (!latest.current.wireOn) return
      const p = WIRE_POOL[wireI.current++ % WIRE_POOL.length]
      setWire((w) => [{ ...p, id: wireI.current }, ...w].slice(0, 6))
    }, 4600)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearTimeout(t)), [])

  /* ---------- toast ---------- */
  const showToast = (msg: string, act?: ToastAct, label?: string, qa?: string) => setToast({ id: Date.now() + Math.random(), msg, act, label, qa })
  const hideToast = () => setToast(null)

  /* ---------- navigation ---------- */
  const closePop = () => {
    if (latest.current.pop && popFrom.current && document.body.contains(popFrom.current)) popFrom.current.focus()
    popFrom.current = null
    setPop(null)
  }
  const go = (v: View, o: { sec?: string | null } = {}) => {
    closePop(); setBlame(null); setView(v)
    if (v === 'home') setArrival(false)
    window.setTimeout(() => {
      const el = o.sec ? document.getElementById('s-' + o.sec) : null
      if (el) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); else window.scrollTo(0, 0)
    }, 60)
  }
  const openPrev = (name: string, from?: HTMLElement) => { popFrom.current = from || null; setPop({ kind: 'prev', name }) }
  /** A page from the corpus grid. */
  const openCell = (i: number) => { popFrom.current = null; setPop({ kind: 'page', i }) }
  /** The proof behind one of the four trust answers. */
  const openProof = (k: Proof, from?: HTMLElement) => { popFrom.current = from || null; setPop({ kind: 'proof', k }) }

  /* ---------- provenance: every sentence knows where it came from ---------- */
  const hoverBlame = (ns: number[] | null, el?: HTMLElement) => {
    if (!wide()) return
    setBlame((b) => (b?.pinned ? b : ns && el ? { ns, el, pinned: false } : null))
  }
  const pinBlame = (ns: number[], el: HTMLElement) => {
    if (!wide()) { popFrom.current = el; setPop({ kind: 'blame', ns }); return }
    setBlame((b) => (b?.pinned && b.el === el ? null : { ns, el, pinned: true }))
  }
  const clearBlame = () => setBlame(null)

  /** Open the page if needed, then light up every sentence that rests on these sources. */
  const showClaims = (ns: number[]) => {
    closePop(); hideToast(); setBlame(null)
    const need = latest.current.view !== 'page'
    if (need) { setView('page'); window.scrollTo(0, 0) }
    window.setTimeout(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('main .cl')).filter((e) => (e.dataset.ns || '').split(',').some((x) => ns.includes(+x)))
      if (!els.length) return
      els[0].scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
      window.setTimeout(() => {
        setFlash(null)
        requestAnimationFrame(() => { setFlash(ns); window.clearTimeout(timers.current.flash); timers.current.flash = window.setTimeout(() => setFlash(null), 2600) })
      }, RM ? 0 : 380)
    }, need ? 140 : 20)
  }

  /* ---------- arriving from Slack ---------- */
  const arrive = () => { closePop(); setBlame(null); setView('page'); setArrival(true); window.scrollTo(0, 0) }
  /** Load a deal into the simulator, scroll to it and play. */
  const tryDeal = (amt: number, disc: number) => {
    closePop(); setBlame(null)
    const need = latest.current.view !== 'page'
    if (need) setView('page')
    setSimReq((r) => ({ amt, disc, n: (r?.n || 0) + 1 }))
    window.setTimeout(() => document.getElementById('s-try')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }), need ? 120 : 20)
  }
  const leaveArrival = () => setArrival(false)

  /* ---------- the learning moment ---------- */
  const learn = () => {
    if (latest.current.learned || learning.current) return
    learning.current = true; setTalkTyping(true)
    window.setTimeout(() => {
      const L = latest.current
      const seen = L.view === 'page' && inView(document.getElementById('renewal'))
      setTalkTyping(false); setLearned(true)
      setLearnSeen(seen); setDiffPlay(seen)
      if (!seen) showToast('Maria answered. The Approvals agent rewrote the page.', 'goRenewal', 'See the change')
      setLastObs(Date.now())
      window.setTimeout(() => setDiffPlay(false), 3200)
    }, RM ? 300 : 1800)
  }
  /** Scroll to the renewal card, then strike the old sentence and write the new one. */
  const showRenewal = () => {
    setLearnSeen(true); closePop(); hideToast(); setBlame(null)
    setView('page'); setDiffPlay(false)
    window.setTimeout(() => document.getElementById('renewal')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }), 100)
    window.setTimeout(() => { setDiffPlay(true); window.setTimeout(() => setDiffPlay(false), 3200) }, RM ? 100 : 560)
  }

  /**
   * The live Salesforce change (brief §2): Priya edits Finance review in setup. The Approvals agent observes it,
   * rewrites the sentence it contradicts, withdraws Dana's verification and asks her to re-check. She does, a few seconds later.
   */
  const observeChange = () => {
    if (latest.current.cfg !== 'idle' || observing.current) return
    observing.current = true
    const L = latest.current, el = document.getElementById('cfg-sentence'), seen = L.view === 'page' && inView(el)
    setFin(25); setCfg('changed'); setCfgAnim(true); setLastObs(Date.now()); REF_CFG.v = null
    setWire((w) => [{ id: ++wireI.current, ag: 'approvals' as const, t: 'Saw Priya change Finance review in Salesforce: over 25% (was 20%)', page: 'Discount approvals', ns: [15] }, ...w].slice(0, 6))
    if (!seen) showToast('Salesforce changed. The Approvals agent rewrote Discount approvals.', 'goCfg', 'See it')
    window.setTimeout(() => setCfgAnim(false), 4200)
    timers.current.reverify = window.setTimeout(() => {
      REF_CFG.v = 'Dana Ruiz, just now'; setCfg('verified')
      setWire((w) => [{ id: ++wireI.current, ag: 'approvals' as const, t: 'Dana re-verified the Finance review rule', page: 'Discount approvals', ns: [15] }, ...w].slice(0, 6))
    }, RM ? 2000 : 7000)
  }
  const showCfg = () => {
    closePop(); hideToast(); setBlame(null); setView('page'); setCfgAnim(false)
    window.setTimeout(() => document.getElementById('cfg-sentence')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }), 100)
    window.setTimeout(() => { setCfgAnim(true); window.setTimeout(() => setCfgAnim(false), 4200) }, RM ? 100 : 560)
  }
  /** A new receipt: an agent just cited this page to justify what it did. */
  const addLiveReceipt = () => setReceipts((rs) => (rs.some((x) => x.id === RECEIPT_LIVE.id) ? rs : [RECEIPT_LIVE, ...rs]))
  const toggleWire = () => setWireOn((v) => !v)
  /** Ask the corpus on Home to replay how it was built (used by the tour). */
  const replay = () => setReplayN((n) => n + 1)

  /* ---------- the guided demo (tour) ---------- */
  const startTour = () => { closePop(); hideToast(); setBlame(null); setTour(0) }
  const endTour = () => setTour(null)

  /* ---------- asking: answers are written into the page ---------- */
  const patchQa = (id: string, p: Partial<QA>) => setQas((qs) => qs.map((m) => (m.id === id ? { ...m, ...p } : m)))
  const findQa = (id: string) => latest.current.qas.find((m) => m.id === id)
  const toQa = (id: string, after = 80) => window.setTimeout(() => {
    const el = document.getElementById('qa-' + id)
    if (el && !inView(el)) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
  }, after)

  const markUnknown = (id: string, q: string) => {
    const L = latest.current
    const cand = route(q, L.view === 'page')
    const ex = L.newQs.find((x) => !x.resolved && x.q.toLowerCase() === cand.q.toLowerCase())
    patchQa(id, ex ? { unknown: true, cand: ex, qs: 'dup', pending: false } : { unknown: true, cand, qs: 'offer', pending: false })
  }

  const ask = (q: string, atts: Att[] = []) => {
    q = (q || '').trim(); if (!q && !atts.length) return
    const L = latest.current
    const local = q ? localAns(q, L.learned, L.fin) : null
    const ans = local || (atts.length ? fileAnswer(atts, q) : null)
    const sec = L.view === 'home' ? 'home' : ans && ans.n.length ? REF_SEC[ans.n[0]] || 'lead' : ans ? 'lead' : 'practice'
    const qa: QA = { id: nid('qa'), q: q || (atts.length === 1 ? atts[0].name : atts.length + ' files'), files: atts, where: L.view, sec }
    setQas((qs) => [...qs, qa]); setFreshQa(qa.id); setBlame(null)
    toQa(qa.id)
    window.setTimeout(() => {
      if (ans) patchQa(qa.id, { t: ans.t, n: ans.n, note: ans.note || '', src: 'local', pending: !!(CLAUDE && q && !atts.length) })
      else if (!CLAUDE) markUnknown(qa.id, q)
      else patchQa(qa.id, { pending: true })
      toQa(qa.id, 60)
      if (!CLAUDE || !q || atts.length) return
      sampleP.then((sample) => {
        if (!sample) { if (!ans) markUnknown(qa.id, q); else patchQa(qa.id, { pending: false }); return }
        const prompt = 'You are the Approvals agent, one of Northwind’s Asoka agents. Answer ONLY from these numbered statements about Northwind’s Opportunity approvals. At most 2 plain sentences. Start with the direct answer in a few words (for example “The CRO.”), then the reason. Cite the statement numbers you used. Mention an exception only if it changes the answer to this question. If a statement you use is marked unofficial, seen once, or open question, add a short plain-language note. If the statements do not answer the question, set unknown true. Return JSON only: {"answer":string,"cites":number[],"note":string,"unknown":boolean}\n\n' + corpus(L.fin).map((c) => `[${c[0]}] ${c[1]}`).join('\n') + '\n\nQuestion: ' + q
        sample.json(prompt, { modelTier: 'quick' }).then((r) => {
          const n = (r && Array.isArray(r.cites) ? r.cites : []).filter((x: number) => refFor(x))
          if (r && !r.unknown && r.answer && n.length) patchQa(qa.id, { t: String(r.answer), n, note: r.note ? String(r.note) : '', src: 'asoka', pending: false })
          else if (!ans) markUnknown(qa.id, q); else patchQa(qa.id, { pending: false })
        }).catch(() => { if (!ans) markUnknown(qa.id, q); else patchQa(qa.id, { pending: false }) })
      })
    }, RM ? 0 : 450)
  }

  const commitAsk = (qaId: string) => {
    const m = findQa(qaId); if (!m || m.qs !== 'offer' || !m.cand) return
    const q: OpenQ = { ...m.cand, id: nid('q'), qaId, resolved: false, fresh: true }
    setNewQs((qs) => [q, ...qs]); patchQa(qaId, { qs: 'asking', qid: q.id })
    if (latest.current.view === 'home') window.setTimeout(() => bump(document.getElementById('n-asks')), 120)
    window.setTimeout(() => setNewQs((qs) => qs.map((x) => (x.id === q.id ? { ...x, fresh: false } : x))), 2000)
    timers.current['u' + qaId] = window.setTimeout(() => setQas((qs) => qs.map((x) => (x.id === qaId && x.qs === 'asking' ? { ...x, qs: 'asked' } : x))), 5000)
    timers.current['a' + q.id] = window.setTimeout(() => resolveQ(q.id), 15000)
  }
  const undoAsk = (qaId: string) => {
    const m = findQa(qaId); if (!m || m.qs !== 'asking') return
    window.clearTimeout(timers.current['u' + qaId]); window.clearTimeout(timers.current['a' + m.qid])
    setNewQs((qs) => qs.filter((x) => x.id !== m.qid)); patchQa(qaId, { qs: 'offer', qid: undefined })
  }
  const notNow = (qaId: string) => { const m = findQa(qaId); if (m && m.qs === 'offer') patchQa(qaId, { qs: 'dismissed' }) }
  /** Remove an answer from the page. A question an agent is already asking keeps going. */
  const closeQa = (qaId: string) => setQas((qs) => qs.filter((x) => x.id !== qaId))
  /** The person answers: the question resolves, counts drop, and the answer is written into the same block. */
  const resolveQ = (qid: string) => {
    const L = latest.current, q = L.newQs.find((x) => x.id === qid)
    if (!q || q.resolved) return
    window.clearTimeout(timers.current['a' + qid]); window.clearTimeout(timers.current['u' + q.qaId])
    const ans = answerFor(q)
    setNewQs((qs) => qs.map((x) => (x.id === qid ? { ...x, resolved: true, ans } : x)))
    const qa = L.qas.find((x) => x.id === q.qaId)
    if (!qa) return
    patchQa(q.qaId, { qs: 'answered', reply: { who: q.who, ans } })
    const el = document.getElementById('qa-' + q.qaId)
    if (!(qa.where === L.view && inView(el))) showToast(`${q.who} answered your question.`, 'showqa', 'Show', q.qaId)
  }
  const resolveNewest = () => { const p = latest.current.newQs.filter((x) => !x.resolved); if (p.length) resolveQ(p[0].id) }
  const showQa = (qaId: string) => {
    hideToast(); const qa = findQa(qaId); if (!qa) return
    if (qa.where !== latest.current.view) { setView(qa.where); window.scrollTo(0, 0) }
    setFreshQa(qaId); toQa(qaId, 140)
  }

  /* ---------- composer ---------- */
  const send = () => {
    const L = latest.current
    if (!L.text.trim() && !L.files.length) { document.getElementById('cin')?.focus(); return }
    const q = L.text, atts = L.files
    setText(''); setFiles([]); ask(q, atts)
  }
  const addFiles = (list: FileList | null, kindOf: (f: File) => Att['kind']) => {
    if (!list) return
    setFiles((fs) => {
      const out = fs.slice()
      Array.from(list).forEach((f) => { if (out.length < 4) out.push({ name: f.name, size: f.size, type: f.type, kind: kindOf(f), url: /^image\//.test(f.type) ? URL.createObjectURL(f) : '' }) })
      return out
    })
  }
  const removeFile = (i: number) => setFiles((fs) => fs.filter((_, j) => j !== i))
  const toggleMic = () => {
    const w = window as any, SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) { showToast('Voice isn’t available in this browser. Type instead.'); return }
    if (rec.current) { rec.current.stop(); return }
    try {
      const r = new SR(); r.lang = 'en-US'; r.interimResults = true; r.continuous = false
      r.onresult = (e: any) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setText(t); latest.current.text = t }
      r.onerror = (e: any) => showToast(e.error === 'not-allowed' ? 'Microphone access was blocked.' : 'Couldn’t hear that. Try again.')
      r.onend = () => { setListening(false); rec.current = null; if (latest.current.text.trim()) send() }
      r.start(); rec.current = r; setListening(true)
    } catch { setListening(false); showToast('Microphone is blocked here. Type instead.') }
  }

  const runToastAct = (t: Toast) => { hideToast(); if (t.act === 'showqa' && t.qa) showQa(t.qa); else if (t.act === 'goRenewal') showRenewal(); else if (t.act === 'goCfg') showCfg() }

  return {
    view, arrival, flash, learned, talkTyping, learnSeen, diffPlay, obs, asks, lastObs,
    wire, wireOn, receipts, lens, fin, cfg, cfgAnim, tour, simReq, replayN,
    newQs, qas, freshQa, files, text, listening, pop, blame, toast,
    setText, setLens, setTour,
    go, openPrev, openCell, openProof, closePop, hoverBlame, pinBlame, clearBlame, showClaims, arrive, leaveArrival, tryDeal,
    learn, showRenewal, observeChange, showCfg, addLiveReceipt, toggleWire, replay, startTour, endTour,
    ask, commitAsk, undoAsk, notNow, closeQa, resolveNewest, showQa,
    send, addFiles, removeFile, toggleMic, showToast, hideToast, runToastAct,
  }
}

export type W = ReturnType<typeof useWikimindState>
const Ctx = createContext<W | null>(null)
export function WikimindProvider({ children }: { children: React.ReactNode }) {
  const w = useWikimindState()
  return <Ctx.Provider value={w}>{children}</Ctx.Provider>
}
export function useW() { const w = useContext(Ctx); if (!w) throw new Error('useW outside WikimindProvider'); return w }
