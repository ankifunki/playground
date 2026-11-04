import type { AgentId } from './data'

/** One link in the chain behind a piece of knowledge. */
export type TStep = {
  k: 'observed' | 'reasoned' | 'asked' | 'edited' | 'verified' | 'revoked'
  by: AgentId | 'person'; name?: string
  t: string; src?: string; quote?: string; before?: string; after?: string; at: string
}
export type Tier = 'verified' | 'observed' | 'unofficial' | 'open' | 'checking' | 'kb' | 'manual'

/** The base chain for each block on Discount approvals. Live events append to these (see store.why). Demo data. */
export const TRACE: Record<string, { label: string; tier: Tier; steps: TStep[] }> = {
  /*
   * Approval tiers (approval-tiers.md). Every step comes from what the file itself says about its provenance:
   * the roster and privilege counts were verified live on Aug 11, 2026; the approver list is from the knowledge
   * base and not re-checked; the policy text is hand-written (source: manual); counts from the Setup Audit Trail
   * are capped. Nothing here adds evidence the file doesn't state.
   */
  'ti-approvers': { label: 'Who signs off', tier: 'kb', steps: [
    { k: 'observed', by: 'security', t: 'Read the approver for each domain from the knowledge base', src: 'Knowledge base · approver list', at: 'before Aug 11' },
    { k: 'reasoned', by: 'security', t: 'The last audit didn’t re-verify this list independently, so it is shown as written and marked as not re-checked.', at: 'Aug 11' },
  ] },
  'ti-sasha': { label: 'Who signs off · data quality', tier: 'open', steps: [
    { k: 'observed', by: 'security', t: 'The knowledge base lists “Sasha Merrill” as the data-quality and integration-normalisation approver', src: 'Knowledge base · approver list', at: 'before Aug 11' },
    { k: 'observed', by: 'security', t: 'Matched the name against the org’s identities: it is an integration seat, not a person', src: 'Integration identities', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'A machine identity can’t approve anything. Flagged as a defect in the org’s own approver list; this domain has no human approver on record.', at: 'Aug 11' },
  ] },
  'ti-gates': { label: 'Two gates', tier: 'manual', steps: [
    { k: 'observed', by: 'security', t: 'Read the two-gate rule: the business gate signs off the plan, the platform gate the write; fixed order, neither replaces the other', src: 'approval-tiers.md · source: manual', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'For churn the business approver must affirm four inputs (account, churn date, reason, notes) before platform approval is requested.', at: 'Aug 11' },
  ] },
  'ti-notcount': { label: 'Two gates · rules', tier: 'manual', steps: [
    { k: 'observed', by: 'security', t: 'Read the list of things that never stand in for the business gate, silence included', src: 'approval-tiers.md · source: manual', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'One exception: the requester is the named approver and the ticket already authorised the exact plan on all four inputs. If any input shifted, ask.', at: 'Aug 11' },
  ] },
  'ti-roster': { label: 'Privilege surface · counts', tier: 'observed', steps: [
    { k: 'observed', by: 'security', t: 'Counted users on the System Administrator profile: 19, of which 12 people and 7 machine identities. Admin is granted by profile, not role.', src: 'Live Salesforce query · users by profile', at: 'Aug 11' },
    { k: 'observed', by: 'security', t: 'Licences in use: 108 of 109', src: 'Live Salesforce query · licences', at: 'Aug 11' },
    { k: 'observed', by: 'security', t: 'Of 7 powerful permission sets, 1 has a live assignee', src: 'Live Salesforce query · permission set assignments', at: 'Aug 11' },
  ] },
  'ti-f-machine': { label: 'Finding · machine identities on admin', tier: 'observed', steps: [
    { k: 'observed', by: 'security', t: '7 machine identities hold the full System Administrator profile, each on a full Salesforce seat', src: 'Live Salesforce query · users by profile', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'In a licence-saturated org (108/109) this is the biggest exposure. Moving them to an integration licence and an API-only profile recovers about 7 seats and takes them off admin.', at: 'Aug 11' },
  ] },
  'ti-f-vendor': { label: 'Finding · vendor permission set', tier: 'observed', steps: [
    { k: 'observed', by: 'security', t: 'One permission set carries ViewAllData, ModifyAllData and ViewSetup, assigned to a CS-platform integration user run by an external vendor', src: 'Live Salesforce query · permission sets', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'That is unrestricted read and write on every object, behind a read-only-looking, API-only profile. It should be scoped to the objects the vendor needs.', at: 'Aug 11' },
  ] },
  'ti-f-profile': { label: 'Finding · profile-granted permissions', tier: 'observed', steps: [
    { k: 'observed', by: 'security', t: 'Six of the seven powerful permission sets have no active assignee; ModifyAllData, ViewAllData, ManageUsers and AuthorApex are granted by profiles', src: 'Live Salesforce query · profiles and permission sets', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'An audit of permission sets alone would miss these; profiles have to be read too.', at: 'Aug 11' },
  ] },
  'ti-f-integ': { label: 'Finding · integration permission set', tier: 'observed', steps: [
    { k: 'observed', by: 'security', t: 'The correctly scoped integration permission set has 9 assignees', src: 'Live Salesforce query · permission set assignments', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'That is the right posture. It is not the answer to a “give me full access” request.', at: 'Aug 11' },
  ] },
  'ti-over': { label: 'Over-grants to flag', tier: 'observed', steps: [
    { k: 'observed', by: 'security', t: 'Read role and profile assignments: the Security lead and the COO on the CEO role, a Marketing user on System Administrator, a duplicate standard user for an executive, one AE on an unexpected role', src: 'Live Salesforce query · users by role and profile', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'Each looks wider than the job needs. Flagged for a person to decide; nothing was changed.', at: 'Aug 11' },
  ] },
  'ti-model': { label: 'Access requests · no access model', tier: 'open', steps: [
    { k: 'observed', by: 'security', t: 'Found no documented Salesforce access model for Kestrel; the gap is catalogued', src: 'Policies and ownership', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'That gap is behind most access requests: grants, visibility, field security, dashboards, freezes and licence counts.', at: 'Aug 11' },
  ] },
  'ti-dash': { label: 'Dashboard access · two steps', tier: 'manual', steps: [
    { k: 'observed', by: 'security', t: 'Read that access to an agent-built dashboard needs the dashboard permission set and an admin-approved connected app', src: 'approval-tiers.md · source: manual', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'The permission set alone fails with invalid_app_access, which looks as if the grant didn’t work.', at: 'Aug 11' },
  ] },
  'ti-sharing': { label: 'Open question · report sharing', tier: 'open', steps: [
    { k: 'observed', by: 'security', t: 'Found no policy for report and dashboard sharing', src: 'approval-tiers.md · marked [Open]', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'Widening visibility beyond the sales hierarchy is undecided, not an implicit yes: escalate rather than decide, and confirm access to data the requester may not be entitled to see.', at: 'Aug 11' },
  ] },
  'ti-skew': { label: 'Data caveat', tier: 'observed', steps: [
    { k: 'observed', by: 'security', t: 'The Setup Audit Trail returned its 2,000-row cap for the 90-day window', src: 'Setup Audit Trail · 90 days', at: 'Aug 11' },
    { k: 'observed', by: 'security', t: 'The direct query for flow authorship has a gap, so authorship comes from the audit trail', src: 'Flow metadata query', at: 'Aug 11' },
    { k: 'reasoned', by: 'security', t: 'Rankings per person and category hold; absolute counts understate. Any number quoted from here should say which source it rests on.', at: 'Aug 11' },
  ] },
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
