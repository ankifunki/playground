import type React from 'react'
import { Icon, type IconName } from './Icon'

/**
 * Asoka is not one agent. It is a team of specialist agents, each with one job.
 * Every fact, change, question and answer belongs to the agent that did the work.
 * Numbers are demo data.
 */
export type AgentId = 'approvals' | 'access' | 'security' | 'finance' | 'integrations' | 'support'
export type Agent = { id: AgentId; name: string; job: string; icon: IconName; rel: number; auto: number }
export const AGENTS: Agent[] = [
  { id: 'approvals', name: 'Approvals', job: 'Deal approvals, discounts, renewals', icon: 'stamp', rel: 99.0, auto: 52 },
  { id: 'access', name: 'Access', job: 'Accounts, passwords, license seats', icon: 'key', rel: 98.1, auto: 78 },
  { id: 'security', name: 'Security', job: 'Sign-in alerts, access reviews', icon: 'shield-check', rel: 97.4, auto: 41 },
  { id: 'finance', name: 'Finance ops', job: 'Invoices, NetSuite records', icon: 'receipt', rel: 99.3, auto: 58 },
  { id: 'integrations', name: 'Integrations', job: 'Salesforce, CPQ and NetSuite syncs', icon: 'plug', rel: 98.4, auto: 70 },
  { id: 'support', name: 'Support', job: 'Case triage and escalation', icon: 'life-buoy', rel: 98.9, auto: 74 },
]
export const AG = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<AgentId, Agent>
/** Which agent learned each source. */
export const REF_AGENT: Record<number, AgentId> = { 1: 'approvals', 2: 'approvals', 3: 'approvals', 4: 'approvals', 5: 'approvals', 6: 'approvals', 7: 'approvals', 8: 'finance', 9: 'approvals', 10: 'approvals', 11: 'approvals', 12: 'approvals', 13: 'approvals', 14: 'approvals', 15: 'approvals', 16: 'finance', 17: 'approvals', 18: 'integrations' }
/** Which agent asks a person, by the team that person is in. */
export const TEAM_AGENT: Record<string, AgentId> = { RevOps: 'approvals', Integrations: 'integrations', Security: 'security', People: 'access', Facilities: 'support' }
export const agentFor = (ns: number[]) => AG[REF_AGENT[ns[0]] || 'approvals']
export const agentsFor = (ns: number[]) => Array.from(new Set(ns.map((n) => REF_AGENT[n] || 'approvals'))).map((id) => AG[id])

/** An agent's mark: a square indigo tile (sources are round and neutral), optionally with its name. */
export function Ag({ id, name, size = 24, suffix }: { id: AgentId; name?: boolean; size?: number; suffix?: string }) {
  const a = AG[id]
  return (
    <span className={'ag' + (name ? ' named' : '')} title={a.name + ' agent'}>
      <span className="agt" style={{ width: size, height: size } as React.CSSProperties} aria-hidden="true"><Icon name={a.icon} size={Math.round(size * 0.58)} /></span>
      {name && <span className="agn">{a.name}{suffix ?? ' agent'}</span>}
    </span>
  )
}

/** The whole team as an overlapping row of tiles. */
export function AgentPile({ ids = AGENTS.map((a) => a.id), size = 22 }: { ids?: AgentId[]; size?: number }) {
  return (
    <span className="agpile" role="img" aria-label={ids.map((i) => AG[i].name).join(', ') + ' agents'}>
      {ids.map((i, k) => <span key={i} className="agt" style={{ width: size, height: size, '--i': k } as React.CSSProperties}><Icon name={AG[i].icon} size={Math.round(size * 0.58)} /></span>)}
    </span>
  )
}
