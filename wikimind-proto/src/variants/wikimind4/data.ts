export type RefKind = 'doc' | 'sf' | 'jira' | 'slack' | 'meet' | 'watch' | 'talk'
export type Ref = { k: RefKind; src: string; d: string; q: string; u: string; v: string | null; check?: string }

export const KIND: Record<RefKind, string> = { doc: 'Policy document', sf: 'Salesforce change', jira: 'Jira ticket', slack: 'Slack', meet: 'Meeting recording', watch: 'Watched in practice', talk: 'Interview' }

/** Every sentence on the page is tied to the observations behind it. */
export const REFS: Record<number, Ref> = {
  1: { k: 'doc', src: 'Sales policy v4, section 3', d: 'Jan 2026', q: 'Opportunities above $100,000 need approval before negotiation.', u: 'Defines the process and the threshold.', v: 'Dana Ruiz, Oct 12' },
  2: { k: 'sf', src: 'Salesforce setup history', d: 'Mar 4, 2024', q: 'Approval process “Large Deal Approval” activated on Opportunity.', u: 'Confirms the threshold is enforced in Salesforce, not just written down.', v: 'Dana Ruiz, Oct 12' },
  3: { k: 'jira', src: 'Jira SF-2231', d: 'Oct 28', q: 'Lower the CRO threshold from 40% to 35%. Done.', u: 'Updated the discount tiers. Matches the Salesforce change the same day.', v: null },
  4: { k: 'slack', src: '#emea-sales, L. Moreau', d: 'Aug 20', q: 'Remember, EMEA goes to Sofia first.', u: 'The only source for this step, and nothing in Salesforce matches it. Asoka is watching the next EMEA approval to confirm.', v: null, check: 'Seen once' },
  5: { k: 'watch', src: '212 approvals Asoka watched this quarter', d: 'Ongoing', q: 'Median time to approve: 3 hours 40 minutes.', u: 'Measured from real approvals, not claimed by anyone.', v: null },
  6: { k: 'sf', src: 'Approval process settings', d: 'Mar 4, 2024', q: 'Pending requests are recalled automatically after 14 days.', u: 'The rule as Salesforce enforces it.', v: 'Dana Ruiz, Oct 12' },
  7: { k: 'slack', src: '#revops, Feb 2024', d: 'Feb 2024', q: 'Two deals closed on six-week-old prices. About $90k in margin lost.', u: 'Explains why requests expire.', v: null },
  8: { k: 'sf', src: 'Validation rule Amount_Locked_After_Approval', d: 'Jun 2025', q: 'Blocks amount edits on approved records unless the user is in Deal Desk.', u: 'The rule as Salesforce enforces it.', v: 'Dana Ruiz, Oct 12' },
  9: { k: 'slack', src: '#deal-desk, 9 threads', d: 'Last 3 quarter ends', q: 'Approved in the thread, logged in Salesforce afterward.', u: 'Seen in 9 of the last 12 quarter-end deals. Different from the written policy.', v: null, check: 'Unofficial' },
  10: { k: 'meet', src: 'RevOps weekly', d: 'Sep 30', q: 'Maria Okafor: “At quarter end we just do it in Slack.”', u: 'A process owner confirming the pattern out loud.', v: null },
  11: { k: 'meet', src: 'RevOps weekly', d: 'Oct 27', q: 'Someone mentioned renewals don’t need approval.', u: '14 flat renewals skipped approval last quarter, with no rule behind it. Asoka asked Maria Okafor.', v: null, check: 'Asking' },
  12: { k: 'slack', src: '#deal-desk, J. Patel', d: 'Oct 3', q: 'Anything over 35 goes straight to Marcus now.', u: 'An early signal of the threshold change, before the ticket.', v: null },
  13: { k: 'sf', src: 'Salesforce setup history', d: 'Sep 12', q: 'Approval step “Finance review” added for discounts over 20%.', u: 'Added Finance as a second approver.', v: 'Dana Ruiz, Oct 12' },
}
/** Source 14 only exists once Maria has answered. */
export const REF_MARIA: Ref = { k: 'talk', src: 'Maria Okafor, replying to Asoka', d: 'Just now', q: 'Yes, on purpose since 2023. Flat renewals don’t change revenue risk.', u: 'A process owner answered Asoka’s question. The page was rewritten and cites this answer.', v: null }
export const refFor = (n: number) => (n === 14 ? REF_MARIA : REFS[n])

/** Where on the page each source is used, so an answer can be written next to the sentences it rests on. */
export const REF_SEC: Record<number, string> = { 1: 'lead', 2: 'lead', 3: 'how', 4: 'lead', 5: 'lead', 6: 'rules', 7: 'rules', 8: 'rules', 9: 'practice', 10: 'practice', 11: 'practice', 12: 'how', 13: 'how', 14: 'practice' }

/** What changed, attached to the source that caused it. This replaces a separate history: the change shows on the sentence. */
export type Change = { d: string; was: string; why: string }
export const CHANGES: Record<number, Change> = {
  3: { d: 'Oct 28', was: 'Over 40%, the CRO approves directly.', why: 'Jira SF-2231, matched with a #deal-desk message' },
  13: { d: 'Sep 12', was: 'Over 25%, the CRO approves.', why: 'A Salesforce setup change added Finance' },
  14: { d: 'Just now', was: 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.', why: 'Maria Okafor answered Asoka’s question' },
}

/** How a sentence reads in the margin when it needs attention. Solid sentences carry no mark. */
export type Mark = { t: string; tone: 'warn' | 'ok' | 'info' }

/** A visitor arriving from a Slack reply Asoka posted. */
export const ARRIVAL = { channel: '#deal-desk', who: 'You', q: 'Who approves a 30% discount on a $240k deal?', a: 'The sales manager, then Finance.', ns: [3, 13] }

export type RStep = { path: number; btn: number; lock: number; ap: number[]; c: [number, number]; cap: string }
export const RSTEPS: RStep[] = [
  { path: 1, btn: 0, lock: 0, ap: [0, 0, 0], c: [78, 46], cap: 'A rep is working the Helios expansion deal.' },
  { path: 2, btn: 0, lock: 0, ap: [0, 0, 0], c: [78, 46], cap: 'The rep moves it toward Negotiation.' },
  { path: 2, btn: 1, lock: 0, ap: [0, 0, 0], c: [50, 94], cap: 'Over $100,000, so Salesforce asks for approval.' },
  { path: 2, btn: 1, lock: 1, ap: [2, 0, 0], c: [50, 94], cap: 'The record locks. The sales manager is notified.' },
  { path: 2, btn: 0, lock: 1, ap: [1, 2, 0], c: [50, 94], cap: 'Approved by the manager. 28% off, so Finance is next.' },
  { path: 2, btn: 0, lock: 1, ap: [1, 1, 0], c: [50, 94], cap: 'Finance approves 2 hours later.' },
  { path: 3, btn: 0, lock: 0, ap: [1, 1, 0], c: [78, 46], cap: 'Unlocked. The deal moves to Negotiation.' },
]

export type FeedItem = [kind: string, text: string, page: string]
export const POOL: FeedItem[] = [
  ['Slack', 'Read a #deal-desk thread about a 38% discount', 'Opportunity approvals'],
  ['Salesforce', 'New validation rule on Case: Priority_Requires_SLA', 'Case escalation'],
  ['Watched', 'A deal closed after CRO approval', 'Opportunity approvals'],
  ['Integration', 'CPQ sync retried 3 times for quote Q-1192', 'CPQ quote sync'],
  ['Meeting', 'Transcribed RevOps weekly (42 minutes)', 'Lead routing'],
  ['Verified', 'Dana verified “Discount policy, section 2”', 'Discount policy'],
  ['Salesforce', 'New field on Account: Partner_Tier__c', 'Partner deals'],
  ['Jira', 'SF-2240: add Finance to approvals over $500k', 'Opportunity approvals'],
]
export const FEED0: FeedItem[] = [['Slack', 'Read 2 new #deal-desk threads about approvals', 'Opportunity approvals'], ['Salesforce', 'Approval step changed on Large Deal Approval', 'Opportunity approvals'], ['Verified', 'Dana verified the rules in Opportunity approvals', 'Opportunity approvals'], ['Meeting', 'Transcribed the CS leadership sync', 'Case escalation']]

export const AREAS: [string, number, number][] = [['Sales Cloud', 412, 92], ['CPQ', 188, 81], ['Policies', 174, 84], ['People and teams', 153, 77], ['Service Cloud', 236, 66], ['Integrations', 121, 46]]

export const CORPUS: [number, string][] = [
  [1, 'Opportunity approval is how Northwind reviews large deals before they move to Negotiation.'], [2, 'Any deal over $100,000 needs approval.'], [3, 'Up to 20% off, the sales manager approves. Over 20%, Finance is added as a second approver. Over 35%, the CRO approves directly instead.'], [4, 'EMEA deals reportedly go to the regional director, Sofia, first. Seen once.'], [5, 'Most approvals finish in under four hours. Median 3 hours 40 minutes.'], [6, 'An approval request expires after 14 days, and the rep must resubmit.'], [7, 'Requests expire because two deals closed on six-week-old prices in 2024, losing about $90k in margin.'], [8, 'Once a deal is approved, only Deal Desk can change its amount.'], [9, 'At quarter end, Deal Desk approves large deals in Slack first and logs them in Salesforce afterward. Unofficial.'], [11, 'Renewals with no price change skip approval. Open question.'],
]

export const PREV: Record<string, [string, string]> = {
  'Maria Okafor': ['Person', 'Owns the approval process, lead routing, and forecasting, in RevOps.'],
  'CPQ quote sync': ['Integration', 'Sends approved discounts from Salesforce to quotes. Failing for multi-currency deals since Oct 29. 2 statements, 1 being checked.'],
  'Discount policy': ['Page', 'What reps can discount on their own, and what needs approval. 3 statements, all verified.'],
  'Quarter-end close': ['Page', 'The rules for the last 3 business days of a quarter, including the Slack approvals.'],
  'Deal Desk': ['Page', 'The team that runs approvals and contract exceptions. Led by Priya Shah since Oct 12.'],
  Renewals: ['Page', 'How renewals are priced and approved.'],
  'Case escalation': ['Page', 'When support cases go to engineering. Includes the unwritten data-loss rule.'],
}

export const ROUTE: [RegExp, string, string][] = [
  [/park|office|desk|building|badge|wifi|lunch|travel|expense/, 'Leo Park', 'Facilities'],
  [/vacation|pto|leave|benefit|salary|pay|hiring|holiday|onboard/, 'Ana Silva', 'People'],
  [/password|security|vpn|laptop|access|sso|mfa/, 'Sol Reyes', 'Security'],
  [/quote|cpq|integration|sync|api/, 'Ben Ito', 'Integrations'],
  [/deal|discount|approv|renewal|forecast|lead|pipeline|sales|quota/, 'Maria Okafor', 'RevOps'],
]
export const DOCS: Record<string, string> = { Facilities: 'office handbook', People: 'people handbook', Security: 'IT security guide', Integrations: 'integrations runbook', RevOps: 'RevOps playbook' }

