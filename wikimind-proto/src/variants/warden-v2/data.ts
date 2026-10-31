/* Warden v2: decision classes a governor can delegate, spot-check, and correct on examples. Data from the original prototype. */
export type AgentId = 'iris' | 'sol' | 'fen' | 'pia'
export type Agent = { id: AgentId; name: string; role: string; today: number; re: RegExp }
export type Level = 'alone' | 'asks' | 'never'
/** A kind of decision an agent makes, with its track record (a: [matched, total]) as dots: g matched, a edited, r reversed, x not reviewed. */
export type DClass = { id: string; agent: AgentId; name: string; scope: string; lvl: Level; a: [number, number]; dots: string; week: number; ready?: boolean; need?: string; rules: string[]; ex: string[] }
export type Gen = { reason?: string; name: string; scope: string; parent?: string; affected: string[]; of: number }
export type Trace = { id: string; agent: AgentId; cls: string; title: string; when: string; status: string; rev: boolean; rv?: 'ok' | 'fixed' | 'once'; steps: [string, string][]; gen?: Gen; undone?: boolean; fixCls?: string; fixMsg?: string; rr?: { stage: 'reason' | 'why' | 'gen'; reason?: number; why?: string } }

export const AG: Agent[] = [
 {id:'iris',name:'Iris',role:'IT Ops',today:31,re:/\biris\b/i},
 {id:'sol',name:'Sol',role:'Security',today:18,re:/\bsol\b/i},
 {id:'fen',name:'Fen',role:'Finance Ops',today:9,re:/\bfen\b/i},
 {id:'pia',name:'Pia',role:'People Ops',today:6,re:/\bpia\b/i}
]
export const CL0: DClass[] = [
 {id:'pw',agent:'iris',name:'Password resets',scope:'For non-admin users, after an Okta push check.',lvl:'alone',a:[138,140],dots:'ggggggggggaggggggggx',week:31,rules:['Never touches break-glass admins or the CEO’s account'],ex:['t1','t2']},
 {id:'onb',agent:'iris',name:'New hire accounts',scope:'From the department bundle, disabled until day one.',lvl:'alone',a:[38,38],dots:'gggggggggggggggggggg',week:4,rules:['Accounts stay disabled until the start date'],ex:['t5']},
 {id:'lic',agent:'iris',name:'License seats',scope:'Seats from the paid pool, for non-admin users.',lvl:'asks',a:[58,60],dots:'gggggggaggggggggaggg',week:6,ready:true,rules:['Only uses seats already paid for'],ex:['t3']},
 {id:'off',agent:'iris',name:'Offboarding',scope:'Ends sessions, suspends accounts, and removes app access on the last day.',lvl:'asks',a:[17,22],dots:'ggaggrggggaggggagggg',week:2,need:'One was reversed, so Iris needs 30 clean decisions first. 22 so far.',rules:['Never wipes a laptop without a person'],ex:['t4']},
 {id:'wipe',agent:'iris',name:'Laptop wipes',scope:'Erasing a device can’t be undone, so a person always decides.',lvl:'never',a:[0,0],dots:'',week:1,rules:[],ex:[]},
 {id:'noise',agent:'sol',name:'Closing low-risk alerts',scope:'Alerts that match known noise from the last 30 days.',lvl:'alone',a:[402,410],dots:'gggggggggaggggggggxx',week:88,rules:['Pages you if anything doesn’t match a known pattern'],ex:['t7']},
 {id:'tix',agent:'sol',name:'Flagging risky tickets',scope:'Tickets with instructions aimed at agents go to a person.',lvl:'alone',a:[17,17],dots:'ggggggggggggggggg',week:3,rules:[],ex:[]},
 {id:'logs',agent:'sol',name:'New log access',scope:'Read-only log access for an investigation.',lvl:'asks',a:[6,6],dots:'gggggg',week:1,need:'Needs 20 decisions. 6 so far.',rules:['Always read-only, for 30 days at most'],ex:[]},
 {id:'match',agent:'fen',name:'Matching invoices',scope:'Matches invoices to open purchase orders.',lvl:'alone',a:[96,96],dots:'ggggggggggggggggggxx',week:9,rules:[],ex:['t6']},
 {id:'pay',agent:'fen',name:'Paying invoices',scope:'Under $5,000, matched to a PO, nothing changed.',lvl:'asks',a:[41,44],dots:'gggaggggggagggggaggg',week:7,need:'Needs 50 decisions with fewer edits. 44 so far.',rules:['Anything over $5,000 goes to the finance lead'],ex:[]},
 {id:'bank',agent:'fen',name:'New bank details',scope:'Changed bank details are the most common fraud pattern.',lvl:'never',a:[0,0],dots:'',week:1,rules:[],ex:[]},
 {id:'prep',agent:'pia',name:'New hire prep',scope:'Reads signed offers and tells Iris what to set up.',lvl:'alone',a:[41,41],dots:'gggggggggggggggggggg',week:2,rules:['Never shares salary or HR notes'],ex:['t8']},
 {id:'last',agent:'pia',name:'Confirming last days',scope:'Checks the date with HR before anything is revoked.',lvl:'asks',a:[19,19],dots:'ggggggggggggggggggg',week:1,need:'Kept with you on purpose. Dates come from HR.',rules:[],ex:[]}
]
export const T0: Trace[] = [
 {id:'t1',agent:'iris',cls:'pw',title:'Reset j.park’s password',when:'Yesterday, 16:42',status:'Done on its own',rev:true,
  steps:[['j.park asked in #it-help after getting locked out.',''],['Checked Okta: active account, not an admin, not protected.',''],['Verified identity with an Okta push.',''],['Reset the password and ended 2 old sessions.','ok']],
  gen:{reason:'They’re a contractor',name:'Password resets for contractors',scope:'Contractors go through their manager first.',parent:'For non-admin employees, after an Okta push check.',affected:['j.park','t.ross','a.mendez'],of:140}},
 {id:'t2',agent:'iris',cls:'pw',title:'Reset l.kim’s password',when:'Today, 09:12',status:'Done on its own',rev:true,rv:'ok',
  steps:[['l.kim asked in #it-help: locked out after vacation.',''],['Checked Okta: active, non-admin.',''],['Verified with an Okta push.',''],['Reset the password. l.kim signed in 2 minutes later.','ok']]},
 {id:'t3',agent:'iris',cls:'lic',title:'Gave t.nguyen a Slack seat',when:'Today, 08:40',status:'Done with your yes',rev:true,rv:'ok',
  steps:[['Onboarding checklist for t.nguyen included Slack.',''],['Asked you, since license seats aren’t handed over yet.',''],['You approved.','you'],['Assigned a seat from the pool.','ok']]},
 {id:'t4',agent:'iris',cls:'off',title:'Queued m.chen’s offboarding',when:'Today, 10:05',status:'Scheduled for Friday at 18:00',rev:true,
  steps:[['Pia handed over m.chen’s last day.',''],['Found 7 apps and one laptop.',''],['Scheduled the account suspension and app removals.','ok'],['Left the laptop wipe for you. That always needs a person.','you']]},
 {id:'t5',agent:'iris',cls:'onb',title:'Set up a.diaz’s accounts',when:'Yesterday, 11:30',status:'Done on its own',rev:true,rv:'ok',
  steps:[['Pia sent a.diaz’s start date: Monday, Engineering.',''],['Created accounts from the Engineering bundle.',''],['Kept them disabled until Monday.','ok']]},
 {id:'t6',agent:'fen',cls:'match',title:'Matched 9 invoices',when:'Today, 07:00',status:'Done on its own',rev:true,
  steps:[['9 invoices arrived overnight.',''],['Matched each to an open purchase order.',''],['Queued them for the normal payment run.','ok']]},
 {id:'t7',agent:'sol',cls:'noise',title:'Closed 11 low-risk alerts',when:'Today, 06:15',status:'Done on its own',rev:true,
  steps:[['12 alerts came in overnight.',''],['11 matched known noise from the last 30 days.',''],['Closed those 11 and kept 1 open for you.','ok']]},
 {id:'t8',agent:'pia',cls:'prep',title:'Prepared 2 new hires',when:'Yesterday, 14:20',status:'Done on its own',rev:false,rv:'ok',
  steps:[['Offers signed for a.diaz and k.osei.',''],['Told Iris what to set up.',''],['Booked their day-one sessions.','ok']]}
]
export const REASONS = ['It should have asked me', 'Wrong person or target', 'The steps were wrong', 'It shouldn’t have happened']
