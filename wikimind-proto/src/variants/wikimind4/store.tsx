import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { CORPUS, FEED0, POOL, REF_SEC, REFS, type FeedItem } from './data'
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
export type Pop = { kind: 'blame'; ns: number[] } | { kind: 'prev'; name: string }
/** The sentence whose provenance is showing in the margin. Pinned by a click, transient on hover. */
export type Blame = { ns: number[]; el: HTMLElement; pinned: boolean }
export type Toast = { id: number; msg: string; act?: ToastAct; label?: string; qa?: string }
export type ToastAct = 'showqa' | 'goRenewal'
export type Step = 'idle' | 'sent' | 'done'
/** Trust vectors on Home: which misses are open, the handover, and access grants. */
export type TV = { miss: boolean; hand: Step; acc: Record<'okta' | 'netsuite', Step> }

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
  const [feed, setFeed] = useState<FeedItem[]>(FEED0)
  const [feedTick, setFeedTick] = useState(0)
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
  const [tv, setTv] = useState<TV>({ miss: false, hand: 'idle', acc: { okta: 'idle', netsuite: 'idle' } })

  // Derived counts, so they can never drift out of sync.
  const asks = 9 - (learned ? 1 : 0) + newQs.filter((q) => !q.resolved).length
  // Path to full automation, derived: handing over license seats adds 2 points; each access grant removes what it was blocking.
  const auto = 64 + (tv.hand === 'done' ? 2 : 0)
  const blocked = 7 - (tv.acc.okta === 'done' ? 4 : 0) - (tv.acc.netsuite === 'done' ? 2 : 0)
  const tvNums = { auto, blocked, asks: 100 - auto - blocked }

  // Timers and callbacks read the latest state through this ref.
  const S = { view, learned, qas, newQs, text, files, pop, blame }
  const latest = useRef(S)
  latest.current = S
  const timers = useRef<Record<string, number>>({})
  const popFrom = useRef<HTMLElement | null>(null)
  const learning = useRef(false)
  const rec = useRef<any>(null)

  useEffect(() => {
    const h = view === 'home' ? 'home' : arrival ? 'approvals-slack' : 'approvals'
    if (location.hash.slice(1) !== h) history.replaceState(null, '', location.pathname + location.search + '#' + h)
  }, [view, arrival])

  // The agents keep learning in the background: the live line, the feed and the counter tick.
  useEffect(() => {
    let fi = 0
    const t = window.setInterval(() => {
      const p = POOL[fi++ % POOL.length]
      setFeed((f) => [p, ...f].slice(0, 6)); setFeedTick((n) => n + 1)
      setObs((o) => o + 1 + Math.floor(Math.random() * 3))
    }, 5200)
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
    const local = q ? localAns(q, L.learned) : null
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
        const prompt = 'You are the Approvals agent, one of Northwind’s Asoka agents. Answer ONLY from these numbered statements about Northwind’s Opportunity approvals. At most 2 plain sentences. Start with the direct answer in a few words (for example “The CRO.”), then the reason. Cite the statement numbers you used. Mention an exception only if it changes the answer to this question. If a statement you use is marked unofficial, seen once, or open question, add a short plain-language note. If the statements do not answer the question, set unknown true. Return JSON only: {"answer":string,"cites":number[],"note":string,"unknown":boolean}\n\n' + CORPUS.map((c) => `[${c[0]}] ${c[1]}`).join('\n') + '\n\nQuestion: ' + q
        sample.json(prompt, { modelTier: 'quick' }).then((r) => {
          const n = (r && Array.isArray(r.cites) ? r.cites : []).filter((x: number) => REFS[x])
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

  /* ---------- trust vectors ---------- */
  const tvMiss = () => setTv((t) => ({ ...t, miss: !t.miss }))
  /** Widening what an agent does alone always needs a second approver. */
  const tvHand = () => {
    if (tv.hand !== 'idle') return
    setTv((t) => ({ ...t, hand: 'sent' }))
    window.setTimeout(() => { setTv((t) => ({ ...t, hand: 'done' })); showToast('Dev approved. The Access agent now handles license seats on its own.') }, 2000)
  }
  const tvAcc = (k: 'okta' | 'netsuite') => {
    if (tv.acc[k] !== 'idle') return
    setTv((t) => ({ ...t, acc: { ...t.acc, [k]: 'sent' } }))
    window.setTimeout(() => { setTv((t) => ({ ...t, acc: { ...t.acc, [k]: 'done' } })); showToast(k === 'okta' ? 'Dev approved. The Security agent can read Okta sign-in logs.' : 'Dev approved. The Finance ops agent can write to NetSuite.') }, 2000)
  }

  const runToastAct = (t: Toast) => { hideToast(); if (t.act === 'showqa' && t.qa) showQa(t.qa); else if (t.act === 'goRenewal') showRenewal() }
  const area = (name: string) => {
    if (name === 'Sales Cloud') { showToast('Opening the featured Sales Cloud page.'); go('page') }
    else showToast('Prototype: only Opportunity approvals has a full page.')
  }

  return {
    tv, tvNums, tvMiss, tvHand, tvAcc,
    view, arrival, flash, learned, talkTyping, learnSeen, diffPlay, obs, asks,
    feed, feedTick, newQs, qas, freshQa, files, text, listening, pop, blame, toast,
    setText,
    go, openPrev, closePop, hoverBlame, pinBlame, clearBlame, showClaims, arrive, leaveArrival,
    learn, showRenewal, ask, commitAsk, undoAsk, notNow, closeQa, resolveNewest, showQa,
    send, addFiles, removeFile, toggleMic, showToast, hideToast, runToastAct, area,
  }
}

export type W = ReturnType<typeof useWikimindState>
const Ctx = createContext<W | null>(null)
export function WikimindProvider({ children }: { children: React.ReactNode }) {
  const w = useWikimindState()
  return <Ctx.Provider value={w}>{children}</Ctx.Provider>
}
export function useW() { const w = useContext(Ctx); if (!w) throw new Error('useW outside WikimindProvider'); return w }
