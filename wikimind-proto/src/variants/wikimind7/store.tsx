import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AgentId } from './data'
import type { TStep } from './traces'

export type Act = { id: number; ag: AgentId | 'person'; who?: string; t: string; page: string; block?: string; at: number; kind: 'edit' | 'read' | 'verify' | 'ask' }
/** Why a block changed: shown in the block's margin chip and its popover. */
export type Why = { ag: AgentId; t: string; src: string; before: string; at: number }
export type Presence = { ag: AgentId; block: string; label: string; page: string } | null

type W = {
  page: string; go: (p: string) => void
  fin: 20 | 25; verify: 'ok' | 'checking'; qe: [number, number]; renewal: 'asking' | 'answered'; cpq: 'failing' | 'fixed'
  why: Record<string, Why>; presence: Presence; acts: Act[]; now: number
  playing: boolean; setPlaying: (b: boolean) => void
  rail: boolean; setRail: (b: boolean) => void; nav: boolean; setNav: (b: boolean) => void
  replay: () => void; jump: (block: string) => void; log: (a: Omit<Act, 'id' | 'at'>) => void
  trace: string | null; openTrace: (id: string | null) => void; extra: Record<string, TStep[]>
}
const Ctx = createContext<W | null>(null)
export const useW = () => useContext(Ctx)!
export const RM = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const SEED = (t0: number): Act[] => [
  { id: -1, ag: 'integrations', t: 'Asked Ben Ito why multi-currency quotes fail to sync', page: 'cpq-sync', at: t0 - 95e3, kind: 'ask' },
  { id: -2, ag: 'access', t: 'Updated Deal Desk: Priya Shah now leads it', page: 'license-seats', at: t0 - 240e3, kind: 'edit' },
  { id: -3, ag: 'support', t: 'Linked 3 cases to the data-loss escalation rule', page: 'case-escalation', at: t0 - 410e3, kind: 'edit' },
  { id: -4, ag: 'approvals', t: 'Re-read Discount approvals against Salesforce', page: 'discount-approvals', at: t0 - 4e3, kind: 'read' },
]

/**
 * The live engine. A short script plays while you read: an agent reads Slack and updates a count; Salesforce changes and
 * the agent rewrites a rule (verification is withdrawn, then restored); a person answers an open question; a sync is fixed.
 * Each edit is announced first (presence: "Approvals agent is editing Who approves"), then typed into the block.
 * Keys: C change, L answer, R replay.
 */
export function Provider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState('discount-approvals')
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
  const openTrace = (id: string | null) => { setTrace(id); if (id) setRail(true) }
  const nid = useRef(1), timers = useRef<number[]>([])

  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t) }, [])

  const act = (a: Omit<Act, 'id' | 'at'>) => setActs((l) => [{ ...a, id: nid.current++, at: Date.now() }, ...l].slice(0, 14))
  /** Announce, then apply: presence for 1.4 s, then the data changes and the block types it in. */
  const edit = (ag: AgentId, block: string, label: string, page: string, apply: () => void, w: Omit<Why, 'ag' | 'at'>, t: string) => {
    setPresence({ ag, block, label, page })
    later(1400, () => {
      apply(); setWhy((m) => ({ ...m, [block]: { ...w, ag, at: Date.now() } })); act({ ag, t, page, block, kind: 'edit' })
      add(block, { k: 'observed', by: ag, t: w.t, src: w.src, at: 'just now' }, { k: 'edited', by: ag, t: 'Rewrote this block', before: w.before, at: 'just now' })
      later(2600, () => setPresence((p) => (p?.block === block ? null : p)))
    })
  }
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)) }

  const change = useCallback(() => {
    if (fin === 25) return
    act({ ag: 'approvals', t: 'Saw Priya Shah change Large Deal Approval in Salesforce', page: 'discount-approvals', kind: 'read' })
    edit('approvals', 'who-fin', 'Who approves', 'discount-approvals', () => { setFin(25); setVerify('checking') },
      { t: 'Priya Shah changed the Large Deal Approval process in Salesforce: Finance now joins over 25%, not 20%.', src: 'Salesforce setup audit trail · Large Deal Approval', before: 'From 20% to 35%: the sales manager, then Finance.' }, 'Rewrote Who approves and the flow: Finance joins over 25%')
    later(1400, () => setWhy((m) => ({ ...m, 'who-mgr': { ag: 'approvals', at: Date.now(), t: 'Priya Shah changed the Large Deal Approval process in Salesforce: the sales manager now approves alone up to 25%.', src: 'Salesforce setup audit trail · Large Deal Approval', before: 'Up to 20% off: the sales manager approves on their own.' } })))
    later(1400, () => setWhy((m) => ({ ...m, flow: { ag: 'approvals', at: Date.now(), t: 'Priya Shah changed the Large Deal Approval process in Salesforce: Finance now joins over 25%, not 20%. The agent redrew the routes.', src: 'Salesforce setup audit trail · Large Deal Approval', before: 'Sales manager up to 20%; Finance from 20% to 35%.' } })))
    later(1500, () => { add('who-fin', { k: 'revoked', by: 'person', name: 'Dana Ruiz', t: 'Verification withdrawn automatically: the Salesforce config changed under it', at: 'just now' }); add('who-mgr', { k: 'observed', by: 'approvals', t: 'Sales manager limit moved from 20% to 25%', src: 'Setup audit trail · Large Deal Approval', at: 'just now' }); add('flow', { k: 'edited', by: 'approvals', t: 'Redrew the discount bands', before: 'Sales manager up to 20%; Finance from 20% to 35%', at: 'just now' }) })
    later(9000, () => { add('who-fin', { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Re-checked the change and verified it again', at: 'just now' }); setVerify('ok'); act({ ag: 'person', who: 'Dana Ruiz', t: 'Verified the change to Who approves', page: 'discount-approvals', block: 'who-fin', kind: 'verify' }) })
  }, [fin])
  const answer = useCallback(() => {
    if (renewal === 'answered') return
    act({ ag: 'person', who: 'Maria Okafor', t: 'Answered in Slack: flat renewals skip approval on purpose', page: 'discount-approvals', kind: 'ask' })
    add('renew', { k: 'verified', by: 'person', name: 'Maria Okafor', t: 'Answered the agent’s question', quote: '“Yes, on purpose. Policy since 2023: a flat renewal doesn’t change revenue risk.”', at: 'just now' })
    edit('approvals', 'renew', 'In practice', 'discount-approvals', () => setRenewal('answered'),
      { t: 'Maria Okafor (RevOps) answered the agent’s question in Slack: it has been policy since 2023.', src: 'Slack DM with Maria Okafor · just now', before: 'Open question: do flat renewals skip approval on purpose?' }, 'Wrote Maria’s answer into Flat renewals')
  }, [renewal])

  // The script. Restarted by Replay.
  useEffect(() => {
    if (RM) return
    later(6000, () => {
      act({ ag: 'approvals', t: 'Read a #deal-desk thread: Orion platform approved in Slack first', page: 'discount-approvals', kind: 'read' })
      edit('approvals', 'qe', 'Quarter-end approvals in Slack', 'discount-approvals', () => setQe([10, 13]),
        { t: 'A new #deal-desk thread approved Orion platform in Slack before it was logged in Salesforce.', src: '#deal-desk · Sam Ortiz · just now', before: '9 of the last 12 quarter ends.' }, 'Updated Quarter-end approvals: 10 of the last 13')
    })
    later(16000, () => change())
    later(34000, () => answer())
    later(44000, () => edit('integrations', 'cfg-cpq', 'Configured in Salesforce', 'discount-approvals', () => setCpq('fixed'),
      { t: 'Ben Ito fixed the currency mapping in CPQ; the agent watched the next 40 quotes sync.', src: 'CPQ sync log · 40 of 40 quotes', before: 'Failing for multi-currency deals since Oct 29.' }, 'Marked CPQ quote sync as fixed'))
    return () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }
  }, [run]) // eslint-disable-line react-hooks/exhaustive-deps

  const replay = () => {
    timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []
    setFin(20); setVerify('ok'); setExtra({}); setTrace(null); setQe([9, 12]); setRenewal('asking'); setCpq('failing'); setWhy({}); setPresence(null); setActs(SEED(Date.now()))
    setPage('discount-approvals'); window.scrollTo({ top: 0 }); setRun((r) => r + 1)
  }
  const go = (p: string) => { setPage(p); setNav(false); window.scrollTo({ top: 0 }) }
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
      else if (e.key === 'Escape') { if (trace) setTrace(null); else { setRail(false); setNav(false) } }
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })

  return <Ctx.Provider value={{ page, go, fin, verify, qe, renewal, cpq, why, presence, acts, now, playing, setPlaying, rail, setRail, nav, setNav, replay, jump, log: act, trace, openTrace, extra }}>{children}</Ctx.Provider>
}
