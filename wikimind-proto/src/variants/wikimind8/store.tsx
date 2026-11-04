import type React from 'react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AgentId } from './data'
import type { TStep } from './traces'

export type Act = { id: number; ag: AgentId | 'person'; who?: string; t: string; page: string; block?: string; at: number; kind: 'edit' | 'read' | 'verify' | 'ask' }
/** Why a block changed: shown in the block's margin chip and its popover. */
export type Why = { ag: AgentId; t: string; src: string; before: string; at: number }
/** Chat: a conversation with the jobs in the right panel. Objects are live UI pulled into the thread. */
export type ChatObj =
  | { k: 'rule'; block: string }
  | { k: 'record'; deal: string }
  | { k: 'route'; deal: string }
  | { k: 'action'; deal: string; state: 'ask' | 'running' | 'done' | 'cancel'; step: number }
  | { k: 'slack'; deal: string; state: 'draft' | 'sent' | 'cancel' }
  | { k: 'person'; q: string; state: 'draft' | 'sent' | 'cancel' }
export type ChatMsg = { id: number; who: 'you' | AgentId | 'none'; text: string; objs?: ChatObj[]; next?: string[]; typing?: boolean }
export type Presence = { ag: AgentId; block: string; label: string; page: string } | null

type W = {
  page: string; go: (p: string) => void
  fin: 20 | 25; verify: 'ok' | 'checking'; qe: [number, number]; renewal: 'asking' | 'answered'; cpq: 'failing' | 'fixed'
  why: Record<string, Why>; presence: Presence; acts: Act[]; now: number
  playing: boolean; setPlaying: (b: boolean) => void
  rail: boolean; setRail: (b: boolean) => void; nav: boolean; setNav: (b: boolean) => void
  replay: () => void; jump: (block: string) => void; log: (a: Omit<Act, 'id' | 'at'>) => void
  trace: string | null; openTrace: (id: string | null) => void; extra: Record<string, TStep[]>
  agent: AgentId | null; openAgent: (a: AgentId | null) => void
  tour: number | null; setTour: (n: number | null) => void; change: () => void
  /** Arrival from a Slack citation (the brief's third audience), and whether the visitor asked the page's owner. */
  arrive: boolean; arriveSlack: () => void; leaveArrival: () => void; askedOwner: boolean; askOwner: () => void
  /** The reliability misses, in the right panel: all of them or one job's. */
  misses: AgentId | 'all' | null; openMisses: (m: AgentId | 'all' | null) => void
  /** All pages: the search term it opens with. */
  search: string; setSearch: (q: string) => void
  /** Proof on (default) or off (?proof=off), for the assumption test that hides traces and verification. */
  proof: boolean
  chat: ChatMsg[]; setChat: React.Dispatch<React.SetStateAction<ChatMsg[]>>; chatOn: boolean; setChatOn: (b: boolean) => void
  /** Start (or continue) a chat from the ask bar; `from` is where the question was typed, for the hand-off motion. */
  startChat: (text: string, from?: DOMRect | null) => void; chatFrom: DOMRect | null
  /** Wikimind 9: the variant flag, and access grants that close a gap (Wikimind 4's controls): idle, asking Dev, granted. */
  v9: boolean; access: Record<Gap, 'idle' | 'asking' | 'done'>; grant: (g: Gap) => void
  /** Wikimind 9: one updates feed in full, in the right panel. */
  feed: 'ch' | 'le' | 'as' | null; openFeed: (f: 'ch' | 'le' | 'as' | null) => void
}
export type Gap = 'okta' | 'netsuite'
/** What each access gap blocks, and what granting it unblocks (points of work Asoka can then run). */
export const GAPS: Record<Gap, { t: string; scope: string; ag: AgentId; job: string; pts: number; jobPts: number }> = {
  okta: { t: 'Okta sign-in logs', scope: 'read', ag: 'security', job: 'Security', pts: 4, jobPts: 8 },
  netsuite: { t: 'NetSuite', scope: 'write', ag: 'finance', job: 'Finance ops', pts: 2, jobPts: 5 },
}
const Ctx = createContext<W | null>(null)
export const useW = () => useContext(Ctx)!
export const RM = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const SEED = (t0: number): Act[] => [
  { id: -1, ag: 'integrations', t: 'Asked Ben Ito why multi-currency quotes fail to sync', page: 'discount-approvals', block: 'cfg-cpq', at: t0 - 95e3, kind: 'ask' },
  { id: -2, ag: 'access', t: 'Updated Deal Desk: Priya Shah now leads it', page: 'license-seats', at: t0 - 240e3, kind: 'edit' },
  { id: -3, ag: 'support', t: 'Linked 3 cases to the data-loss escalation rule', page: 'case-escalation', at: t0 - 410e3, kind: 'edit' },
  { id: -4, ag: 'approvals', t: 'Re-read Discount approvals against Salesforce', page: 'discount-approvals', block: 'sum', at: t0 - 4e3, kind: 'read' },
]

/**
 * The live engine. A short script plays while you read: a job reads Slack and updates a count; Salesforce changes and
 * the job rewrites a rule (verification is withdrawn, then restored); a person answers an open question; a sync is fixed.
 * Each edit is announced first (presence: "Approvals job is editing Who approves"), then typed into the block.
 * Keys: C change, L answer, R replay.
 */
export function Provider({ children, v9 = false }: { children: ReactNode; v9?: boolean }) {
  const [page, setPage] = useState('home'), [tour, setTour] = useState<number | null>(null)
  const [fin, setFin] = useState<20 | 25>(20), [verify, setVerify] = useState<'ok' | 'checking'>('ok')
  const [qe, setQe] = useState<[number, number]>([9, 12]), [renewal, setRenewal] = useState<'asking' | 'answered'>('asking'), [cpq, setCpq] = useState<'failing' | 'fixed'>('failing')
  const [why, setWhy] = useState<Record<string, Why>>({}), [presence, setPresence] = useState<Presence>(null)
  const [now, setNow] = useState(Date.now()), [acts, setActs] = useState<Act[]>(() => SEED(Date.now()))
  const [playing, setPlaying] = useState(!RM), [rail, setRailS] = useState(false), [nav, setNavS] = useState(false)
  // One floating panel at a time: opening the nav closes the right panel, and the other way round.
  const setNav = (b: boolean) => { setNavS(b); if (b) setRailS(false) }
  const setRail = (b: boolean) => { setRailS(b); if (b) setNavS(false) }
  const [run, setRun] = useState(0), [trace, setTrace] = useState<string | null>(null), [extra, setExtra] = useState<Record<string, TStep[]>>({})
  const add = (id: string, ...st: TStep[]) => setExtra((m) => ({ ...m, [id]: [...(m[id] || []), ...st] }))
  const [agent, setAgent] = useState<AgentId | null>(null), [misses, setMisses] = useState<AgentId | 'all' | null>(null)
  const [arrive, setArrive] = useState(false), [askedOwner, setAskedOwner] = useState(false), [search, setSearch] = useState('')
  const [chat, setChat] = useState<ChatMsg[]>([]), [chatOn, setChatOnS] = useState(false), [chatFrom, setChatFrom] = useState<DOMRect | null>(null)
  const cid = useRef(1)
  const [feed, setFeed] = useState<'ch' | 'le' | 'as' | null>(null)
  const openFeed = (f: 'ch' | 'le' | 'as' | null) => { setTrace(null); setAgent(null); setMisses(null); setFeed(f); if (f) setRail(true) }
  const [access, setAccess] = useState<Record<Gap, 'idle' | 'asking' | 'done'>>({ okta: 'idle', netsuite: 'idle' })
  // Granting goes through a second approver (Dev), as in Wikimind 4; it lands about two seconds later.
  const grant = (g: Gap) => {
    if (access[g] !== 'idle') return
    setAccess((a) => ({ ...a, [g]: 'asking' }))
    later(2000, () => { setAccess((a) => ({ ...a, [g]: 'done' })); act({ ag: GAPS[g].ag, t: `Got ${GAPS[g].t} (${GAPS[g].scope}) after Dev approved: ${GAPS[g].pts} more points Asoka can run`, page: 'discount-approvals', kind: 'verify' }) })
  }
  const setChatOn = (b: boolean) => { setChatOnS(b); if (b) { setTrace(null); setAgent(null); setMisses(null); setRail(true) } }
  const startChat = (text: string, from: DOMRect | null = null) => {
    setChatFrom(from); setChat((c) => [...c, { id: cid.current++, who: 'you', text }]); setChatOn(true)
  }
  const [proof] = useState(() => typeof location === 'undefined' || new URLSearchParams(location.search).get('proof') !== 'off')
  const openTrace = (id: string | null) => { if (!proof) return; setTrace(id); if (id) { setMisses(null); setRail(true) } }
  const openMisses = (m: AgentId | 'all' | null) => { setTrace(null); setAgent(null); setMisses(m); if (m) setRail(true) }
  // A job's profile shows in the right panel, like a trace; a trace opened from it shows on top.
  const openAgent = (a: AgentId | null) => { setTrace(null); setMisses(null); setAgent(a); if (a) setRail(true) }
  const nid = useRef(1), timers = useRef<number[]>([])

  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t) }, [])

  const act = (a: Omit<Act, 'id' | 'at'>) => setActs((l) => [{ ...a, id: nid.current++, at: Date.now() }, ...l].slice(0, 14))
  /** Announce, then apply: presence for 1.4 s, then the data changes and the block types it in. */
  const edit = (ag: AgentId, block: string, label: string, page: string, apply: () => void, w: Omit<Why, 'ag' | 'at'>, t: string) => {
    setPresence({ ag, block, label, page })
    later(1400, () => {
      apply(); setWhy((m) => ({ ...m, [block]: { ...w, ag, at: Date.now() } })); act({ ag, t, page, block, kind: 'edit' })
      add(block, { k: 'observed', by: ag, t: w.t, src: w.src, at: 'just now' }, { k: 'edited', by: ag, t: 'Rewrote it', before: w.before, at: 'just now' })
      later(2600, () => setPresence((p) => (p?.block === block ? null : p)))
    })
  }
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)) }

  const change = useCallback(() => {
    if (fin === 25) return
    act({ ag: 'approvals', t: 'Saw Priya Shah change Large Deal Approval in Salesforce', page: 'discount-approvals', block: 'who-fin', kind: 'read' })
    edit('approvals', 'who-fin', 'Who approves', 'discount-approvals', () => { setFin(25); setVerify('checking') },
      { t: 'Priya Shah changed Large Deal Approval: Finance now joins over 25%, not 20%.', src: 'Salesforce setup audit trail · Large Deal Approval', before: 'From 20% to 35%: the sales manager, then Finance.' }, 'Rewrote Who approves and the flow: Finance joins over 25%')
    later(1400, () => setWhy((m) => ({ ...m, 'who-mgr': { ag: 'approvals', at: Date.now(), t: 'Priya Shah changed Large Deal Approval: the sales manager now approves alone up to 25%.', src: 'Salesforce setup audit trail · Large Deal Approval', before: 'Up to 20% off: the sales manager approves alone.' } })))
    later(1400, () => setWhy((m) => ({ ...m, flow: { ag: 'approvals', at: Date.now(), t: 'Priya Shah changed Large Deal Approval: Finance now joins over 25%, not 20%. Redrew the routes.', src: 'Salesforce setup audit trail · Large Deal Approval', before: 'Sales manager up to 20%; Finance from 20% to 35%.' } })))
    later(1500, () => { add('who-fin', { k: 'revoked', by: 'person', name: 'Dana Ruiz', t: 'Withdrew verification: the Salesforce config changed', at: 'just now' }); add('who-mgr', { k: 'observed', by: 'approvals', t: 'Sales manager limit moved from 20% to 25%', src: 'Setup audit trail · Large Deal Approval', at: 'just now' }); add('flow', { k: 'edited', by: 'approvals', t: 'Redrew the discount bands', before: 'Sales manager up to 20%; Finance from 20% to 35%', at: 'just now' }) })
    later(9000, () => { add('who-fin', { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Re-checked and verified the change', at: 'just now' }); setVerify('ok'); act({ ag: 'person', who: 'Dana Ruiz', t: 'Verified the change to Who approves', page: 'discount-approvals', block: 'who-fin', kind: 'verify' }) })
  }, [fin])
  const answer = useCallback(() => {
    if (renewal === 'answered') return
    act({ ag: 'person', who: 'Maria Okafor', t: 'Answered in Slack: flat renewals skip approval on purpose', page: 'discount-approvals', block: 'renew', kind: 'ask' })
    add('renew', { k: 'verified', by: 'person', name: 'Maria Okafor', t: 'Answered in Slack', quote: '“Yes, on purpose. Policy since 2023: a flat renewal doesn’t change revenue risk.”', at: 'just now' })
    edit('approvals', 'renew', 'In practice', 'discount-approvals', () => setRenewal('answered'),
      { t: 'Maria Okafor answered in Slack: policy since 2023.', src: 'Slack DM with Maria Okafor · just now', before: 'Open question: do flat renewals skip approval on purpose?' }, 'Wrote Maria’s answer into Flat renewals')
  }, [renewal])

  // The script. Restarted by Replay.
  useEffect(() => {
    if (RM) return
    later(6000, () => {
      act({ ag: 'approvals', t: 'Read a #deal-desk thread: Orion platform approved in Slack first', page: 'discount-approvals', block: 'qe', kind: 'read' })
      edit('approvals', 'qe', 'Quarter-end approvals in Slack', 'discount-approvals', () => setQe([10, 13]),
        { t: 'Orion platform was approved in #deal-desk before Salesforce.', src: '#deal-desk · Sam Ortiz · just now', before: '9 of the last 12 quarter ends.' }, 'Updated Quarter-end approvals: 10 of the last 13')
    })
    later(16000, () => change())
    later(34000, () => answer())
    later(44000, () => edit('integrations', 'cfg-cpq', 'Configured in Salesforce', 'discount-approvals', () => setCpq('fixed'),
      { t: 'Ben Ito fixed the CPQ currency mapping; the next 40 quotes synced.', src: 'CPQ sync log · 40 of 40 quotes', before: 'Failing for multi-currency deals since Oct 29.' }, 'Marked CPQ quote sync as fixed'))
    return () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }
  }, [run]) // eslint-disable-line react-hooks/exhaustive-deps

  const replay = () => {
    timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []
    setFin(20); setVerify('ok'); setExtra({}); setTrace(null); setQe([9, 12]); setRenewal('asking'); setCpq('failing'); setWhy({}); setPresence(null); setActs(SEED(Date.now()))
    setPage('discount-approvals'); window.scrollTo({ top: 0 }); setRun((r) => r + 1)
  }
  const go = (p: string) => { setPage(p); setNav(false); if (p !== 'discount-approvals') setArrive(false); window.scrollTo({ top: 0 }) }
  // A business user lands from the Approvals job's push-back in Slack: the page opens on the cited rule.
  const arriveSlack = () => { setTour(null); setRail(false); setTrace(null); setAskedOwner(false); setArrive(true); setPage('discount-approvals'); setNav(false); window.scrollTo({ top: 0 }) }
  const leaveArrival = () => setArrive(false)
  const askOwner = () => {
    if (askedOwner) return
    setAskedOwner(true)
    act({ ag: 'approvals', t: 'Asked Maria Okafor whether Orion platform can skip the CRO, for Sam Ortiz', page: 'discount-approvals', block: 'who-cro', kind: 'ask' })
  }
  const jump = (block: string) => {
    const doIt = () => document.getElementById('b-' + block)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
    if (page !== 'discount-approvals') { setPage('discount-approvals'); window.setTimeout(doIt, 80) } else doIt()
  }

  // Presenter keys.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea')) return
      if (e.key === 'c' || e.key === 'C') change()
      else if (e.key === 'l' || e.key === 'L') answer()
      else if (e.key === 'r' || e.key === 'R') replay()
      else if (e.key === 't' || e.key === 'T') setTour(0)
      else if (e.key === 's' || e.key === 'S') arriveSlack()
      else if (e.key === 'Escape') { if (trace) setTrace(null); else if (agent) setAgent(null); else if (misses) setMisses(null); else if (feed) setFeed(null); else if (chatOn) setChatOnS(false); else { setRail(false); setNav(false) } }
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })

  return <Ctx.Provider value={{ page, go, fin, verify, qe, renewal, cpq, why, presence, acts, now, playing, setPlaying, rail, setRail, nav, setNav, replay, jump, log: act, trace, openTrace, extra, agent, openAgent, tour, setTour, change, arrive, arriveSlack, leaveArrival, askedOwner, askOwner, misses, openMisses, search, setSearch, proof, chat, setChat, chatOn, setChatOn, startChat, chatFrom, v9, access, grant, feed, openFeed }}>{children}</Ctx.Provider>
}
