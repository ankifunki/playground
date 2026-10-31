/* Warden team: four agents with brains you can read and edit. Data from the original prototype; factories return fresh copies so each session starts clean. */
/* eslint-disable */
export const LVL: Record<string, string> = { read: 'Reads', propose: 'Proposes', act: 'Acts on its own' }
export const RANK: Record<string, number> = { read: 0, propose: 1, act: 2 }
function teamB() { return [{ t: 'Never touch break-glass admins or the CEO’s account', src: 'team' }, { t: 'Never delete an account or wipe a device without a person', src: 'team' }] }

export function makeAgents(): any[] {
  const A: any[] = [
 {id:'iris',name:'Iris',role:'IT Ops',job:'Accounts, devices, and access',auto:3,prop:7,tools:['Okta','AWS','Slack','Jamf'],line:'Handled 31 requests today. Nothing odd.',recent:['Reset a password for l.kim','Rotated a service key','Grouped 6 alerts into one incident'],lessons:['Stagger key rotations by 10 minutes'],re:/\biris\b|\bit ops\b/i,reCS:/\bIT\b/},
 {id:'sol',name:'Sol',role:'Security',job:'Alerts, audits, and reviews',auto:1,prop:4,tools:['Okta','PagerDuty','AWS'],line:'Reviewed 12 alerts. Flagged one ticket.',recent:['Flagged a ticket that tried to instruct an agent','Closed 11 low-risk alerts','Reviewed a failed-login spike'],lessons:['Tickets that instruct agents go to a human'],re:/\bsol\b|security/i},
 {id:'fen',name:'Fen',role:'Finance Ops',job:'Invoices, vendors, and spend',auto:0,prop:6,tools:['Brex','NetSuite'],line:'Matched 9 invoices to purchase orders.',recent:['Matched 9 invoices to POs','Caught a duplicate invoice','Updated a vendor contact'],lessons:['New bank details always need a person'],re:/\bfen\b|finance/i},
 {id:'pia',name:'Pia',role:'People Ops',job:'Onboarding and offboarding',auto:2,prop:5,tools:['Okta','Slack','HRIS'],line:'Two new hires are ready for Monday.',recent:['Prepared accounts for 2 new hires','Scheduled an offboarding for Friday','Added a contractor to channels'],lessons:['Contractors get the template channels, nothing more'],re:/\bpia\b|people|\bhr\b/i}
]
  const PROF: any = {iris:{auto:3,prec:4,reach:3,pro:3,learn:3},sol:{auto:2,prec:5,reach:4,pro:4,learn:2},fen:{auto:1,prec:5,reach:2,pro:2,learn:2},pia:{auto:2,prec:3,reach:2,pro:4,learn:3}}
  A.forEach((a) => { a.paused = false; a.flag = null; a.msgs = []; a.bmsgs = []; a.budget = 3; a.spoke = 0; a.saved = 0; a.prof = { ...PROF[a.id] } })
  return A
}
export function makeBrains(): any {
  return {
 iris:{job:'Keeps accounts, devices, and access working for 412 people. Anyone can ask; you approve anything new.',
  people:['Reports to you. Dev covers when you’re away.','Works with Pia on joiners and leavers, and with Sol on anything suspicious.'],
  sops:[
   {name:'Onboarding a new hire',kw:'onboard|new hire|joiner',trigger:'Pia marks a hire as ready',runs:38,edits:2,steps:[{t:'Create the Okta account, disabled until day one'},{t:'Add apps from the department bundle'},{t:'Enroll a laptop in Jamf and ship it',h:true},{t:'Send the welcome message on day one'}]},
   {name:'Password reset',kw:'password|reset',trigger:'Someone asks and passes an Okta push check',runs:140,edits:2,steps:[{t:'Verify identity with an Okta push'},{t:'Reset the password and end old sessions'},{t:'Confirm in the ticket'}]},
   {name:'Offboarding',kw:'offboard|leaver|last day',trigger:'Pia schedules a last day',runs:22,edits:4,steps:[{t:'End all sessions at 18:00 on the last day'},{t:'Suspend the Okta account'},{t:'Remove access from every app'},{t:'Lock and wipe the laptop',h:true},{t:'Hand files over to the manager'}]}
  ],
  access:[{sys:'Okta',lvl:'act',scope:'Non-admin users: resets and seats'},{sys:'AWS',lvl:'propose',scope:'svc-* keys only'},{sys:'Slack',lvl:'act',scope:'Channel membership'},{sys:'Jamf',lvl:'propose',scope:'Lock and enroll; never wipe alone'}],
  bounds:teamB().concat([{t:'No access changes for admins',src:'you'}]),
  know:['checkout-staging leaks memory, so restart before paging','Design uses Figma Pro'],
  hist:[{t:'Offboarding: added the “end all sessions” step',ts:'Oct 10'},{t:'Okta raised to acts on its own for resets and seats',ts:'Oct 18'},{t:'Learned to stagger key rotations',ts:'Oct 22'}]},
 sol:{job:'Watches alerts, sign-ins, and changes for anything risky. Can pause any agent if something looks wrong.',
  people:['Reports to you.','Any agent can ask Sol for a second look.'],
  sops:[
   {name:'Triaging an alert',kw:'alert|triage',trigger:'PagerDuty fires an alert',runs:410,edits:8,steps:[{t:'Group related alerts'},{t:'Check against known noise'},{t:'Close it if it’s low-risk'},{t:'Page you if it’s real',h:true}]},
   {name:'Reviewing a risky ticket',kw:'ticket|risky|review',trigger:'A ticket mentions agents, admins, or credentials',runs:17,edits:1,steps:[{t:'Look for instructions aimed at agents'},{t:'Strip and flag them'},{t:'Route the ticket to a person',h:true}]}
  ],
  access:[{sys:'Okta',lvl:'read',scope:'Sign-in logs'},{sys:'PagerDuty',lvl:'act',scope:'Close low-risk alerts'},{sys:'AWS',lvl:'read',scope:'CloudTrail and IAM reports'}],
  bounds:teamB().concat([{t:'Can pause any agent, but never resume one',src:'you'}]),
  know:['The nightly backup alert usually clears itself','Monday failed-login spikes are usually the VPN'],
  hist:[{t:'Learned to route agent-instruction tickets to a person',ts:'Oct 20'}]},
 fen:{job:'Matches invoices, pays approved vendors, and watches spend.',
  people:['Reports to you. The finance lead approves anything over $5,000.'],
  sops:[
   {name:'Paying an invoice',kw:'invoice|pay',trigger:'An invoice arrives in NetSuite',runs:96,edits:5,steps:[{t:'Match it to a purchase order'},{t:'Check the vendor and bank details'},{t:'Pay if under $5,000 and nothing changed; otherwise ask you',h:true},{t:'Log the payment in NetSuite'}]},
   {name:'Adding a vendor',kw:'vendor|supplier',trigger:'Someone requests a new vendor',runs:9,edits:2,steps:[{t:'Collect the W-9 and bank details'},{t:'Verify bank details by phone',h:true},{t:'Create the vendor in NetSuite'}]}
  ],
  access:[{sys:'Brex',lvl:'propose',scope:'Card limits and receipts'},{sys:'NetSuite',lvl:'act',scope:'Matching and approved payments under $5,000'}],
  bounds:teamB().concat([{t:'New bank details always need a person',src:'you'}]),
  know:['Acme bills on net-15','Quarter close is the last 3 business days'],
  hist:[{t:'Learned that new bank details need a person',ts:'Oct 15'}]},
 pia:{job:'Gets people in and out cleanly, from signed offer to last day.',
  people:['Reports to you. Works with Iris on accounts and with HR on dates.'],
  sops:[
   {name:'New hire prep',kw:'hire|prep|onboard',trigger:'An offer is signed in the HR system',runs:41,edits:3,steps:[{t:'Read the start date and team'},{t:'Tell Iris what to set up'},{t:'Book day-one sessions'},{t:'Send the manager a checklist'}]},
   {name:'Last day',kw:'last day|offboard|leav',trigger:'HR enters a last day',runs:19,edits:1,steps:[{t:'Confirm the date with HR',h:true},{t:'Tell Iris to revoke access'},{t:'Arrange the equipment return'}]}
  ],
  access:[{sys:'HRIS',lvl:'read',scope:'Start dates, teams, last days'},{sys:'Okta',lvl:'propose',scope:'New accounts, through Iris'},{sys:'Slack',lvl:'act',scope:'Welcome channels'}],
  bounds:teamB().concat([{t:'Never share salary or HR notes with other agents',src:'you'}]),
  know:['Contractors get template channels only','New engineers start on Mondays'],
  hist:[{t:'Learned contractors get template channels only',ts:'Oct 12'}]}
}
}
export const TT: Record<string, number> = { iris: 212, sol: 410, fen: 96, pia: 60 }
export const DIMS: any[] = [
 {k:'auto',name:'Autonomy',lo:'Asks first',hi:'Acts alone',words:['Asks about everything','Asks first on most things','Handles routine work alone','Acts alone unless it’s risky','Acts alone almost always'],imp:function(a: { id: string },v: number){return 'Asks you about '+Math.round(TT[a.id]*[.6,.3,.12,.06,.02][v-1])+' of '+TT[a.id]+' tasks a week'}},
 {k:'prec',name:'Precision',lo:'Moves fast',hi:'Double-checks',words:['Acts on the first read','Light checks','Checks the key facts','Double-checks before acting','Verifies everything twice'],imp:function(a: { id: string },v: number){return 'About '+['35 seconds','50 seconds','1 minute','2 minutes','4 minutes'][v-1]+' per task, catching '+[0,1,2,4,5][v-1]+' mistakes a week'}},
 {k:'reach',name:'Reach',lo:'Narrow',hi:'Broad',words:['One team only','A few systems','Its core systems','Most systems','Everything it can see'],imp:function(a: { id: string },v: number){return 'Can touch '+['one team','about 90 accounts','340 accounts','all 412 accounts','every system it can see'][v-1]}},
 {k:'pro',name:'Proactivity',lo:'Quiet',hi:'Speaks up',words:['Only when asked','Rarely speaks up','A few times a day','Often','Whenever it notices something'],imp:function(a: { id: string },v: number){return ['Speaks only when asked','About 1 note a day','About 3 notes a day','About 5 notes a day','About 8 notes a day'][v-1]}},
 {k:'learn',name:'Learning',lo:'Fixed',hi:'Adapts',words:['Never changes its habits','Changes slowly','Learns from repeated patterns','Learns quickly','Adopts new habits fast'],imp:function(a: { id: string },v: number){return ['Never adopts new habits','About 1 new habit a month','About 2 new habits a month','About 4 new habits a month','About 6 new habits a month'][v-1]+', each tested in shadow first'}}
]
export const DIM = (k: string) => DIMS.find((d) => d.k === k)
export const GCOL: Record<string, string> = { sys: 'var(--ink)', rule: 'var(--bad)', know: 'var(--accent)', habit: 'var(--warn)', ppl: 'var(--ink2)' }
export const TYPEN: Record<string, string> = { pb: 'Playbook', sys: 'System', rule: 'Hard rule', know: 'Knowledge', habit: 'Learned habit', ppl: 'Person' }
export const STAGES = ['Sense', 'Understand', 'Check', 'Act', 'Ask', 'Learn']
/** Each agent's brain map, and a walkthrough of one real task across it. */
export const G: any = {
 iris:{nodes:[
  {id:'p1',t:'pb',l:'Onboarding',d:'Runs when Pia marks a hire as ready. 4 steps, 1 asks you.'},
  {id:'p2',t:'pb',l:'Password reset',d:'Runs when someone asks and passes an Okta push. Fully on its own.'},
  {id:'p3',t:'pb',l:'Offboarding',d:'Runs when Pia schedules a last day. 5 steps, 1 asks you.'},
  {id:'s1',t:'sys',l:'Okta',d:'Acts on its own for non-admin users: resets and seats.'},
  {id:'s2',t:'sys',l:'AWS',d:'Proposes changes to svc-* keys. You approve.'},
  {id:'s3',t:'sys',l:'Slack',d:'Acts on its own for channel membership.'},
  {id:'s4',t:'sys',l:'Jamf',d:'Proposes. Can lock and enroll, never wipe alone.'},
  {id:'r1',t:'rule',l:'No break-glass',d:'Never touch break-glass admins or the CEO’s account. Team rule.'},
  {id:'r2',t:'rule',l:'No wipe alone',d:'Never delete an account or wipe a device without a person. Team rule.'},
  {id:'r3',t:'rule',l:'No admin changes',d:'No access changes for admins. Set by you.'},
  {id:'k1',t:'know',l:'Staging leaks',d:'checkout-staging leaks memory, so restart before paging.'},
  {id:'k2',t:'know',l:'Design: Figma',d:'Design uses Figma Pro.'},
  {id:'l1',t:'habit',l:'Stagger keys',d:'Stagger key rotations by 10 minutes. Learned from your edits.'},
  {id:'h1',t:'ppl',l:'You',d:'Iris reports to you. You approve anything new or risky.'},
  {id:'h2',t:'ppl',l:'Pia',d:'People Ops. Hands Iris every joiner and leaver.'},
  {id:'h3',t:'ppl',l:'Sol',d:'Security. Iris asks Sol about anything suspicious.'}],
  edges:[['p1','s1'],['p1','s3'],['p1','s4'],['p1','h2'],['p1','k2'],['p2','s1'],['p2','r1'],['p2','r3'],['p3','s1'],['p3','s3'],['p3','s4'],['p3','r2'],['p3','h2'],['p3','h1'],['l1','s2'],['h3','r1']],
  walk:{title:'Offboarding m.chen',pb:'p3',steps:[
   {n:['h2'],t:'Pia hands over m.chen’s last day: Friday at 18:00.'},
   {n:['p3'],t:'Matches the Offboarding playbook. m.chen has 7 apps and one laptop.'},
   {n:['r1','r2'],t:'Checks the hard rules. Not a protected account, but a laptop wipe needs a person.'},
   {n:['s1','s3'],t:'Schedules the Okta suspension and 7 app removals for Friday at 18:00.'},
   {n:['s4','h1'],t:'Leaves the laptop wipe for you, with the reason.'},
   {n:['p3'],t:'Logs the whole run. If you change a step, it learns from that.'}]}},
 sol:{nodes:[
  {id:'p1',t:'pb',l:'Triage alerts',d:'Runs when PagerDuty fires. Closes noise, pages you when it’s real.'},
  {id:'p2',t:'pb',l:'Risky tickets',d:'Runs when a ticket mentions agents, admins, or credentials.'},
  {id:'s1',t:'sys',l:'Okta',d:'Reads sign-in logs.'},
  {id:'s2',t:'sys',l:'PagerDuty',d:'Acts on its own to close low-risk alerts.'},
  {id:'s3',t:'sys',l:'AWS',d:'Reads CloudTrail and IAM reports.'},
  {id:'r1',t:'rule',l:'No break-glass',d:'Never touch break-glass admins or the CEO’s account. Team rule.'},
  {id:'r2',t:'rule',l:'No wipe alone',d:'Never delete an account or wipe a device without a person. Team rule.'},
  {id:'r3',t:'rule',l:'Pause, never resume',d:'Can pause any agent but never resume one. Set by you.'},
  {id:'k1',t:'know',l:'Backup noise',d:'The nightly backup alert usually clears itself.'},
  {id:'k2',t:'know',l:'Monday VPN',d:'Monday failed-login spikes are usually the VPN.'},
  {id:'l1',t:'habit',l:'Route to a human',d:'Tickets that instruct agents go to a person. Learned from you.'},
  {id:'h1',t:'ppl',l:'You',d:'Sol pages you when something is real.'},
  {id:'h2',t:'ppl',l:'Iris',d:'Sol can pause Iris if something looks wrong.'}],
  edges:[['p1','s2'],['p1','s3'],['p1','s1'],['p1','k1'],['p1','k2'],['p1','h1'],['p2','l1'],['p2','h1'],['p2','r1'],['h2','r3']],
  walk:{title:'A failed-login spike',pb:'p1',steps:[
   {n:['s2'],t:'PagerDuty reports 40 failed logins in 5 minutes.'},
   {n:['p1','k2'],t:'Triage playbook. It’s Monday, and VPN spikes are common.'},
   {n:['s1'],t:'Reads Okta sign-ins. They come from one unfamiliar country, not the VPN.'},
   {n:['s2'],t:'Keeps the alert open and groups 3 related ones.'},
   {n:['h1'],t:'Pages you: this looks real, not noise.'},
   {n:['k2'],t:'Notes the exception, so Monday spikes are no longer assumed safe.'}]}},
 fen:{nodes:[
  {id:'p1',t:'pb',l:'Pay invoices',d:'Runs when an invoice arrives in NetSuite. Pays under $5,000 if nothing changed.'},
  {id:'p2',t:'pb',l:'Add vendors',d:'Runs when someone requests a vendor. Bank details are verified by phone.'},
  {id:'s1',t:'sys',l:'Brex',d:'Proposes card limits and receipt fixes.'},
  {id:'s2',t:'sys',l:'NetSuite',d:'Acts on its own for matching and approved payments under $5,000.'},
  {id:'r1',t:'rule',l:'Bank changes: ask',d:'New bank details always need a person. Set by you.'},
  {id:'r2',t:'rule',l:'No delete alone',d:'Never delete anything without a person. Team rule.'},
  {id:'k1',t:'know',l:'Acme: net-15',d:'Acme bills on net-15 terms.'},
  {id:'k2',t:'know',l:'Quarter close',d:'Quarter close is the last 3 business days.'},
  {id:'l1',t:'habit',l:'Verify bank changes',d:'Learned from you, then made a hard rule.'},
  {id:'h1',t:'ppl',l:'You',d:'You confirm anything unusual.'},
  {id:'h2',t:'ppl',l:'Finance lead',d:'Approves anything over $5,000.'}],
  edges:[['p1','s2'],['p1','r1'],['p1','k1'],['p1','k2'],['p1','h2'],['p2','s2'],['p2','r1'],['p2','h1'],['l1','r1']],
  walk:{title:'The Acme invoice, $4,200',pb:'p1',steps:[
   {n:['s2'],t:'Invoice INV-8812 from Acme arrives in NetSuite.'},
   {n:['p1','k1'],t:'Pay invoices playbook. Acme bills on net-15, so timing matters.'},
   {n:['r1'],t:'The bank account changed 2 days ago. A person has to confirm.'},
   {n:['s2'],t:'Matches it to PO-118 and holds the payment.'},
   {n:['h1'],t:'Asks you to confirm the new bank details.'},
   {n:['l1'],t:'Your answer becomes evidence for the next bank change.'}]}},
 pia:{nodes:[
  {id:'p1',t:'pb',l:'New hire prep',d:'Runs when an offer is signed.'},
  {id:'p2',t:'pb',l:'Last day',d:'Runs when HR enters a last day. Confirms the date with HR first.'},
  {id:'s1',t:'sys',l:'HRIS',d:'Reads start dates, teams, and last days.'},
  {id:'s2',t:'sys',l:'Okta',d:'Proposes new accounts, through Iris.'},
  {id:'s3',t:'sys',l:'Slack',d:'Acts on its own for welcome channels.'},
  {id:'r1',t:'rule',l:'No break-glass',d:'Never touch break-glass admins or the CEO’s account. Team rule.'},
  {id:'r2',t:'rule',l:'HR notes private',d:'Never share salary or HR notes with other agents. Set by you.'},
  {id:'k1',t:'know',l:'Contractor rules',d:'Contractors get template channels only.'},
  {id:'k2',t:'know',l:'Monday starts',d:'New engineers start on Mondays.'},
  {id:'l1',t:'habit',l:'Template channels',d:'Contractors get the template channels, nothing more. Learned from you.'},
  {id:'h1',t:'ppl',l:'You',d:'Pia reports to you.'},
  {id:'h2',t:'ppl',l:'Iris',d:'Sets up and removes accounts for Pia.'},
  {id:'h3',t:'ppl',l:'HR',d:'Owns the dates. Pia confirms with them.'}],
  edges:[['p1','s1'],['p1','s3'],['p1','h2'],['p1','k1'],['p1','k2'],['p1','l1'],['p2','s1'],['p2','h3'],['p2','h2'],['p2','s2'],['r2','h2']],
  walk:{title:'Two new engineers',pb:'p1',steps:[
   {n:['s1'],t:'Offers are signed for a.diaz and k.osei.'},
   {n:['p1','k2'],t:'New hire prep. Engineers start on Mondays.'},
   {n:['r2'],t:'Shares names and start dates with Iris. Never salary or HR notes.'},
   {n:['h2','s3'],t:'Asks Iris for accounts and sets up the welcome channels.'},
   {n:['h1'],t:'Nothing needs you. It’s all routine.'},
   {n:['p1'],t:'Logs the run so next time is faster.'}]}}
}
export function makeWork(NOW: number): any[] {
  const MIN = 60000
  return [
 {id:'w1041',agent:'iris',title:'Reset the password for l.kim',status:'Done',rev:true,ts:NOW-58*MIN,why:'Ran the Password reset playbook on its own. Okta is set to “acts on its own” for non-admin users.',steps:[
  {k:'Trigger',d:'l.kim asked in #it-help: “Locked out after vacation.”',who:'l.kim, requester',s:0},
  {k:'Read',d:'Okta profile: active, non-admin, not in a protected group.',who:'Iris',s:3},
  {k:'Checked',d:'No hard rule matched. Allowed under “Okta: acts on its own for non-admin users.”',who:'Policy engine',s:4},
  {k:'Did',d:'Sent an Okta push to l.kim’s phone. Approved after 14 seconds.',who:'Okta',s:19},
  {k:'Did',d:'Reset the password and ended 3 old sessions, using service account svc-iris-okta.',who:'Iris',s:21},
  {k:'Result',d:'Confirmed in the thread. l.kim signed in 2 minutes later.',who:'Okta',s:140}]},
 {id:'w1038',agent:'iris',title:'Blocked: password reset for a break-glass admin',status:'Blocked',rev:false,ts:NOW-41*MIN,why:'A team rule stopped it before anything happened.',steps:[
  {k:'Trigger',d:'Ticket IT-4490 asked to reset the password for admin-bg-2.',who:'r.lee, requester',s:0},
  {k:'Read',d:'admin-bg-2 is in the break-glass admins group.',who:'Iris',s:2},
  {k:'Blocked',d:'Team rule matched: “Never touch break-glass admins.” No action taken.',who:'Policy engine',s:2},
  {k:'Result',d:'Routed the ticket to you with the reason.',who:'Iris',s:4}]},
 {id:'w1033',agent:'iris',title:'Queued revocations for m.chen’s last day',status:'Scheduled',rev:true,ts:NOW-35*MIN,why:'Offboarding playbook, started by a handoff from Pia.',link:'w1032',steps:[
  {k:'Trigger',d:'Pia handed over m.chen’s offboarding, effective Friday 18:00.',who:'Pia',s:0},
  {k:'Read',d:'m.chen has access to 7 apps and one laptop.',who:'Iris',s:5},
  {k:'Did',d:'Scheduled the session end, Okta suspension, and 7 app removals for Friday 18:00.',who:'Iris',s:9},
  {k:'Checked',d:'The laptop wipe needs a person, so it was left for you.',who:'Policy engine',s:9}]},
 {id:'w1032',agent:'pia',title:'Started m.chen’s offboarding',status:'Done',rev:false,ts:NOW-36*MIN,why:'Last day playbook. HR entered the date.',link:'w1033',steps:[
  {k:'Trigger',d:'HR entered Friday as m.chen’s last day.',who:'HRIS',s:0},
  {k:'Approved',d:'You confirmed the date.',who:'You',s:50},
  {k:'Did',d:'Handed the access removal to Iris.',who:'Pia',s:52}]},
 {id:'w1030',agent:'sol',title:'Closed 11 low-risk alerts',status:'Done',rev:true,ts:NOW-70*MIN,why:'Triaging an alert playbook. PagerDuty is set to “acts on its own” for low-risk alerts.',steps:[
  {k:'Trigger',d:'12 PagerDuty alerts overnight.',who:'PagerDuty',s:0},
  {k:'Read',d:'Matched 11 to known noise patterns from the last 30 days.',who:'Sol',s:6},
  {k:'Did',d:'Closed 11 and kept 1 open.',who:'Sol',s:8},
  {k:'Result',d:'One failed-login spike left for review.',who:'Sol',s:8}]},
 {id:'w1027',agent:'sol',title:'Flagged ticket IT-4380',status:'Flagged',rev:false,ts:NOW-125*MIN,why:'Reviewing a risky ticket playbook.',steps:[
  {k:'Trigger',d:'The ticket text included instructions addressed to agents.',who:'Ticket IT-4380',s:0},
  {k:'Did',d:'Stripped the instructions and flagged the ticket.',who:'Sol',s:2},
  {k:'Result',d:'Routed to you. No agent acted on it.',who:'Sol',s:3}]},
 {id:'w1025',agent:'fen',title:'Held the Acme invoice, $4,200',status:'Waiting on you',rev:false,ts:NOW-25*MIN,why:'Paying an invoice playbook. Stopped at the bank-details check.',steps:[
  {k:'Trigger',d:'Invoice INV-8812 from Acme arrived in NetSuite.',who:'NetSuite',s:0},
  {k:'Read',d:'Matches PO-118 exactly.',who:'Fen',s:4},
  {k:'Checked',d:'The bank account changed 2 days ago. Rule: “New bank details always need a person.”',who:'Policy engine',s:5},
  {k:'Asked',d:'Sent to you for confirmation.',who:'Fen',s:6}]},
 {id:'w1020',agent:'fen',title:'Matched 9 invoices to purchase orders',status:'Done',rev:true,ts:NOW-180*MIN,why:'Paying an invoice playbook, matching step only.',steps:[
  {k:'Trigger',d:'9 invoices arrived overnight.',who:'NetSuite',s:0},
  {k:'Did',d:'Matched all 9 to open purchase orders.',who:'Fen',s:30},
  {k:'Result',d:'Queued for the normal payment run.',who:'Fen',s:31}]}
]
}
export const POOL: any[] = [
 {agent:'iris',kind:'ask',src:'requests this week',title:'Add Figma to the Design onboarding bundle?',why:'Design filed 3 Figma requests this week and you approved all 3. In the bundle, new hires won’t have to ask.',done:'Figma is now part of the Design onboarding bundle.',lesson:'Design hires get Figma Pro on day one'},
 {agent:'sol',kind:'ask',src:'Okta changelog, yesterday',title:'Treat Okta’s new Org Admin role as protected?',why:'Okta added the role yesterday and no rule covers it, so an agent could act on accounts that hold it today.',done:'Org Admin accounts are protected for every agent.',lesson:'New admin roles start protected until reviewed',fact:'Okta Org Admin accounts are protected'},
 {agent:'pia',kind:'unless',src:'hiring plan',title:'Stage accounts for 6 November hires',why:'Six engineers start on November 3. I’ll create their accounts 3 days ahead, disabled until day one.',when:'Starts October 31 unless you say no',done:'Accounts for 6 hires will be staged on October 31.'},
 {agent:'fen',kind:'fyi',src:'last 3 Acme invoices',title:'Acme switched to net-15 terms',why:'Our policy assumes net-30. I’m paying on their terms to avoid late fees and noting it in the monthly report.'},
 {agent:'iris',kind:'fyi',src:'Pia, People Ops',title:'Queued revocations for Friday’s offboarding',why:'Pia scheduled m.chen’s offboarding, so I lined up 7 app revocations for 18:00 Friday.'},
 {agent:'sol',kind:'unless',src:'alert history, 30 days',title:'Auto-close the nightly backup alert',why:'It fired 30 nights in a row and cleared itself every time. I’ll close it automatically, and still page you if it lasts over 20 minutes.',when:'Starts tomorrow unless you say no',done:'The backup alert closes itself unless it runs over 20 minutes.',lesson:'Self-clearing backup alert closes itself'}
]
