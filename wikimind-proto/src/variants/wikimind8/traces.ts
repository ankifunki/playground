import type { AgentId } from './data'

/** One link in the chain behind a piece of knowledge. */
export type TStep = {
  k: 'observed' | 'reasoned' | 'asked' | 'edited' | 'verified' | 'revoked'
  by: AgentId | 'person'; name?: string
  t: string; src?: string; quote?: string; before?: string; after?: string; at: string
}
export type Tier = 'verified' | 'observed' | 'unofficial' | 'open' | 'checking'

/** The base chain for each block on Discount approvals. Live events append to these (see store.why). Demo data. */
export const TRACE: Record<string, { label: string; tier: Tier; steps: TStep[] }> = {
  sum: { label: 'Summary', tier: 'verified', steps: [
    { k: 'observed', by: 'approvals', t: 'Read the Large Deal Approval process in Salesforce setup', src: 'Salesforce config · 6 years of changes', at: 'Mar 3' },
    { k: 'observed', by: 'approvals', t: 'Watched 1,912 approvals in the last 30 days', src: 'Approval history', at: 'ongoing' },
    { k: 'reasoned', by: 'approvals', t: 'All 412 deals over $100,000 that reached Negotiation were locked for approval. Median approval: 3 h 40 m.', at: 'Oct 30' },
    { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Verified the summary against the process', at: 'Oct 31' },
  ] },
  'who-mgr': { label: 'Who approves · sales manager', tier: 'verified', steps: [
    { k: 'observed', by: 'approvals', t: 'Approval step 1 routes to the deal owner’s manager for every discount', src: 'Large Deal Approval · step 1', at: 'Mar 3' },
    { k: 'reasoned', by: 'approvals', t: 'All 58 deals at or under the Finance threshold stopped after step 1 this month.', at: 'Oct 27' },
    { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Checked against Salesforce and the policy', at: 'Oct 28' },
  ] },
  'who-fin': { label: 'Who approves · Finance', tier: 'verified', steps: [
    { k: 'observed', by: 'approvals', t: 'Approval step 2 entry criteria: Discount over 20%', src: 'Large Deal Approval · step 2', at: 'Mar 3' },
    { k: 'observed', by: 'approvals', t: 'Priya Shah in #deal-desk', src: 'Slack · #deal-desk', quote: '“Finance needs to sign off anything above 20, no exceptions.”', at: 'Sep 14' },
    { k: 'reasoned', by: 'approvals', t: 'Config and practice agree: all 26 deals over 20% had Finance approval.', at: 'Oct 27' },
    { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Checked against Salesforce and the policy', at: 'Oct 28' },
  ] },
  'who-cro': { label: 'Who approves · CRO', tier: 'verified', steps: [
    { k: 'observed', by: 'approvals', t: 'Salesforce changed: CRO threshold lowered from 40% to 35%', src: 'Setup audit trail', at: 'Oct 28' },
    { k: 'edited', by: 'approvals', t: 'Rewrote the rule and 3 other pages', before: 'Over 40%: the CRO approves directly.', after: 'Over 35%: the CRO approves directly.', at: 'Oct 28' },
    { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Verified the change', at: 'Oct 28' },
  ] },
  'r-exp': { label: 'When a request expires', tier: 'verified', steps: [
    { k: 'observed', by: 'approvals', t: 'Approval requests auto-recall after 14 days', src: 'Large Deal Approval · settings', at: 'Mar 3' },
    { k: 'observed', by: 'approvals', t: 'Found the reason in an old thread', src: 'Slack · #revops, 2024', quote: '“Two deals closed on six-week-old prices. We’re capping approvals at two weeks.”', at: 'Apr 2024' },
    { k: 'reasoned', by: 'approvals', t: 'The stale-price deals explain the rule; nothing newer contradicts it.', at: 'Oct 2' },
    { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Checked against Salesforce and the policy', at: 'Oct 3' },
  ] },
  'r-after': { label: 'After approval', tier: 'verified', steps: [
    { k: 'observed', by: 'finance', t: 'Validation rules Amount_Locked_After_Approval and Discount_Requires_Reason', src: 'Salesforce config', at: 'Mar 3' },
    { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Checked against Salesforce and the policy', at: 'Oct 3' },
  ] },
  qe: { label: 'Quarter-end approvals in Slack', tier: 'unofficial', steps: [
    { k: 'observed', by: 'approvals', t: 'Large deals approved in #deal-desk before Salesforce, at quarter end', src: 'Slack · 9 #deal-desk threads', at: 'last 12 quarters' },
    { k: 'reasoned', by: 'approvals', t: 'No policy mentions it (9 of the last 12 quarter ends), so it’s written as practice, not a rule.', at: 'Oct 1' },
    { k: 'asked', by: 'approvals', t: 'Asked Priya Shah if it’s policy', quote: '“It’s how we’ve always done it at quarter end.”', at: 'Oct 2' },
  ] },
  renew: { label: 'Flat renewals', tier: 'open', steps: [
    { k: 'observed', by: 'approvals', t: '14 flat renewals over $100,000 skipped approval', src: 'Approval history', at: 'last 6 months' },
    { k: 'reasoned', by: 'approvals', t: 'No rule or policy explains it, so it’s an open question, not a fact.', at: 'Oct 27' },
    { k: 'asked', by: 'approvals', t: 'Asked Maria Okafor (RevOps), the process owner', at: 'Oct 27' },
  ] },
  cfg: { label: 'Configured in Salesforce', tier: 'observed', steps: [
    { k: 'observed', by: 'approvals', t: 'Read the approval process, 2 validation rules and 1 integration that touch approvals', src: 'Salesforce metadata', at: 'hourly' },
  ] },
  'cfg-cpq': { label: 'CPQ quote sync', tier: 'open', steps: [
    { k: 'observed', by: 'integrations', t: '412 sync errors since a CPQ update', src: 'CPQ sync log', at: 'since Oct 29' },
    { k: 'reasoned', by: 'integrations', t: 'Every failing quote is multi-currency; single-currency quotes still sync.', at: 'Oct 30' },
    { k: 'asked', by: 'integrations', t: 'Asked Ben Ito (Integrations) why', at: 'Oct 30' },
  ] },
  flow: { label: 'How it works', tier: 'verified', steps: [
    { k: 'observed', by: 'approvals', t: 'Drew the flow from Large Deal Approval and 30 days of approval history', src: 'Salesforce config · approval history', at: 'Oct 30' },
    { k: 'verified', by: 'person', name: 'Dana Ruiz', t: 'Verified the routes', at: 'Oct 31' },
  ] },
}
