/* Wikimind (v1): one page with trust by exception, arrival modes, and a relationship map. Data from the original prototype. */
export type Tier = 'ver' | 'cor' | 'one' | 'gap'
export type ProvKind = 'sf' | 'slack' | 'ticket' | 'meet' | 'doc' | 'ask' | 'think' | 'ver' | 'watch'
export type Prov = { k: ProvKind; s: string; w: string; t: string }
export type Block = { tier: Tier; text: string; prov: Prov[]; changed?: string; before?: string; flag?: string; fresh?: boolean }
export type BlockId = 's' | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7'

export const TIER: Record<Tier, [string, string]> = { ver: ['Verified', 'A person on your team confirmed this.'], cor: ['Corroborated', 'Several independent sources agree.'], one: ['Single source', 'Seen once. Asoka is watching for more.'], gap: ['Open question', 'Asoka is asking someone to close this gap.'] }
export const TCOL: Record<Tier, string> = { ver: 'var(--ver)', cor: 'var(--cor)', one: 'var(--one)', gap: 'var(--gap)' }
export const KIND: Record<ProvKind, [string, string]> = { sf: ['SF', 'Salesforce'], slack: ['#', 'Slack'], ticket: ['J', 'Jira'], meet: ['M', 'Meeting'], doc: ['D', 'Policy doc'], ask: ['?', 'Asked a person'], think: ['A', 'Asoka’s reasoning'], ver: ['✓', 'Verified'], watch: ['O', 'Watched in practice'] }

const BASE: Record<BlockId, Block> = {
 s:{tier:'ver',text:'Any Opportunity over $100,000 needs approval before it can move to Negotiation. Who approves depends on the region and the discount. Most approvals finish in under 4 hours.',
  prov:[{k:'doc',s:'Sales policy v4, section 3',w:'Jan 2026',t:'Opportunities above $100,000 need approval before negotiation.'},{k:'watch',s:'212 approvals this quarter',w:'Ongoing',t:'Median time to approve: 3 hours 40 minutes.'},{k:'ver',s:'Dana Ruiz, Asoka sysadmin',w:'Oct 12',t:'Verified this summary.'}]},
 b1:{tier:'ver',text:'When a rep moves an Opportunity over $100,000 to Negotiation, the Large Deal Approval process locks the record and routes it for approval.',
  prov:[{k:'sf',s:'Setup audit trail',w:'Mar 4, 2024',t:'Approval process “Large Deal Approval” activated on Opportunity.'},{k:'watch',s:'Approvals this quarter',w:'Ongoing',t:'All 212 locked the record and routed as described.'},{k:'ver',s:'Dana Ruiz',w:'Oct 12',t:'Verified.'}]},
 b2:{tier:'cor',text:'Discounts above 20% add Finance as a second approver. Above 35%, the CRO approves directly.',
  prov:[{k:'sf',s:'Setup audit trail',w:'Sep 12',t:'Step “Finance review” added for discounts over 20%.'},{k:'slack',s:'#deal-desk, J. Patel',w:'Oct 3',t:'“Anything over 35 goes straight to Marcus now.”'},{k:'ticket',s:'SF-2231',w:'Oct 28',t:'Lower the CRO threshold from 40% to 35%. Done.'},{k:'think',s:'Asoka',w:'Oct 28',t:'Three independent sources agree, so this is corroborated. Waiting for a person to verify.'}]},
 b3:{tier:'one',text:'EMEA deals go to the EMEA sales director first, then follow the normal discount rules.',
  prov:[{k:'slack',s:'#emea-sales, L. Moreau',w:'Aug 20',t:'“Remember, EMEA goes to Sofia first.”'},{k:'think',s:'Asoka',w:'Aug 20',t:'Only one source, and no matching step in Salesforce. Watching the next EMEA approval to confirm.'}]},
 b4:{tier:'ver',text:'An approval request expires after 14 days. The record unlocks and the rep has to submit it again.',
  prov:[{k:'sf',s:'Approval process settings',w:'Mar 4, 2024',t:'Pending requests are recalled automatically after 14 days.'},{k:'doc',s:'Sales policy v4, section 3.2',w:'Jan 2026',t:'Approvals are valid for two weeks.'},{k:'ver',s:'Dana Ruiz',w:'Oct 12',t:'Verified.'}]},
 b5:{tier:'ver',text:'Once an Opportunity is approved, only Deal Desk can change its amount.',
  prov:[{k:'sf',s:'Validation rule Amount_Locked_After_Approval',w:'Jun 2025',t:'Blocks amount edits on approved records unless the user is in Deal Desk.'},{k:'ver',s:'Dana Ruiz',w:'Oct 12',t:'Verified.'}]},
 b6:{tier:'cor',text:'At quarter end, Deal Desk approves large deals directly in #deal-desk and logs them in Salesforce afterward. Expect a Slack thread, not an email.',
  prov:[{k:'slack',s:'#deal-desk, 9 threads',w:'Last 3 quarter ends',t:'Approvals granted in the thread, then logged in Salesforce.'},{k:'meet',s:'RevOps weekly',w:'Sep 30',t:'Maria Okafor: “At quarter end we just do it in Slack.”'},{k:'think',s:'Asoka',w:'Oct 1',t:'A consistent pattern, but it bypasses the official process. Flagged for a person to verify.'}]},
 b7:{tier:'gap',text:'Renewals with no price change seem to skip approval, but no rule in Salesforce explains why.',
  prov:[{k:'meet',s:'RevOps weekly',w:'Oct 27',t:'Someone mentioned that renewals don’t need approval.'},{k:'think',s:'Asoka',w:'Oct 27',t:'14 flat renewals skipped approval last quarter, with no rule behind it.'},{k:'ask',s:'Asked Maria Okafor, RevOps',w:'Yesterday',t:'“Is skipping approval for flat renewals intentional?” Waiting for an answer.'}]}
}
BASE.b2.changed = 'Updated since your last visit'
BASE.b2.before = 'Discounts above 20% add Finance as a second approver. Above 40%, the CRO approves directly.'
BASE.b6.flag = 'Unofficial practice. It bypasses the approval process.'
export const ORDER: BlockId[] = ['s', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7']

/** The page's facts. Once Maria answers, the renewals fact is rewritten and marked as updated. */
export function blocks(updated: boolean): Record<BlockId, Block> {
  if (!updated) return BASE
  const b = BASE.b7
  return { ...BASE, b7: { ...b, before: b.text, changed: 'Updated just now', tier: 'cor', text: 'Renewals with no price change skip approval on purpose. RevOps confirmed it’s been the policy since 2023, because flat renewals don’t change revenue risk.', prov: [...b.prov, { k: 'ask', s: 'Maria Okafor answered', w: 'Just now', t: '“Yes, that’s on purpose. It’s been the policy since 2023.”' }, { k: 'think', s: 'Asoka', w: 'Just now', t: 'The process owner confirmed it, so this is corroborated. Waiting for Dana to verify.' }] } }
}

export type Cluster = { n: string; p: number; x: number; y: number; pages: [string, string | null][] }
export const CL: Cluster[] = [
 {n:'Sales Cloud',p:412,x:92,y:86,pages:[['Opportunity approvals','page'],['Lead routing',null],['Territory rules',null]]},
 {n:'CPQ',p:188,x:212,y:66,pages:[['Discount policy',null],['Quote templates',null],['Product bundles',null]]},
 {n:'Service Cloud',p:236,x:326,y:96,pages:[['Case escalation',null],['SLA entitlements',null],['Support queues',null]]},
 {n:'Integrations',p:121,x:88,y:212,pages:[['CPQ quote sync',null],['NetSuite order sync',null],['Marketo lead sync',null]]},
 {n:'Policies',p:174,x:208,y:206,pages:[['Quarter-end close',null],['Data retention',null],['Access reviews',null]]},
 {n:'People and teams',p:153,x:322,y:220,pages:[['Deal Desk',null],['RevOps',null],['Who owns what',null]]}
]
export const POOL: { k: string; t: string; c: number }[] = [
 {k:'Slack',t:'Read a #deal-desk thread about a 38% discount',c:0},
 {k:'Salesforce',t:'Saw a new validation rule on Case: Priority_Requires_SLA',c:2},
 {k:'Watched',t:'Opportunity 0068X closed after CRO approval',c:0},
 {k:'Integration',t:'CPQ sync retried 3 times for quote Q-1192',c:3},
 {k:'Meeting',t:'Heard “renewals don’t need approval” in RevOps weekly',c:4},
 {k:'Verified',t:'Dana verified “Discount policy, section 2”',c:1},
 {k:'Salesforce',t:'New field on Account: Partner_Tier__c',c:0},
 {k:'Jira',t:'SF-2240: add Finance to approvals over $500k',c:0},
 {k:'People',t:'Priya Shah joined Deal Desk as team lead',c:5}
]

export type GNode = { id: string; t: 'auto' | 'ppl' | 'pol' | 'proc'; l: string; d: string; warn?: boolean }
export const GN: GNode[] = [
 {id:'lda',t:'auto',l:'Large Deal Approval',d:'The approval process itself. It locks the record and routes it. 212 approvals ran through it this quarter.'},
 {id:'olh',t:'auto',l:'Lock handler',d:'Apex trigger that locks and unlocks the record. Depends on Large Deal Approval.'},
 {id:'amt',t:'auto',l:'Amount lock rule',d:'Validation rule. After approval, only Deal Desk can change the amount.'},
 {id:'dr',t:'auto',l:'Discount reason rule',d:'Validation rule. Any discount needs a written reason.'},
 {id:'cpq',t:'auto',l:'CPQ quote sync',d:'Sends approved discounts to quotes. Failing for multi-currency deals since Oct 29.',warn:true},
 {id:'mo',t:'ppl',l:'Maria Okafor',d:'Owns the process, in RevOps. Talk to her before changing it.'},
 {id:'dd',t:'ppl',l:'Deal Desk',d:'Runs approvals day to day and can grant extensions.'},
 {id:'mgr',t:'ppl',l:'Sales manager',d:'Approves every deal over $100,000 first.'},
 {id:'fin',t:'ppl',l:'Finance',d:'Joins when the discount is over 20%.'},
 {id:'cro',t:'ppl',l:'CRO',d:'Approves directly when the discount is over 35%.'},
 {id:'sof',t:'ppl',l:'Sofia, EMEA',d:'Approves EMEA deals first. Asoka has seen this only once.'},
 {id:'dp',t:'pol',l:'Discount policy',d:'Sets the 20% and 35% thresholds.'},
 {id:'qe',t:'pol',l:'Quarter-end close',d:'Where the unofficial Slack approvals happen.'},
 {id:'ren',t:'proc',l:'Renewals',d:'Flat renewals skip approval.'}
]
export const GE: [string, string][] = [['lda','olh'],['lda','amt'],['lda','cpq'],['dr','cpq'],['dp','fin'],['dp','cro'],['dd','amt'],['qe','dd'],['mo','lda'],['sof','mgr'],['mgr','fin']]
export const GCOLS: Record<GNode['t'], string> = { auto: 'var(--ink)', ppl: 'var(--accent)', pol: 'var(--ver)', proc: 'var(--ink2)' }
export const GNAME: Record<GNode['t'], string> = { auto: 'Automations', ppl: 'People', pol: 'Policies', proc: 'Processes' }
export type Focus = 'touches' | 'path' | 'people'
export const FOCUS: Record<Focus, string[]> = { touches: ['lda', 'olh', 'amt', 'dr', 'cpq'], path: ['sof', 'mgr', 'fin'], people: ['mo', 'dd', 'mgr', 'fin', 'cro', 'sof'] }

export type Mode = 'cite' | 'change' | 'browse' | 'demo'
export const MODES: Record<Mode, string> = { cite: 'From a Slack citation', change: 'From a home story', browse: 'Browsing', demo: 'Sales demo' }
export const OPEN_SECS: Record<Mode, Record<string, boolean>> = { cite: { rules: true }, change: { how: true, hist: true }, browse: { how: true, map: true }, demo: { how: true, map: true, unw: true } }
export const CHIPS: Record<'home' | Mode, string[]> = {
  home: ['What changed this week?', 'Who approves a 30% discount in EMEA?', 'How do I get lunch reimbursed?'],
  cite: ['Can I get an extension?', 'Who approves my deal?', 'Why 14 days?'], change: ['Which deals are affected?', 'Is this current?'],
  browse: ['What breaks if I change the approval process?', 'How do you know this?', 'Is this current?'], demo: ['How do you know this?', 'What are you unsure about?'],
}
