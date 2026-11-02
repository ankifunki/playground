import type { AgentId } from './agents'

/* =========================================================================================
   Wikimind 5. Everything here is demo data for one company (Northwind) and one fully written
   page (Discount approvals). Asoka is a team of agents; each fact is credited to the one that
   learned it (see agents.tsx).
   ========================================================================================= */

export type RefKind = 'doc' | 'sf' | 'jira' | 'slack' | 'meet' | 'watch' | 'talk'
export type Ref = { k: RefKind; src: string; d: string; q: string; u: string; v: string | null; check?: string }

export const KIND: Record<RefKind, string> = { doc: 'Policy document', sf: 'Salesforce change', jira: 'Jira ticket', slack: 'Slack', meet: 'Meeting recording', watch: 'Watched in practice', talk: 'Interview' }

/** Every sentence on the page is tied to the observations behind it. */
export const REFS: Record<number, Ref> = {
  1: { k: 'doc', src: 'Sales policy v4, section 3', d: 'Jan 2026', q: 'Opportunities above $100,000 need approval before negotiation.', u: 'Defines the process and the threshold.', v: 'Dana Ruiz, Oct 12' },
  2: { k: 'sf', src: 'Approval process Large Deal Approval', d: 'Mar 4, 2024', q: 'Entry criteria: Amount greater than 100,000.', u: 'Confirms the threshold is enforced in Salesforce, not just written down.', v: 'Dana Ruiz, Oct 12' },
  3: { k: 'jira', src: 'Jira SF-2231', d: 'Oct 28', q: 'Lower the CRO threshold from 40% to 35%. Done.', u: 'Matches the Salesforce change the same day.', v: 'Dana Ruiz, Oct 29' },
  4: { k: 'slack', src: '#emea-sales, L. Moreau', d: 'Aug 20', q: 'Remember, EMEA goes to Sofia first.', u: 'The only source, and nothing in Salesforce matches it.', v: null, check: 'Seen once' },
  5: { k: 'watch', src: '212 approvals watched this quarter', d: 'Ongoing', q: 'Median time to approve: 3 hours 40 minutes.', u: 'Measured from real approvals.', v: null },
  6: { k: 'sf', src: 'Approval process settings', d: 'Mar 4, 2024', q: 'Pending requests are recalled automatically after 14 days.', u: 'The rule as Salesforce enforces it.', v: 'Dana Ruiz, Oct 12' },
  7: { k: 'slack', src: '#revops', d: 'Feb 2024', q: 'Two deals closed on six-week-old prices. About $90k in margin lost.', u: 'Why requests expire.', v: null },
  8: { k: 'sf', src: 'Validation rule Amount_Locked_After_Approval', d: 'Jun 2025', q: 'Blocks Amount edits on approved records unless the user is in Deal Desk.', u: 'The rule as Salesforce enforces it.', v: 'Dana Ruiz, Oct 12' },
  9: { k: 'slack', src: '#deal-desk, 9 threads', d: 'Last 3 quarter ends', q: 'Approved in the thread, logged in Salesforce afterward.', u: 'Seen in 9 of the last 12 quarter-end deals.', v: null, check: 'Unofficial' },
  10: { k: 'meet', src: 'RevOps weekly', d: 'Sep 30', q: 'Maria Okafor: “At quarter end we just do it in Slack.”', u: 'A process owner confirming the pattern.', v: null },
  11: { k: 'meet', src: 'RevOps weekly', d: 'Oct 27', q: 'Someone mentioned renewals don’t need approval.', u: '14 flat renewals skipped approval last quarter, with no rule behind it.', v: null, check: 'Asking' },
  12: { k: 'slack', src: '#deal-desk, J. Patel', d: 'Oct 3', q: 'Anything over 35 goes straight to Marcus now.', u: 'An early signal of the threshold change.', v: null },
  13: { k: 'sf', src: 'Approval step Finance review', d: 'Sep 12', q: 'Entry criteria: Discount greater than 20%.', u: 'Added Finance as a second approver.', v: 'Dana Ruiz, Oct 12' },
  16: { k: 'sf', src: 'Validation rule Discount_Requires_Reason', d: 'Jul 2025', q: 'Discount over 10% requires Discount_Reason__c.', u: 'Finance asked for an audit trail on discounts.', v: 'Dana Ruiz, Oct 12' },
  17: { k: 'sf', src: 'Flow Notify_Deal_Desk', d: 'Feb 2026', q: 'On approval, posts deals over $500,000 to #deal-desk.', u: 'Deal Desk wanted to see big deals the moment they clear.', v: null },
  18: { k: 'sf', src: 'Integration CPQ quote sync', d: 'Oct 29', q: '412 sync errors: currency mismatch on multi-currency quotes.', u: 'Failing since a CPQ update.', v: null, check: 'Failing' },
}
/** Source 14 only exists once Maria has answered. */
export const REF_MARIA: Ref = { k: 'talk', src: 'Maria Okafor, replying to the Approvals agent', d: 'Just now', q: 'Yes, on purpose since 2023. Flat renewals don’t change revenue risk.', u: 'A process owner answered the agent; the page cites her answer.', v: null }
/**
 * Source 15 only exists once the live Salesforce change has been observed. Its verification is
 * filled in when Dana re-checks it (the brief: verification can be revoked when new observations contradict it).
 */
export const REF_CFG: Ref = { k: 'sf', src: 'Salesforce setup audit trail, Priya Shah', d: 'Just now', q: 'Changed Finance review entry criteria: Discount greater than 25% (was 20%).', u: 'A live configuration change. It contradicted a verified sentence, so the verification was withdrawn until Dana re-checked.', v: null }
export const refFor = (n: number) => (n === 14 ? REF_MARIA : n === 15 ? REF_CFG : REFS[n])

/** Where on the page each source is used, so an answer can be written next to the sentences it rests on. */
export const REF_SEC: Record<number, string> = { 1: 'lead', 2: 'lead', 4: 'lead', 5: 'lead', 3: 'rules', 12: 'rules', 13: 'rules', 15: 'rules', 6: 'rules', 7: 'rules', 8: 'rules', 16: 'rules', 9: 'practice', 10: 'practice', 11: 'practice', 14: 'practice', 17: 'config', 18: 'config' }

/** What changed, attached to the source that caused it: the change shows on the sentence. */
export type Change = { d: string; was: string; why: string }
export const CHANGES: Record<number, Change> = {
  3: { d: 'Oct 28', was: 'Over 40%, the CRO approves directly.', why: 'Jira SF-2231, matched with a #deal-desk message' },
  14: { d: 'Just now', was: 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.', why: 'Maria Okafor answered the Approvals agent' },
  15: { d: 'Just now', was: 'Discounts over 20% add Finance as a second approver.', why: 'Priya Shah changed Finance review in Salesforce setup' },
}

/** How a sentence reads in the margin when it needs attention. Solid sentences carry no mark. */
export type Mark = { t: string; tone: 'warn' | 'ok' | 'info' }

/** The evidence tier of a set of sources, for the evidence lens. */
export type Tier = 'ok' | 'obs' | 'warn' | 'pend'
export function tierOf(ns: number[], pending: boolean): Tier {
  if (pending && ns.includes(15)) return 'pend'
  const rs = ns.map(refFor)
  if (rs.some((r) => r.check)) return 'warn'
  return rs.every((r) => r.v) ? 'ok' : 'obs'
}

/**
 * A business user arriving from Slack: the Approvals agent pushed back on their request and cited this page
 * (the brief's example). They can see the rule, or try their own deal in the simulator.
 */
export const ARRIVAL = {
  channel: '#deal-desk', who: 'Jamie Chen',
  q: 'Can you approve 40% off on Helios? Marcus is out today.',
  a: 'Not without the CRO. Over 35%, the CRO approves directly. I put it in Marcus’s queue for tomorrow morning.',
  ns: [3, 12], deal: { amt: 240000, disc: 40 },
}

/* ---------- Receipts: the agents' actions that cited this page ---------- */
export type Receipt = { id: string; when: string; ag: AgentId; ch: string; did: string; why: string; ns: number[]; out?: string }
export const RECEIPTS0: Receipt[] = [
  { id: 'r1', when: 'Today, 10:42', ag: 'approvals', ch: '#deal-desk', did: 'Declined Jamie Chen’s request to approve 40% off on Helios without the CRO.', why: 'Over 35%, the CRO approves directly.', ns: [3, 12], out: 'Jamie sent it to Marcus.' },
  { id: 'r2', when: 'Today, 9:15', ag: 'approvals', ch: 'Salesforce', did: 'Routed Helios expansion (28% off) to Finance after the sales manager approved.', why: 'Discounts over 20% add Finance as a second approver.', ns: [13] },
  { id: 'r3', when: 'Yesterday', ag: 'finance', ch: '#revops', did: 'Refused to change the amount on the approved Orbit renewal for Pat Kim.', why: 'Once a deal is approved, only Deal Desk can change its amount.', ns: [8], out: 'Pat asked Deal Desk.' },
  { id: 'r4', when: 'Oct 30', ag: 'approvals', ch: 'Email', did: 'Reminded Lee Park that the Vega request expires in 2 days.', why: 'An approval request expires after 14 days.', ns: [6] },
]
export const RECEIPT_LIVE: Receipt = { id: 'r0', when: 'Just now', ag: 'approvals', ch: '#sales', did: 'Told Lee Park the $90k Juno deal needs no approval.', why: 'Any deal over $100,000 needs approval.', ns: [2] }

/* ---------- The live wire on Home: what each agent is doing right now ---------- */
export type Wire = { id: number; ag: AgentId; t: string; page: string; ns?: number[] }
export const WIRE_POOL: Omit<Wire, 'id'>[] = [
  { ag: 'approvals', t: 'Read a #deal-desk thread about a 38% discount', page: 'Discount approvals' },
  { ag: 'support', t: 'Saw a new validation rule on Case: Priority_Requires_SLA', page: 'Case escalation' },
  { ag: 'approvals', t: 'Watched a deal close after CRO approval', page: 'Discount approvals', ns: [3] },
  { ag: 'integrations', t: 'CPQ sync retried 3 times for quote Q-1192', page: 'CPQ quote sync' },
  { ag: 'approvals', t: 'Transcribed RevOps weekly (42 minutes)', page: 'Lead routing' },
  { ag: 'access', t: 'Matched a new hire in Workday to a Salesforce user', page: 'User provisioning' },
  { ag: 'finance', t: 'Noticed a new field on Account: Partner_Tier__c', page: 'Partner deals' },
  { ag: 'security', t: 'Read a login-policy change in Salesforce setup', page: 'Login policies' },
  { ag: 'approvals', t: 'Cited Discount approvals to answer Lee Park in #sales', page: 'Discount approvals', ns: [2] },
  { ag: 'support', t: 'Linked 3 cases to the data-loss escalation rule', page: 'Case escalation' },
]

/* ---------- Front-page stories ---------- */
export type Story = { ag: AgentId; t: string; s: string; ns?: number[]; page?: string; sec?: string; tag?: [string, 'ok' | 'warn' | 'info'] }
export const CHANGED: Story[] = [
  { ag: 'integrations', t: 'CPQ quote sync is failing for multi-currency deals', s: '412 errors since a CPQ update on Oct 29. Asked Ben Ito why.', ns: [18], page: 'CPQ quote sync', tag: ['Failing', 'warn'] },
  { ag: 'access', t: 'Priya Shah now leads Deal Desk', s: 'From the org chart and #announcements. 6 pages updated.', page: 'Deal Desk' },
  { ag: 'support', t: 'New rule: high-priority cases need an SLA', s: 'Validation rule Priority_Requires_SLA, added yesterday.', page: 'Case escalation' },
]
export const LEARNED: Story[] = [
  { ag: 'approvals', t: 'At quarter end, large deals are approved in Slack before Salesforce', s: '9 of the last 12 quarter ends. Not in any policy.', ns: [9, 10], sec: 'practice', tag: ['Unofficial', 'warn'] },
  { ag: 'approvals', t: 'Approval requests expire after 14 days because of two stale-price deals', s: 'The reason lived only in a 2024 #revops thread.', ns: [6, 7], sec: 'rules' },
  { ag: 'support', t: 'Cases that mention data loss are escalated by hand, whatever their priority', s: '11 of 11 cases. Confirmed by Kim in Support.', page: 'Case escalation', tag: ['Confirmed', 'ok'] },
]

export const PREV: Record<string, [string, string]> = {
  'Maria Okafor': ['Person', 'Owns the approval process, lead routing, and forecasting, in RevOps.'],
  'Dana Ruiz': ['Person', 'Northwind’s sysadmin. Checks what the agents write and verifies it.'],
  'CPQ quote sync': ['Integration', 'Sends approved discounts from Salesforce to quotes. Failing for multi-currency deals since Oct 29.'],
  'Discount policy': ['Page', 'What reps can discount on their own, and what needs approval. 3 statements, all verified.'],
  'Quarter-end close': ['Page', 'The rules for the last 3 business days of a quarter, including the Slack approvals.'],
  'Deal Desk': ['Page', 'The team that runs approvals and contract exceptions. Led by Priya Shah since Oct 12.'],
  Renewals: ['Page', 'How renewals are priced and approved.'],
  'Case escalation': ['Page', 'When support cases go to engineering. Includes the unwritten data-loss rule.'],
  'Lead routing': ['Page', 'How inbound leads are assigned by territory and segment.'],
  'User provisioning': ['Page', 'How new hires get Salesforce users, profiles and permission sets.'],
  'Partner deals': ['Page', 'How partner-sourced opportunities are tagged and paid.'],
  'Login policies': ['Page', 'Session, MFA and IP rules for Salesforce logins.'],
}

/* ---------- The corpus: every page the agents have written, by area ---------- */
export type Area = { name: string; n: number; words: string[]; kinds: string[] }
export const AREAS: Area[] = [
  { name: 'Sales Cloud', n: 412, words: ['Opportunity', 'Lead', 'Account', 'Contact', 'Forecast', 'Territory', 'Campaign', 'Pipeline'], kinds: ['approvals', 'routing', 'validation rules', 'fields', 'page layouts', 'flows', 'sharing', 'record types', 'reports'] },
  { name: 'Service Cloud', n: 236, words: ['Case', 'Entitlement', 'SLA', 'Queue', 'Knowledge', 'Omni-channel'], kinds: ['escalation', 'assignment', 'macros', 'fields', 'flows', 'milestones'] },
  { name: 'CPQ', n: 188, words: ['Quote', 'Price book', 'Product', 'Discount schedule', 'Bundle'], kinds: ['rules', 'templates', 'approvals', 'sync', 'fields'] },
  { name: 'Policies', n: 174, words: ['Discount', 'Security', 'Data retention', 'Travel', 'Contract', 'Access'], kinds: ['policy', 'exceptions', 'owners', 'history'] },
  { name: 'People and teams', n: 153, words: ['Deal Desk', 'RevOps', 'Support', 'Finance', 'Sales', 'IT'], kinds: ['team', 'owners', 'on-call', 'handbook'] },
  { name: 'Integrations', n: 121, words: ['NetSuite', 'Okta', 'Slack', 'Workday', 'CPQ', 'Zendesk'], kinds: ['sync', 'mappings', 'errors', 'credentials'] },
]
export const CORPUS_TOTAL = AREAS.reduce((s, a) => s + a.n, 0)

/** Deterministic pseudo-random, so the corpus looks the same on every load. */
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }
export type Cell = { title: string; tier: 'ok' | 'obs' | 'warn' | 'open'; main?: boolean }
export const CELLS: Cell[][] = AREAS.map((a, ai) => {
  const r = rng(7 + ai * 101)
  return Array.from({ length: a.n }, (_, i) => {
    if (ai === 0 && i === 0) return { title: 'Discount approvals', tier: 'ok', main: true }
    const x = r(), title = `${a.words[i % a.words.length]} ${a.kinds[Math.floor(i / a.words.length) % a.kinds.length]}`
    return { title, tier: x < 0.71 ? 'ok' : x < 0.93 ? 'obs' : x < 0.98 ? 'warn' : 'open' }
  })
})

/* ---------- Asking people: how the agents close their own gaps ---------- */
export type Ask = { ag: AgentId; q: string; who: string; s: string; sec?: string; page?: string }
export const ASKS: Ask[] = [
  { ag: 'approvals', q: 'Do flat renewals skip approval on purpose?', who: 'Maria Okafor', s: 'RevOps · asked Oct 27', sec: 'practice' },
  { ag: 'integrations', q: 'Why do multi-currency quotes fail to sync?', who: 'Ben Ito', s: 'Integrations · asked 2 days ago', page: 'CPQ quote sync' },
  { ag: 'approvals', q: 'Do EMEA deals really go to Sofia first?', who: 'Watching', s: 'Seen once · waiting for the next EMEA deal', sec: 'lead' },
]

/* ---------- Routing people to ask ---------- */
export const ROUTE: [RegExp, string, string][] = [
  [/park|office|desk|building|badge|wifi|lunch|travel|expense/, 'Leo Park', 'Facilities'],
  [/vacation|pto|leave|benefit|salary|pay|hiring|holiday|onboard/, 'Ana Silva', 'People'],
  [/password|security|vpn|laptop|access|sso|mfa|login/, 'Sol Reyes', 'Security'],
  [/quote|cpq|integration|sync|api/, 'Ben Ito', 'Integrations'],
  [/deal|discount|approv|renewal|forecast|lead|pipeline|sales|quota/, 'Maria Okafor', 'RevOps'],
]
export const DOCS: Record<string, string> = { Facilities: 'office handbook', People: 'people handbook', Security: 'IT security guide', Integrations: 'integrations runbook', RevOps: 'RevOps playbook' }

/** Statements the live model may answer from (only used when running inside a claude.ai artifact). */
export const corpus = (fin: number): [number, string][] => [
  [1, 'Discount approval is how Northwind reviews large deals before they move to Negotiation.'], [2, 'Any deal over $100,000 needs approval.'],
  [3, `Up to ${fin}% off, the sales manager approves. Over ${fin}%, Finance is added as a second approver. Over 35%, the CRO approves directly instead.`],
  [4, 'EMEA deals reportedly go to the regional director, Sofia, first. Seen once.'], [5, 'Most approvals finish in under four hours. Median 3 hours 40 minutes.'],
  [6, 'An approval request expires after 14 days, and the rep must resubmit.'], [7, 'Requests expire because two deals closed on six-week-old prices in 2024, losing about $90k in margin.'],
  [8, 'Once a deal is approved, only Deal Desk can change its amount.'], [9, 'At quarter end, Deal Desk approves large deals in Slack first and logs them in Salesforce afterward. Unofficial.'],
  [11, 'Renewals with no price change skip approval. Open question.'], [16, 'Discounts over 10% need a written reason.'],
]
