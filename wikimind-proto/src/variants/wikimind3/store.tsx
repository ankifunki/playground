import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { CORPUS, FEED0, POOL, REFS, type FeedItem } from './data'
import { answerFor, bump, fileAnswer, inView, localAns, RM, route, type Att, type Cand } from './logic'

export type View = 'home' | 'page'
export type Tab = 'read' | 'talk' | 'history'
/** An unknown question's lifecycle. Nobody is contacted until the visitor taps Ask. */
export type QState = 'offer' | 'asking' | 'asked' | 'dup' | 'answered' | 'dismissed'
export type OpenQ = Cand & { id: string; msgId: string; resolved: boolean; ans?: string; unseen?: boolean; fresh?: boolean }
export type UMsg = { id: string; role: 'u'; t: string; files: Att[] }
export type AMsg = { id: string; role: 'a'; onPage: boolean; t?: string; n?: number[]; note?: string; src?: 'local' | 'asoka'; pending?: boolean; unknown?: boolean; cand?: Cand; qid?: string; qs?: QState }
export type RMsg = { id: string; role: 'r'; q: string; who: string; ans: string }
export type Msg = UMsg | AMsg | RMsg
export type Pop = { kind: 'ref'; n: number; away: boolean } | { kind: 'prev'; name: string }
export type Toast = { id: number; msg: string; act?: ToastAct; label?: string }
export type ToastAct = 'showchat' | 'goRenewal' | 'undonew'

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

function initialRoute(): { view: View; tab: Tab } {
  const m = location.hash.slice(1).match(/^approvals(?:-(talk|history))?$/)
  return m ? { view: 'page', tab: (m[1] as Tab) || 'read' } : { view: 'home', tab: 'read' }
}

function useWikimindState() {
  const init = useRef(initialRoute()).current
  const [view, setView] = useState<View>(init.view)
  const [tab, setTab] = useState<Tab>(init.tab)
  const [learned, setLearned] = useState(false)
  const [justLearned, setJustLearned] = useState(false)
  const [talkTyping, setTalkTyping] = useState(false)
  const [learnSeen, setLearnSeen] = useState(false)
  const [diffPlay, setDiffPlay] = useState(false)
  const [openRev, setOpenRev] = useState<string | null>(null)
  const [hlRev, setHlRev] = useState<string | null>(null)
  const [obs, setObs] = useState(3912)
  const [edits, setEdits] = useState(214)
  const [feed, setFeed] = useState<FeedItem[]>(FEED0)
  const [feedFresh, setFeedFresh] = useState(false)
  const [loopOn, setLoopOn] = useState(-1)
  const [newQs, setNewQs] = useState<OpenQ[]>([])
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [files, setFiles] = useState<Att[]>([])
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [pop, setPop] = useState<Pop | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const ver = 38
  // Derived counts, so they can never drift out of sync.
  const asks = 9 - (learned ? 1 : 0) + newQs.filter((q) => !q.resolved).length
  const qCount = (learned ? 1 : 2) + newQs.filter((q) => q.page && !q.resolved).length

  // Timers and callbacks read the latest state through this ref.
  const S = { view, tab, learned, chatOpen, msgs, newQs, text, files, pop }
  const latest = useRef(S)
  latest.current = S
  const timers = useRef<Record<string, number>>({})
  const lastMsgs = useRef<Msg[] | null>(null)
  const popFrom = useRef<HTMLElement | null>(null)
  const learning = useRef(false)
  const rec = useRef<any>(null)

  // Keep the URL hash in step with the view, as the original did.
  useEffect(() => {
    const h = view === 'home' ? 'home' : 'approvals' + (tab !== 'read' ? '-' + tab : '')
    if (location.hash.slice(1) !== h) history.replaceState(null, '', location.pathname + location.search + '#' + h)
  }, [view, tab])

  // Asoka keeps learning in the background: the Home feed and counters tick.
  useEffect(() => {
    let fi = 0
    const t = window.setInterval(() => {
      const p = POOL[fi++ % POOL.length]
      setFeed((f) => [p, ...f].slice(0, 4)); setFeedFresh(true)
      setObs((o) => o + 1 + Math.floor(Math.random() * 3))
      if (Math.random() < 0.4) setEdits((e) => e + 1)
      setLoopOn(fi % 5)
    }, 3600)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearTimeout(t)), [])

  /* ---------- toast ---------- */
  const showToast = (msg: string, act?: ToastAct, label?: string) => setToast({ id: Date.now() + Math.random(), msg, act, label })
  const hideToast = () => setToast(null)

  /* ---------- navigation ---------- */
  const closePop = () => {
    if (latest.current.pop && popFrom.current && document.body.contains(popFrom.current)) popFrom.current.focus()
    popFrom.current = null
    setPop(null)
  }
  const go = (v: View, o: { tab?: Tab; sec?: string | null } = {}) => {
    closePop(); setView(v)
    if (o.tab) setTab(o.tab); else if (v === 'page') setTab('read')
    window.setTimeout(() => {
      const el = o.sec ? document.getElementById('s-' + o.sec) : null
      if (el) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); else window.scrollTo(0, 0)
    }, 60)
  }
  const pickTab = (t: Tab) => { setTab(t); window.scrollTo(0, 0) }
  const openRef = (n: number, from: HTMLElement) => {
    popFrom.current = from
    setPop({ kind: 'ref', n, away: !!from.closest('#chat') || latest.current.view !== 'page' })
  }
  const openPrev = (name: string, from?: HTMLElement) => { popFrom.current = from || null; setPop({ kind: 'prev', name }) }
  const toHistory = () => {
    closePop(); const id = latest.current.learned ? 'r6' : 'r5'
    setTab('history'); setOpenRev(id); setHlRev(id); window.scrollTo(0, 0)
    window.setTimeout(() => setHlRev(null), 2500)
  }
  const toggleRev = (id: string) => setOpenRev((r) => (r === id ? null : id))

  /** Close the chat, open the page if needed, and highlight the sentence a source backs. */
  const showSrc = (n: number) => {
    closePop(); hideToast(); setChatOpen(false)
    const need = latest.current.view !== 'page' || latest.current.tab !== 'read'
    if (need) { setView('page'); setTab('read'); window.scrollTo(0, 0) }
    window.setTimeout(() => {
      const r = (document.querySelector(`main .art-body [data-ref="${n}"]`) || document.querySelector(`main [data-ref="${n}"]`)) as HTMLElement | null
      const blk = r ? r.closest('p,li,.obs,td,.cap') : document.getElementById('ref-' + n)
      if (!blk) return
      blk.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
      window.setTimeout(() => {
        blk.classList.remove('hlsent'); void (blk as HTMLElement).offsetWidth; blk.classList.add('hlsent')
        if (r) { bump(r); r.focus({ preventScroll: true }) }
      }, RM ? 0 : 380)
    }, need ? 120 : 20)
  }

  /* ---------- the learning moment ---------- */
  const learn = () => {
    if (latest.current.learned || learning.current) return
    learning.current = true; setTalkTyping(true)
    window.setTimeout(() => {
      const L = latest.current
      const seen = L.view === 'page' && L.tab === 'read' && inView(document.getElementById('renewal'))
      setTalkTyping(false); setLearned(true); setJustLearned(true); setEdits((e) => e + 1)
      setLearnSeen(seen); setDiffPlay(seen)
      if (!seen) showToast('Maria answered. Asoka updated the page.', 'goRenewal', 'See the change')
      window.setTimeout(() => { setJustLearned(false); setDiffPlay(false) }, 3200)
    }, RM ? 300 : 1800)
  }
  /** Scroll to the renewal card, then strike the old sentence and write the new one. */
  const showRenewal = () => {
    setLearnSeen(true); closePop(); hideToast(); setChatOpen(false)
    setView('page'); setTab('read'); setDiffPlay(false)
    window.setTimeout(() => document.getElementById('renewal')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }), 100)
    window.setTimeout(() => { setDiffPlay(true); window.setTimeout(() => setDiffPlay(false), 3200) }, RM ? 100 : 560)
  }

  /* ---------- chat ---------- */
  const patchMsg = (id: string, p: Partial<AMsg>) => setMsgs((ms) => ms.map((m) => (m.id === id ? ({ ...m, ...p } as Msg) : m)))
  const findA = (id: string) => latest.current.msgs.find((m) => m.id === id) as AMsg | undefined

  const markUnknown = (id: string, q: string) => {
    const L = latest.current
    const cand = route(q, L.view === 'page')
    const ex = L.newQs.find((x) => !x.resolved && x.q.toLowerCase() === cand.q.toLowerCase())
    patchMsg(id, ex ? { unknown: true, cand: ex, qs: 'dup', pending: false } : { unknown: true, cand, qs: 'offer', pending: false })
  }

  const ask = (q: string, atts: Att[] = []) => {
    q = (q || '').trim(); if (!q && !atts.length) return
    const L = latest.current
    const u: UMsg = { id: nid('u'), role: 'u', t: q, files: atts }
    const a: AMsg = { id: nid('a'), role: 'a', onPage: L.view === 'page' }
    setMsgs((ms) => [...ms, u, a]); setChatOpen(true)
    const local = q ? localAns(q, L.learned) : null
    const ans = local || (atts.length ? fileAnswer(atts, q) : null)
    window.setTimeout(() => {
      if (ans) patchMsg(a.id, { t: ans.t, n: ans.n, note: ans.note || '', src: 'local', pending: !!(CLAUDE && q && !atts.length) })
      else if (!CLAUDE) markUnknown(a.id, q)
      else patchMsg(a.id, { pending: true })
      if (!CLAUDE || !q || atts.length) return
      sampleP.then((sample) => {
        if (!sample) { if (!ans) markUnknown(a.id, q); else patchMsg(a.id, { pending: false }); return }
        const prompt = 'You are Asoka. Answer ONLY from these numbered statements about Northwind’s Opportunity approvals. At most 2 plain sentences. Start with the direct answer in a few words (for example “The CRO.”), then the reason. Cite the statement numbers you used. Mention an exception only if it changes the answer to this question. If a statement you use is marked unofficial, seen once, or open question, add a short plain-language note. If the statements do not answer the question, set unknown true. Return JSON only: {"answer":string,"cites":number[],"note":string,"unknown":boolean}\n\n' + CORPUS.map((c) => `[${c[0]}] ${c[1]}`).join('\n') + '\n\nQuestion: ' + q
        sample.json(prompt, { modelTier: 'quick' }).then((r) => {
          const n = (r && Array.isArray(r.cites) ? r.cites : []).filter((x: number) => REFS[x])
          if (r && !r.unknown && r.answer && n.length) patchMsg(a.id, { t: String(r.answer), n, note: r.note ? String(r.note) : '', src: 'asoka', pending: false })
          else if (!ans) markUnknown(a.id, q); else patchMsg(a.id, { pending: false })
        }).catch(() => { if (!ans) markUnknown(a.id, q); else patchMsg(a.id, { pending: false }) })
      })
    }, RM ? 0 : 450)
  }

  /** Fly the question into the count it just raised. */
  const flyQ = (q: OpenQ) => {
    const L = latest.current
    if (L.view === 'page' && L.tab === 'talk') return
    const to = document.getElementById(q.page ? 'qcnt' : 'n-asks')
    const from = document.querySelector(`[data-mi="${q.msgId}"] p`)
    if (!inView(to)) return
    if (RM || !from || !(from as HTMLElement).animate) { bump(to); return }
    const a = from.getBoundingClientRect(), b = to!.getBoundingClientRect(), f = document.createElement('div')
    f.className = 'flyq'; f.textContent = q.q; f.style.left = a.left + 'px'; f.style.top = a.top + 'px'; document.body.appendChild(f)
    const dx = b.left + b.width / 2 - (a.left + f.offsetWidth / 2), dy = b.top + b.height / 2 - (a.top + f.offsetHeight / 2)
    f.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * 0.55}px,${dy * 0.55 - 40}px) scale(.7)`, opacity: 1, offset: 0.6 }, { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0 }], { duration: 720, easing: 'cubic-bezier(.23,1,.32,1)' }).onfinish = () => { f.remove(); bump(to) }
  }

  const commitAsk = (msgId: string) => {
    const m = findA(msgId); if (!m || m.qs !== 'offer' || !m.cand) return
    const q: OpenQ = { ...m.cand, id: nid('q'), msgId, resolved: false, fresh: true }
    setNewQs((qs) => [q, ...qs]); patchMsg(msgId, { qs: 'asking', qid: q.id })
    window.setTimeout(() => flyQ(q), 300)
    window.setTimeout(() => setNewQs((qs) => qs.map((x) => (x.id === q.id ? { ...x, fresh: false } : x))), 2000)
    timers.current['u' + msgId] = window.setTimeout(() => setMsgs((ms) => ms.map((x) => (x.id === msgId && (x as AMsg).qs === 'asking' ? { ...x, qs: 'asked' } : x))), 5000)
    timers.current['a' + q.id] = window.setTimeout(() => resolveQ(q.id), 15000)
  }
  const undoAsk = (msgId: string) => {
    const m = findA(msgId); if (!m || m.qs !== 'asking') return
    window.clearTimeout(timers.current['u' + msgId]); window.clearTimeout(timers.current['a' + m.qid])
    setNewQs((qs) => qs.filter((x) => x.id !== m.qid)); patchMsg(msgId, { qs: 'offer', qid: undefined })
  }
  const notNow = (msgId: string) => { const m = findA(msgId); if (m && m.qs === 'offer') patchMsg(msgId, { qs: 'dismissed' }) }
  /** The person answers: the thread resolves, counts drop, and the answer lands in the conversation. */
  const resolveQ = (qid: string) => {
    const L = latest.current, q = L.newQs.find((x) => x.id === qid)
    if (!q || q.resolved) return
    window.clearTimeout(timers.current['a' + qid]); window.clearTimeout(timers.current['u' + q.msgId])
    const ans = answerFor(q)
    setNewQs((qs) => qs.map((x) => (x.id === qid ? { ...x, resolved: true, ans, unseen: !L.chatOpen } : x)))
    setMsgs((ms) => [...ms.map((x) => (x.id === q.msgId ? ({ ...x, qs: 'answered' } as Msg) : x)), { id: nid('r'), role: 'r', q: q.q, who: q.who, ans }])
    if (!L.chatOpen) showToast(`${q.who} answered your question.`, 'showchat', 'Open')
  }
  const resolveNewest = () => { const p = latest.current.newQs.filter((x) => !x.resolved); if (p.length) resolveQ(p[p.length - 1].id) }

  const showChat = () => { hideToast(); setNewQs((qs) => qs.map((x) => ({ ...x, unseen: false }))); setChatOpen(true) }
  const hideChat = () => setChatOpen(false)
  const newChat = () => { lastMsgs.current = latest.current.msgs; setMsgs([]); setChatOpen(false); showToast('Conversation cleared.', 'undonew', 'Undo') }
  const undoNew = () => { const l = lastMsgs.current; if (!l) return; lastMsgs.current = null; setMsgs((ms) => [...l, ...ms]); setChatOpen(true) }

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

  const runToastAct = (a: ToastAct) => { hideToast(); if (a === 'showchat') showChat(); else if (a === 'goRenewal') showRenewal(); else undoNew() }
  const area = (name: string) => {
    if (name === 'Sales Cloud') { showToast('Opening the featured Sales Cloud article.'); go('page') }
    else showToast('Prototype: only Opportunity approvals has a full page.')
  }

  return {
    view, tab, learned, justLearned, talkTyping, learnSeen, diffPlay, openRev, hlRev, obs, edits, ver, asks, qCount,
    feed, feedFresh, loopOn, newQs, msgs, chatOpen, files, text, listening, pop, toast,
    setText, setLoopOn,
    go, pickTab, openRef, openPrev, closePop, toHistory, toggleRev, showSrc,
    learn, showRenewal, ask, commitAsk, undoAsk, notNow, resolveNewest, showChat, hideChat, newChat,
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
