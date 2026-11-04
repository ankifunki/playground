import type { IconName } from './Icon'

/* One Asoka, six jobs. Each job has its own space (a grove), the way a team keeps a Confluence space. Demo data. */
export type AgentId = 'approvals' | 'access' | 'security' | 'finance' | 'integrations' | 'support'
export type Agent = { id: AgentId; name: string; job: string; icon: IconName }
export const AGENTS: Agent[] = [
  { id: 'approvals', name: 'Approvals', job: 'Deal approvals, discounts, renewals', icon: 'stamp' },
  { id: 'access', name: 'Access', job: 'Accounts, passwords, license seats', icon: 'key' },
  { id: 'security', name: 'Security', job: 'Sign-in alerts, access reviews', icon: 'shield-check' },
  { id: 'finance', name: 'Finance ops', job: 'Invoices, NetSuite records', icon: 'receipt' },
  { id: 'integrations', name: 'Integrations', job: 'Salesforce, CPQ and NetSuite syncs', icon: 'plug' },
  { id: 'support', name: 'Support', job: 'Case triage and escalation', icon: 'life-buoy' },
]
export const AG = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<AgentId, Agent>

export type PageMeta = { id: string; title: string; ag: AgentId; n: number; lede: string; re: number }
/** The page tree: one space per job. n = pages under it in the full corpus; re = seconds since it was last re-read. */
export const SPACES: { ag: AgentId; pages: PageMeta[]; total: number }[] = [
  { ag: 'approvals', total: 386, pages: [
    { id: 'discount-approvals', title: 'Discount approvals', ag: 'approvals', n: 0, re: 4, lede: '' },
    { id: 'discount-policy', title: 'Discount policy', ag: 'approvals', n: 0, re: 3600, lede: 'What reps can discount alone, and what needs approval. All 3 statements verified by Dana Ruiz.' },
    { id: 'quarter-end', title: 'Quarter-end close', ag: 'approvals', n: 0, re: 420, lede: 'Rules for a quarter’s last 3 business days, including approvals Deal Desk gives in Slack first.' },
    { id: 'renewals', title: 'Renewals', ag: 'approvals', n: 0, re: 1800, lede: 'How renewals are priced and approved. Flat renewals skip approval; price increases follow Discount approvals.' },
  ] },
  { ag: 'access', total: 153, pages: [
    { id: 'provisioning', title: 'User provisioning', ag: 'access', n: 0, re: 900, lede: 'How new hires get Salesforce users, profiles and permission sets, from the Workday start date.' },
    { id: 'license-seats', title: 'License seats', ag: 'access', n: 0, re: 240, lede: 'Who gets a Sales Cloud seat, and how unused seats are reclaimed after 30 days without a sign-in.' },
  ] },
  { ag: 'security', total: 142, pages: [
    { id: 'login-policies', title: 'Login policies', ag: 'security', n: 0, re: 1200, lede: 'Session, MFA and IP rules for Salesforce logins. Every profile has required MFA since March.' },
    { id: 'access-reviews', title: 'Access reviews', ag: 'security', n: 0, re: 5400, lede: 'Quarterly review of admin and API users. The last review removed 14 stale API users.' },
  ] },
  { ag: 'finance', total: 174, pages: [
    { id: 'invoices', title: 'Invoices', ag: 'finance', n: 0, re: 2700, lede: 'How closed-won deals become NetSuite invoices, and who fixes a mismatch.' },
  ] },
  { ag: 'integrations', total: 193, pages: [
    { id: 'cpq-sync', title: 'CPQ quote sync', ag: 'integrations', n: 0, re: 60, lede: 'Sends approved discounts from Salesforce to CPQ quotes. Failing for multi-currency deals since Oct 29; Asoka asked Ben Ito why.' },
  ] },
  { ag: 'support', total: 236, pages: [
    { id: 'case-escalation', title: 'Case escalation', ag: 'support', n: 0, re: 300, lede: 'When support cases go to engineering. Cases that mention data loss are escalated by hand, whatever their priority (11 of 11 cases).' },
  ] },
]
export const PAGES: Record<string, PageMeta> = Object.fromEntries(SPACES.flatMap((s) => s.pages).map((p) => [p.id, p]))

/** Deals that flow through the approval diagram. Names are fictional. */
export const DEALS: { name: string; amt: number; disc: number }[] = [
  { name: 'Helios expansion', amt: 240000, disc: 28 },
  { name: 'Atlas renewal', amt: 180000, disc: 12 },
  { name: 'Kestrel new logo', amt: 64000, disc: 18 },
  { name: 'Orion platform', amt: 620000, disc: 38 },
  { name: 'Juniper add-on', amt: 130000, disc: 22 },
  { name: 'Vega upgrade', amt: 410000, disc: 8 },
  { name: 'Lumen pilot', amt: 48000, disc: 30 },
  { name: 'Cobalt multi-year', amt: 890000, disc: 24 },
]

export const money = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}m` : `$${Math.round(n / 1000)}k`)
export const ago = (s: number) => (s < 60 ? `${Math.max(1, Math.round(s))}s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`)
