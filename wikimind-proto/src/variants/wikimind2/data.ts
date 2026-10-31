/* Everything Asoka knows about Northwind, as areas, processes and claims. Generated from the original prototype. */
export type Domain = { id: string; n: string; x: number; y: number; r: number; cov: number; pages: number }
export type Proc = { id: string; d: string; n: string; dx: number; dy: number; r: number; cov: number; w: string; deps: string[]; own?: boolean; unk: [string, string, number?][] }
export type Why = { d: string; t: string; s: string }
export type Hist = { d: string; t: string; w: string }
export type Drift = { policy: string; practice: string; y: number; n: number; yl: string; nl: string }
export type Claim = { id: string; p: string; s: string; t: string; st: 'solid' | 'chg' | 'chk'; reason: string; why: Why[]; hist: Hist[]; src: string[]; rel: string[]; drift?: Drift; note?: string }
type KOpts = { id?: string; st?: Claim['st']; reason?: string; why?: Why[]; hist?: Hist[]; since?: string; w?: string; src?: string[]; rel?: string[]; drift?: Drift; note?: string }

export const DOMAINS: Domain[] = [
 {id:'sales',n:'Sales Cloud',x:115,y:125,r:62,cov:.92,pages:412},
 {id:'cpq',n:'CPQ',x:288,y:100,r:44,cov:.81,pages:188},
 {id:'service',n:'Service Cloud',x:300,y:258,r:50,cov:.66,pages:236},
 {id:'integ',n:'Integrations',x:100,y:298,r:38,cov:.46,pages:121},
 {id:'policy',n:'Policies',x:205,y:200,r:32,cov:.84,pages:174},
 {id:'people',n:'People and teams',x:205,y:338,r:30,cov:.77,pages:153}
]

export const PROCS: Proc[] = [
 {id:'approvals',d:'sales',n:'Opportunity approvals',dx:-17,dy:-15,r:15,cov:.95,w:'How deals over $100,000 get approved before Negotiation.',deps:['discount','cpqsync','qclose','dealdesk','revops'],own:true,
  unk:[['Why flat renewals skip approval','Asked Maria Okafor in RevOps yesterday',1]]},
 {id:'leads',d:'sales',n:'Lead routing',dx:21,dy:-22,r:10,cov:.9,w:'How new leads reach the right rep.',deps:['territory','revops'],unk:[]},
 {id:'forecast',d:'sales',n:'Forecasting',dx:-22,dy:24,r:10,cov:.86,w:'How the weekly forecast is built and called.',deps:['approvals','territory'],unk:[]},
 {id:'territory',d:'sales',n:'Territories',dx:17,dy:23,r:9,cov:.8,w:'How accounts are split between teams.',deps:['leads','dealdesk'],unk:[['Who approves mid-year account moves','Seen once, in a VP’s Slack message']]},
 {id:'partner',d:'sales',n:'Partner deals',dx:41,dy:2,r:8,cov:.16,w:'How deals that come through partners are handled.',deps:['approvals','discount'],unk:[['Who approves partner discounts','Asoka has seen only one partner deal'],['How referral fees get paid out','No data yet']]},
 {id:'discount',d:'cpq',n:'Discount policy',dx:-12,dy:-9,r:11,cov:.88,w:'What reps can discount on their own, and what needs approval.',deps:['approvals','quotes'],unk:[]},
 {id:'quotes',d:'cpq',n:'Quote templates',dx:15,dy:10,r:9,cov:.8,w:'How quotes are generated and sent.',deps:['discount','cpqsync'],unk:[]},
 {id:'bundles',d:'cpq',n:'Product bundles',dx:-9,dy:20,r:7,cov:.7,w:'Which products are sold together, and at what price.',deps:['discount'],unk:[]},
 {id:'escal',d:'service',n:'Case escalation',dx:-15,dy:-12,r:11,cov:.7,w:'When support cases go to engineering.',deps:['sla','queues'],unk:[]},
 {id:'sla',d:'service',n:'SLA entitlements',dx:16,dy:8,r:10,cov:.66,w:'Response times promised to customers.',deps:['escal'],unk:[]},
 {id:'queues',d:'service',n:'Support queues',dx:-6,dy:26,r:8,cov:.5,w:'How cases are sorted into queues.',deps:['escal'],unk:[['How weekend cases are staffed','No data yet']]},
 {id:'cpqsync',d:'integ',n:'CPQ quote sync',dx:-9,dy:-9,r:10,cov:.38,w:'Sends approved discounts from Salesforce to quotes.',deps:['approvals','quotes'],unk:[['Why multi-currency quotes fail','Asked Ben Ito in Integrations 2 days ago',1]]},
 {id:'nsync',d:'integ',n:'NetSuite sync',dx:12,dy:14,r:8,cov:.52,w:'Sends closed deals to NetSuite for billing.',deps:['revops'],unk:[['What happens to orders that fail to sync','No data yet']]},
 {id:'qclose',d:'policy',n:'Quarter-end close',dx:-8,dy:-7,r:9,cov:.82,w:'The rules for the last 3 business days of a quarter.',deps:['approvals','dealdesk'],unk:[]},
 {id:'retention',d:'policy',n:'Data retention',dx:10,dy:11,r:7,cov:.86,w:'How long customer data is kept.',deps:[],unk:[]},
 {id:'dealdesk',d:'people',n:'Deal Desk',dx:-8,dy:-6,r:8,cov:.8,w:'The team that runs approvals and contract exceptions.',deps:['approvals','qclose'],unk:[]},
 {id:'revops',d:'people',n:'RevOps',dx:10,dy:9,r:7,cov:.75,w:'The team that owns sales processes and tools.',deps:['approvals','leads','forecast'],unk:[]}
]

export const CLAIMS: Claim[] = []
function K(p: string, s: string, t: string, o: KOpts = {}) {
  const n = CLAIMS.filter((x) => x.p === p).length + 1
  CLAIMS.push({ id: o.id || p + n, p, s, t, st: o.st || 'solid', reason: o.reason || '', why: o.why || [], hist: o.hist || [{ d: o.since || '2025', t, w: o.w || 'First observed.' }], src: o.src || ['Salesforce setup history'], rel: o.rel || [], drift: o.drift, note: o.note })
}
/* approvals */
K('approvals','Over $100k','Any deal over $100,000 needs approval before it can move to Negotiation.',{id:'c1',why:[{d:'Jan 2024',t:'Finance asked to review large deals after Q4 discounting ran high.',s:'RevOps planning doc'},{d:'Mar 2024',t:'The Large Deal Approval process went live in Salesforce.',s:'Salesforce setup history'}],since:'Mar 2024',w:'The approval process launched.',src:['Salesforce setup history','Sales policy v4','212 approvals Asoka watched this quarter'],rel:['Large Deal Approval','Deal Desk']});
K('approvals','Discount tiers','Discounts over 20% add Finance as a second approver. Over 35%, the CRO approves directly.',{id:'c2',st:'chg',reason:'Changed Oct 28',why:[{d:'Sep 2026',t:'Margins dipped in Q2, so Finance asked to review mid-size discounts.',s:'#finance thread'},{d:'Oct 2026',t:'The CRO wanted to see more large discounts personally, so the threshold dropped to 35%.',s:'Jira SF-2231'}],hist:[{d:'Mar 2024',t:'Discounts over 25% need the CRO.',w:'Set when the approval process launched.'},{d:'Sep 12',t:'Discounts over 20% add Finance. Over 40%, the CRO approves directly.',w:'Finance review step added in Salesforce.'},{d:'Oct 28',t:'Discounts over 20% add Finance as a second approver. Over 35%, the CRO approves directly.',w:'Threshold lowered by Jira SF-2231, confirmed in #deal-desk.'}],src:['Salesforce setup history','Jira SF-2231','#deal-desk thread, Oct 3'],rel:['Discount policy','Finance','CRO','CPQ quote sync']});
K('approvals','EMEA step','EMEA deals go to Sofia, the EMEA sales director, before the normal discount rules apply.',{id:'c3',st:'chk',reason:'Seen once',why:[{d:'Aug 2026',t:'L. Moreau mentioned it in #emea-sales. There is no matching step in Salesforce.',s:'Slack'}],since:'Aug 2026',w:'First seen in Slack.',src:['#emea-sales thread, Aug 20'],rel:['Sofia, EMEA director'],note:'Asoka is watching the next EMEA approval to confirm.'});
K('approvals','14-day expiry','An approval request expires after 14 days. The record unlocks and the rep has to send it again.',{id:'c4',why:[{d:'Feb 2024',t:'Two deals closed on prices quoted six weeks earlier, costing about $90,000 in margin.',s:'#revops thread, Jira SF-1180'},{d:'Mar 2024',t:'Requests were set to expire after 14 days so pricing stays current.',s:'Approval process settings'}],since:'Mar 2024',w:'Set at launch.',src:['Approval process settings','Sales policy v4, section 3.2','Jira SF-1180'],rel:['Large Deal Approval']});
K('approvals','Amount lock','Once a deal is approved, only Deal Desk can change its amount.',{id:'c5',why:[{d:'May 2025',t:'An audit found a deal whose amount was raised after it was approved.',s:'Internal audit'},{d:'Jun 2025',t:'A validation rule now blocks amount changes on approved deals, except for Deal Desk.',s:'Salesforce setup history'}],since:'Jun 2025',w:'Validation rule added.',src:['Validation rule Amount_Locked_After_Approval','Internal audit, May 2025'],rel:['Amount lock rule','Deal Desk']});
K('approvals','Quarter-end Slack','At quarter end, Deal Desk approves large deals in #deal-desk first and logs them in Salesforce afterward.',{id:'c6',st:'chk',reason:'People do it differently',drift:{policy:'Approve in Salesforce before the deal moves to Negotiation.',practice:'9 of the last 12 quarter-end deals were approved in Slack first.',y:9,n:3,yl:'Approved in Slack first',nl:'Approved in Salesforce'},why:[{d:'2025',t:'Quarter-end volume made the usual 4-hour wait too costly, so Deal Desk started approving in the thread.',s:'RevOps weekly, Sep 30'}],since:'Oct 1',w:'Written down for the first time, from 9 Slack threads.',src:['9 #deal-desk threads','RevOps weekly, Sep 30'],rel:['Quarter-end close','Deal Desk']});
K('approvals','Flat renewals','Renewals with no price change skip approval, even when they’re over $100,000.',{id:'c7',st:'chk',reason:'No rule explains this',drift:{policy:'Every deal over $100,000 needs approval.',practice:'14 of 14 flat renewals last quarter skipped it.',y:14,n:0,yl:'Skipped approval',nl:'Went through approval'},since:'Oct 27',w:'Noticed in RevOps weekly.',src:['RevOps weekly, Oct 27','14 renewals Asoka watched'],rel:['Maria Okafor'],note:'Asoka doesn’t know why yet. It asked Maria Okafor in RevOps yesterday.'});
/* sales */
K('leads','Territory first','New leads route by territory, then round-robin within the team.',{why:[{d:'2023',t:'Reps were cherry-picking inbound leads, so routing moved to rules.',s:'RevOps retro'}],since:'2023',src:['Lead assignment rules'],rel:['Territories']});
K('leads','Enterprise leads','Leads from companies with 1,000+ employees skip round-robin and go to the named account owner.',{st:'chg',reason:'Changed Sep 3',hist:[{d:'2024',t:'Leads from companies with 2,000+ employees go to the named account owner.',w:'Original rule.'},{d:'Sep 3',t:'Leads from companies with 1,000+ employees skip round-robin and go to the named account owner.',w:'Lowered after mid-market reorg (Jira SF-2190).'}],why:[{d:'Aug 2026',t:'The mid-market team was merged into Enterprise.',s:'Org announcement'}],src:['Lead assignment rules','Jira SF-2190'],rel:['RevOps']});
K('leads','Stale leads','Leads untouched for 2 hours get moved by the SDR manager in #sdr.',{st:'chk',reason:'People do it differently',drift:{policy:'Unworked leads are reassigned automatically after 4 hours.',practice:'22 of the last 30 stale leads were moved by hand within 2 hours.',y:22,n:8,yl:'Moved by hand',nl:'Reassigned automatically'},why:[{d:'2026',t:'The SDR team found 4 hours was losing hot leads.',s:'#sdr thread'}],src:['#sdr threads','Lead history'],rel:['RevOps']});
K('forecast','Thursday commit','Reps update Commit by Thursday at noon. Managers call the number on Friday.',{why:[{d:'2024',t:'Moved from Monday so the board pack has current numbers.',s:'CRO memo'}],src:['Forecast calendar','CRO memo'],rel:['RevOps']});
K('forecast','Commit stages','Deals in Negotiation or later count as Commit.',{why:[{d:'Q3 2025',t:'Commit missed by 18% when earlier stages were included.',s:'Forecast review'}],src:['Forecast category mapping'],rel:['Opportunity approvals']});
K('forecast','60-day rule','Deals stuck for more than 60 days are left out of Commit.',{st:'chk',reason:'Seen once',src:['#sales-leaders, one message'],note:'Asoka is checking the next forecast call to confirm.'});
K('territory','Region, then size','Territories split by region first, then by company size.',{src:['Territory model 2026'],rel:['Lead routing']});
K('territory','January review','Named accounts are reviewed every January.',{src:['Territory model 2026','RevOps calendar']});
K('territory','Mid-year moves','Accounts move mid-year only with VP approval.',{st:'chk',reason:'Seen once',src:['VP Slack message, Jun 2']});
K('partner','Referral fee','Partner deals carry a 10% referral fee, recorded on the opportunity.',{st:'chk',reason:'Seen once',src:['One partner deal, Sep 2026'],rel:['Discount policy']});
/* cpq */
K('discount','10% alone','Reps can discount up to 10% on their own.',{src:['CPQ discount schedule','Sales policy v4'],rel:['Opportunity approvals']});
K('discount','Multi-year bonus','Multi-year deals allow an extra 5% discount.',{st:'chg',reason:'Changed Jan 2026',hist:[{d:'2024',t:'Multi-year deals get no extra discount.',w:'Original policy.'},{d:'Jan 2026',t:'Multi-year deals allow an extra 5% discount.',w:'Added to encourage 3-year terms.'}],why:[{d:'Dec 2025',t:'Finance wanted more 3-year contracts to smooth revenue.',s:'Finance planning'}],src:['CPQ discount schedule','Finance memo, Dec 2025']});
K('discount','Written reason','Any discount over 20% needs a written reason on the quote.',{src:['Validation rule Discount_Requires_Reason'],rel:['Opportunity approvals']});
K('quotes','30-day quotes','Quotes expire after 30 days.',{src:['Quote template settings']});
K('quotes','Legal templates','Only Legal-approved templates can be sent to customers.',{src:['Template library','Legal policy']});
K('quotes','Drive first','Sales engineers draft template changes in Google Drive before CPQ.',{st:'chk',reason:'People do it differently',drift:{policy:'Templates are edited only in CPQ.',practice:'7 of the last 9 template changes started in Google Drive.',y:7,n:2,yl:'Started in Google Drive',nl:'Edited in CPQ'},src:['Drive activity','CPQ template history']});
K('bundles','Analytics included','The Platform bundle includes Analytics at no extra cost.',{src:['Price book 2026']});
K('bundles','No line discounts','Bundles can’t be discounted line by line.',{src:['CPQ bundle rules']});
K('bundles','90-day add-ons','Add-ons bought within 90 days of a bundle get bundle pricing.',{st:'chk',reason:'Seen once',src:['One quote, Aug 2026']});
/* service */
K('escal','P1 pages on-call','Priority 1 cases page the on-call engineer within 15 minutes.',{src:['Escalation rules','PagerDuty']});
K('escal','CSM direct','Enterprise customers can escalate directly to their CSM.',{src:['Support policy']});
K('escal','Data loss','Cases that mention data loss get escalated, whatever their priority.',{st:'chk',reason:'People do it differently',drift:{policy:'Only P1 cases escalate automatically.',practice:'11 of 11 data-loss cases were escalated by hand.',y:11,n:0,yl:'Escalated by hand',nl:'Not escalated'},src:['Case history','#support-leads']});
K('sla','1-hour enterprise','Enterprise customers get a first response within 1 hour, around the clock.',{src:['Entitlement process','Enterprise contract template']});
K('sla','Next-day standard','Standard customers get a first response within 1 business day.',{src:['Entitlement process']});
K('sla','Clock pauses','The SLA clock pauses while waiting on the customer.',{src:['Milestone settings']});
K('queues','Product + language','Cases route by product, then language.',{src:['Omni-channel routing']});
K('queues','Montreal nights','French cases go to the Montreal queue overnight.',{st:'chk',reason:'Seen once',src:['One case reassignment, Sep 2026']});
/* integrations */
K('cpqsync','5-minute sync','Approved discounts sync to CPQ within 5 minutes.',{src:['Integration logs'],rel:['Opportunity approvals']});
K('cpqsync','Multi-currency fails','Multi-currency quotes have failed to sync since Oct 29.',{st:'chk',reason:'Failing now',src:['Integration error logs','Jira INT-412'],note:'Asoka asked Ben Ito in Integrations why.',rel:['Quote templates']});
K('nsync','Overnight orders','Closed Won deals create a NetSuite order overnight.',{src:['Integration schedule']});
K('nsync','$1M review','Orders over $1M wait for Finance review before syncing.',{st:'chk',reason:'Seen once',src:['One held order, Aug 2026']});
/* policies */
K('qclose','5 pm deadline','Deals must be Closed Won by 5 pm Pacific on the last day of the quarter.',{src:['Finance close calendar']});
K('qclose','Slack approvals','During close, Deal Desk approves large deals in Slack first.',{st:'chk',reason:'People do it differently',src:['9 #deal-desk threads'],rel:['Opportunity approvals','Deal Desk']});
K('retention','7-year cases','Closed support cases are deleted after 7 years.',{src:['Data retention policy']});
K('retention','2-year leads','Leads with no activity are archived after 2 years.',{src:['Data retention policy','Archive job']});
/* people */
K('dealdesk','4-hour replies','Deal Desk replies to approval requests within 4 hours on weekdays.',{src:['212 approvals Asoka watched'],rel:['Opportunity approvals']});
K('dealdesk','Priya leads','Priya Shah leads Deal Desk.',{st:'chg',reason:'Changed Oct 12',hist:[{d:'2024',t:'Jordan Wu leads Deal Desk.',w:'Org chart.'},{d:'Oct 12',t:'Priya Shah leads Deal Desk.',w:'Jordan moved to Partnerships. Seen in the org chart and #announcements.'}],src:['Org chart','#announcements']});
K('revops','Maria owns it','Maria Okafor owns approvals, lead routing, and forecasting.',{src:['RevOps charter'],rel:['Opportunity approvals','Lead routing','Forecasting']});
K('revops','Biweekly reviews','Process changes are reviewed every other Tuesday.',{src:['RevOps calendar']});

export const PEEK: Record<string, [string, string]> = {'Large Deal Approval':['Automation','The approval process itself. It locks the record and routes it. 212 approvals ran through it this quarter.'],'Finance':['Team','Joins as a second approver above 20%.'],'CRO':['Person','Marcus Lee. Approves directly above 35%.'],'Sofia, EMEA director':['Person','Sofia Brandt. Reported to approve EMEA deals first. Seen once.'],'Amount lock rule':['Automation','Validation rule. After approval, only Deal Desk can change the amount.'],'Maria Okafor':['Person','Owns approvals, lead routing, and forecasting, in RevOps.']}

export type Answer = { lead?: string; note?: string; ids: string[]; open?: string; blast?: boolean; unknown?: boolean; local?: boolean; src?: 'local' | 'asoka'; pending?: boolean; up?: boolean }
/** Curated answers for the demo questions. */
export const CUR: [RegExp, Answer][] = [
 [/who approves|approv.*discount/,{lead:'The sales manager and Finance. Over 35%, the CRO approves directly.',note:'If it’s an EMEA deal, Sofia may approve first, but Asoka has seen that only once.',ids:['c2','c3']}],
 [/expire|14 days|two weeks/,{lead:'To keep pricing current. In 2024, two deals closed on six-week-old prices and cost about $90,000 in margin.',ids:['c4']}],
 [/work around|bypass|differently|workaround|in practice/,{lead:'In several places. Quarter-end deals get approved in Slack first, flat renewals skip approval, and stale leads get moved by hand.',note:'Nobody wrote these down. Asoka saw them happen.',ids:['c6','c7','leads3']}],
 [/break|depend|impact|change approvals/,{lead:'Seven things depend on the approval process, and one is already failing: CPQ quote sync.',ids:['c1','cpqsync2'],blast:true}]
]

export const SUG: string[] = ['Who approves a 30% discount?','Why do approvals expire after 14 days?','Where do people work around the process?','What breaks if I change approvals?']

export const dom = (id: string) => DOMAINS.find((d) => d.id === id)!
export const proc = (id: string) => PROCS.find((p) => p.id === id)
export const cl = (id: string) => CLAIMS.find((c) => c.id === id)
export const claimsOf = (pid: string) => CLAIMS.filter((c) => c.p === pid)
export const procByName = (n: string) => PROCS.find((p) => p.n === n)
export const dependents = (pid: string) => PROCS.filter((q) => q.deps.includes(pid))
