import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './Icon'
import { Ag, Asoka, Block, LiveNum, LivePulse, useTraceTarget } from './Live'
import { useW } from './store'
import { Toc, type TocItem } from './Toc'
import md from './approval-tiers.md?raw'

/*
 * Approval tiers and the privilege surface: an org-context Markdown file (approval-tiers.md, kept beside this
 * component) mapped onto the Wikimind 9 page. Same facts, new form: properties for the front matter, trust marked
 * only where the source flags it (the approver list is from the KB and not re-checked; the roster is verified live),
 * the two gates as a sequence, the privilege surface as numbers and ranked findings, the open question and the caveat
 * as callouts. Page / Markdown switches to the source file, to compare the two.
 *
 * Alive and agentic (scripted, nothing leaves the browser): Asoka does the work and people approve; the reader only
 * watches, or nudges a person. The live line says what Asoka is doing on this page. It asks Dale Whitaker who owns
 * data quality and rewrites the row when he answers (Confidence moves from KB to confirmed); it re-checks the roster
 * on its own; a Salesforce change moves a machine identity off admin; a dashboard access request works through the
 * two steps; and each High finding carries Asoka's own fix, moving through the two gates with their named approvers
 * (the machine-identity fix is signed off and applied; the vendor fix waits on Lena, with Remind in Slack). Every
 * event is logged in Live activity.
 */

const SECTIONS: TocItem[] = [
  { id: 't-who', t: 'Who signs off' },
  { id: 't-gates', t: 'Two gates' },
  { id: 't-priv', t: 'Privilege surface' },
  { id: 't-access', t: 'Access requests' },
  { id: 't-skew', t: 'Data caveat' },
  { id: 't-rel', t: 'Related pages' },
]

const APPROVERS: { d: string; who: string; flag?: string }[] = [
  { d: 'Deal Desk (Order Form), Gate 2', who: 'Tomas Lindqvist, Priya Raghunathan, Nadia Okonjo (primary) + Freya Alderton, Harold Chen (Finance backup)' },
  { d: 'Forecast / stage policy', who: 'Dale Whitaker (VP GTM Ops): policy owner, light hands-on' },
  { d: 'Security / sharing / connected apps / login guardrails', who: 'Adaeze Nwosu (implements) + Lena Marchetti (VP Compliance, approves)' },
  { d: 'Data quality / integration normalisation', who: 'Listed as “Sasha Merrill”', flag: 'An integration seat, not a person' },
  { d: 'Renewals policy / grace periods', who: 'Curtis Aldana + Rosalind Achebe (Director of Renewals) + Ingrid Solheim (VP CS)' },
  { d: 'Implementation stack', who: 'Marcus Oyelaran (Director Impl Services), Delphine Roux (Sr Director Integration Services)' },
  { d: 'Contract terms', who: 'Vivian Castellanos (General Counsel)' },
  { d: 'Renewal-enforcement exceptions', who: 'CS/AM leadership, with RevOps + Finance tagged' },
  { d: 'Segmentation decisions', who: 'Anders Kilbride (resolved all six open questions, 2026-08-05)' },
]

const FINDINGS: { id: string; sev: 'high' | 'med' | 'ok'; t: string; d: string; fix?: string }[] = [
  { id: 'ti-f-machine', sev: 'high', t: '7 machine identities on full System Administrator', d: 'The biggest exposure. Each burns a full Salesforce seat in a licence-saturated org.', fix: 'Move them to an integration licence + API-only profile: recovers ~7 seats and takes them off admin.' },
  { id: 'ti-f-vendor', sev: 'high', t: 'A vendor permission set with ViewAllData + ModifyAllData + ViewSetup', d: 'Assigned to a CS-platform integration user run by an external vendor: unrestricted read and write on every object, hidden behind a read-only-looking, API-only profile.', fix: 'Scope it to the objects the vendor needs.' },
  { id: 'ti-f-profile', sev: 'med', t: 'Powerful permissions are granted by profile, not permission set', d: 'Only one powerful permission set has a live assignee (the vendor one); the other six have none. ModifyAllData, ViewAllData, ManageUsers and AuthorApex come from profiles, so a permission-set audit alone misses them.' },
  { id: 'ti-f-integ', sev: 'ok', t: 'The integration permission set is the right posture', d: 'Correctly scoped, 9 assignees. It is not the answer to a “give me full access” request.' },
]
const OVER = ['The Security lead on the CEO role', 'A duplicate standard-user account for an executive', 'A Marketing user on System Administrator', 'The COO on the CEO role', 'One AE on a role that looks wrong']
const RELATED: { t: string; d: string }[] = [
  { t: 'Clarification and routing rules', d: 'When to confirm before acting' },
  { t: 'Integration identities', d: 'Machine users and the seats they hold' },
  { t: 'People, routing and territory', d: 'Who owns what, and how work is routed' },
  { t: 'Pricing review and quote approvals', d: 'Gate 2 and the Order Form' },
  { t: 'Policies and ownership', d: 'Where the access-model gap is catalogued' },
  { t: 'Churn', d: 'The four inputs the business gate affirms' },
]

/**
 * Why confidence is "mixed": one bar per statement on this page, by where it came from. Counted from the page itself:
 * verified live = the privilege surface (3 counts, 4 findings, 5 over-grants) and the audit-trail caveat; from the KB =
 * the 9 approver rows; written by hand = the 2 gates, their 3 rules and the 2 dashboard steps; open = the missing
 * access model and the sharing policy. Each legend item jumps to its section.
 */
function Confidence({ confirmed, decided = 0 }: { confirmed: number; decided?: number }) {
  const CONF = [
    { k: 'live', t: 'Verified live', n: 13, to: 't-priv' },
    ...(confirmed + decided ? [{ k: 'person', t: 'Confirmed by a person', n: confirmed + decided, to: 't-who' }] : []),
    { k: 'kb', t: 'From the KB, not re-checked', n: 9 - confirmed, to: 't-who' },
    { k: 'manual', t: 'Written by hand', n: 7, to: 't-gates' },
    ...(2 - decided ? [{ k: 'open', t: 'Open', n: 2 - decided, to: 't-access' }] : []),
  ]
  const total = CONF.reduce((s, c) => s + c.n, 0)
  const pct = (n: number) => Math.round((n / total) * 100)
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <div className="ti-conf">
      <span className="ti-conf-h"><b>{pct(CONF[0].n)}%</b> verified live<span className="props-m">of {total} statements · mixed</span></span>
      <span className="ti-conf-bars" role="img" aria-label={CONF.map((c) => `${c.t} ${c.n}`).join(', ')}>
        {CONF.flatMap((c) => Array.from({ length: c.n }, (_, i) => <i key={c.k + i} className={'c-' + c.k} />))}
      </span>
      <span className="ti-conf-l">{CONF.map((c) => <button key={c.k} className={'c-' + c.k} onClick={() => go(c.to)}>{c.t} {pct(c.n)}%</button>)}</span>
    </div>
  )
}

function Mark({ tone, icon, children }: { tone: 'ok' | 'warn' | 'open'; icon: IconName; children: React.ReactNode }) {
  return <span className={'ti-mark ' + tone}><Icon name={icon} size={12} />{children}</span>
}

type Req = 0 | 1 | 2 | 3
/** A fix moves through the page's own two gates: gate 1 (Lena Marchetti signs off the plan) → gate 2 (Adaeze Nwosu approves the write) → applied. */
type Fix = 'gate1' | 'gate2' | 'applying' | 'done'
const PLAN: Record<string, { title: string; lines: (machine: number) => string[]; done: (machine: number) => string; asked: string }> = {
  'ti-f-machine': {
    title: 'Move the machine identities off System Administrator', asked: '40 min ago',
    lines: (m) => [`${m} integration users move to an integration licence and an API-only profile`, `Each keeps only the objects its integration reads and writes`, `Frees ${m} full Salesforce seats; admin drops to 12 people`],
    done: (m) => `${m} machine identities moved off admin · ${m} seats recovered`,
  },
  'ti-f-vendor': {
    title: 'Scope the vendor permission set', asked: '2 h ago',
    lines: () => ['Remove ViewAllData, ModifyAllData and ViewSetup', 'Grant object permissions only for what the CS-platform sync reads and writes', 'The vendor’s integration user keeps working; nothing else changes'],
    done: () => 'Vendor permission set scoped to its objects · no live powerful permission sets',
  },
}

/**
 * Waiting on a person: one pattern for everything Asoka drafted that a person has to approve or decide. A type label
 * (Fix · needs sign-off, or Decision · needs a rule), the ask, what Asoka drafted, who decides, and the status; fixes
 * also show their two gates. The reminder lives once, at the top of the page, per person.
 */
function Waiting({ wid, kind, head, fields, steps, status, done, doneHead, doneNote }: {
  wid: string; kind: 'fix' | 'decision'; head: React.ReactNode; fields: { k: string; v: React.ReactNode }[]
  steps?: { st: 'done' | 'now' | ''; t: string }[]; status: React.ReactNode; done: boolean; doneHead: React.ReactNode; doneNote: React.ReactNode
}) {
  if (done) return (
    <div id={wid} className="ti-w done">
      <span className="ti-w-k ok"><Icon name="circle-check" size={14} />{kind === 'fix' ? 'Fix · applied' : 'Rule · decided by Lena Marchetti just now'}</span>
      <p className="ti-w-h">{doneHead}</p>
      {doneNote}
    </div>
  )
  return (
    <div id={wid} className="ti-w">
      <span className="ti-w-k"><Icon name={kind === 'fix' ? 'workflow' : 'circle-help'} size={14} />{kind === 'fix' ? 'Fix · needs sign-off' : 'Decision · needs a rule'}</span>
      <p className="ti-w-h">{head}</p>
      <dl className="ti-w-f">{fields.map((f) => <div key={f.k}><dt className="tk">{f.k}</dt><dd>{f.v}</dd></div>)}</dl>
      {steps && <ol className="ti-plan-g">{steps.map((x) => <li key={x.t} className={x.st}><span className="cx-ck" aria-hidden="true">{x.st === 'done' ? <Icon name="check" size={12} /> : x.st === 'now' ? <i /> : null}</span>{x.t}</li>)}</ol>}
      <div className="ti-w-s">{status}</div>
    </div>
  )
}
const ago = (reminded: boolean, t: string) => (reminded ? 'reminded just now' : `asked ${t}`)

export function Tiers() {
  const w = useW(), [view, setView] = useState<'page' | 'md'>('page'), sasha = useTraceTarget('ti-sasha')
  // The page's live state: a re-check, a question to a person, a Salesforce change, an access request, and what waits on Lena.
  const [check, setCheck] = useState<'idle' | 'checking' | 'done'>('idle'), [ask, setAsk] = useState<'idle' | 'asking' | 'answered'>('idle')
  const [moved, setMoved] = useState(false), [writing, setWriting] = useState(false), [req, setReq] = useState<Req>(0)
  const [fix, setFix] = useState<Record<string, Fix>>({ 'ti-f-machine': 'gate1', 'ti-f-vendor': 'gate1' }), [fixedN, setFixedN] = useState(0)
  const [share, setShare] = useState<'open' | 'decided'>('open'), [reminded, setReminded] = useState(false)
  const timers = useRef<number[]>([]), movedRef = useRef(false), fixRef = useRef(fix), shareRef = useRef(share)
  movedRef.current = moved; fixRef.current = fix; shareRef.current = share
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)) }
  const log = (t: string, kind: 'edit' | 'read' | 'ask' | 'verify', who?: string) => w.log({ ag: who ? 'person' : 'security', who, t, page: 'approval-tiers', kind })
  const step = (id: string, f: Fix) => setFix((x) => ({ ...x, [id]: f }))
  // Lena signs off a fix (gate 1); Asoka asks Adaeze (gate 2); she approves; Asoka applies it.
  const signFix = (id: string) => {
    if (fixRef.current[id] !== 'gate1') return
    const t = PLAN[id].title
    step(id, 'gate2'); fixRef.current = { ...fixRef.current, [id]: 'gate2' }
    log(`Signed off the plan: ${t}`, 'verify', 'Lena Marchetti'); log('Asked Adaeze Nwosu to approve the write (gate 2)', 'ask')
    later(3000, () => { step(id, 'applying'); log(`Approved the write: ${t}`, 'verify', 'Adaeze Nwosu') })
    later(5000, () => { const m = movedRef.current ? 6 : 7; if (id === 'ti-f-machine') setFixedN(m); step(id, 'done'); log(`Applied: ${PLAN[id].done(m)}`, 'edit') })
  }
  const decideShare = () => {
    if (shareRef.current === 'decided') return
    setShare('decided'); shareRef.current = 'decided'
    log('Decided report and dashboard sharing: within the sales hierarchy by default; wider sharing needs the report owner’s VP', 'verify', 'Lena Marchetti')
    log('Added the sharing rule to Approval tiers and routed the 2 waiting requests under it', 'edit')
  }
  useEffect(() => {
    later(2500, () => { setAsk('asking'); log('Asked Dale Whitaker who owns data quality, since “Sasha Merrill” is an integration seat', 'ask') })
    later(5000, () => { setReq(1); log('Got a request: a Sales Ops analyst needs the Pipeline Health dashboard', 'read') })
    later(7000, () => { setReq(2); log('Assigned the dashboard permission set; asked Adaeze Nwosu to approve the connected app', 'edit') })
    later(8500, () => { setAsk('answered'); log('Answered: Delphine Roux owns data quality and integration normalisation', 'ask', 'Dale Whitaker') })
    later(10000, () => setCheck('checking'))
    later(12000, () => { setReq(3); log('Approved the connected app: Pipeline Health access works', 'verify', 'Adaeze Nwosu') })
    later(12600, () => { setCheck('done'); log(`Re-checked the privilege surface against Salesforce: ${movedRef.current ? 'matches the latest change' : 'no change since the last read'}`, 'verify') })
    later(16000, () => { setWriting(true); log('Saw a machine identity move off System Administrator in Salesforce', 'read') })
    later(18500, () => { setMoved(true); setWriting(false); log('Rewrote the privilege surface: 18 admin seats, 6 machine identities, 107 of 109 licences', 'edit') })
    // Left alone, Lena gets to the machine-identity fix at ~21 s and the sharing decision at ~34 s; the vendor fix waits.
    later(21000, () => signFix('ti-f-machine'))
    later(34000, decideShare)
    return () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Everything that waits on Lena, for the summary at the top and its one reminder.
  const onLena = [
    ...(fix['ti-f-machine'] === 'gate1' ? [{ id: 'w-ti-f-machine', t: 'Sign off: move the machine identities off admin' }] : []),
    ...(fix['ti-f-vendor'] === 'gate1' ? [{ id: 'w-ti-f-vendor', t: 'Sign off: scope the vendor permission set' }] : []),
    ...(share === 'open' ? [{ id: 'w-ti-sharing', t: 'Decide: who may see reports beyond the sales hierarchy' }] : []),
  ]
  const remindLena = () => {
    setReminded(true)
    log(`Reminded Lena Marchetti in Slack: ${onLena.length} ${onLena.length === 1 ? 'item waits' : 'items wait'} on her (${onLena.map((x) => x.t.split(':')[0].toLowerCase()).join(', ')})`, 'ask')
    // A reminder brings her answers: each fix she still owes is signed off, then the decision.
    let d = 3000
    ;(['ti-f-machine', 'ti-f-vendor'] as const).forEach((id) => { if (fixRef.current[id] === 'gate1') { later(d, () => signFix(id)); d += 1200 } })
    if (shareRef.current === 'open') later(d + 800, decideShare)
  }
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const machineNow = moved ? 6 : 7
  const done = (id: string) => fix[id] === 'done'
  const machine = done('ti-f-machine') ? 0 : machineNow
  const fixSteps = (id: string) => {
    const at = ['gate1', 'gate2', 'applying', 'done'].indexOf(fix[id])
    const st = (i: number): 'done' | 'now' | '' => (at > i ? 'done' : at === i ? 'now' : '')
    return [
      { st: st(0), t: at > 0 ? 'Gate 1 · signed off by Lena Marchetti' : 'Gate 1 · Lena Marchetti signs off the plan' },
      { st: st(1), t: at > 1 ? 'Gate 2 · approved by Adaeze Nwosu' : 'Gate 2 · Adaeze Nwosu approves the write' },
      { st: st(2), t: at > 2 ? 'Applied, each record logged' : 'Asoka applies the change and logs each record' },
    ]
  }
  const fixStatus = (id: string) => fix[id] === 'gate1' ? <span className="ti-asking"><LivePulse />Waiting on Lena Marchetti · {ago(reminded, PLAN[id].asked)}</span>
    : fix[id] === 'gate2' ? <span className="ti-asking"><LivePulse />Waiting on Adaeze Nwosu · asked just now</span>
      : <span className="ti-asking"><LivePulse />Asoka is applying the change</span>
  const admin = 12 + machine, lic = (moved ? 107 : 108) - fixedN
  const now = check === 'checking' ? { s: 'reading' as const, t: <>Re-checking the roster against Salesforce</> }
    : writing ? { s: 'writing' as const, t: <>Rewriting <b>Privilege surface</b>: a machine identity left System Administrator</> }
      : ask === 'asking' ? { s: 'asking' as const, t: <>Asking Dale Whitaker who owns data quality</> }
        : req === 1 || req === 2 ? { s: 'thinking' as const, t: <>Routing a dashboard access request</> }
          : { s: 'idle' as const, t: <>Watching profiles, permission sets and licences for changes</> }
  const fresh = check === 'done' || moved
  return (
    <article className="doc ti">
      <h1>Approval tiers and the privilege surface</h1>
      <p className="byline">Kept by <Ag id="security" name /></p>
      <p className="liveln"><Asoka size={20} state={now.s} /><span key={now.s} className="ti-now">{now.t}</span>{w.proof && now.s === 'idle' && <span className="ti-hint"> · hover any line to see where it came from</span>}</p>
      <div className="ti-view" role="tablist" aria-label="View">
        <button role="tab" aria-selected={view === 'page'} className={view === 'page' ? 'on' : ''} onClick={() => setView('page')}>Page</button>
        <button role="tab" aria-selected={view === 'md'} className={view === 'md' ? 'on' : ''} onClick={() => setView('md')}>Markdown</button>
      </div>

      {view === 'md' ? <pre className="ti-md" aria-label="approval-tiers.md">{md}</pre> : <>
        <dl className="props">
          <div><dt><Icon name="badge-check" size={16} />Last verified</dt><dd>{fresh ? <>Today<span className="props-m">just now, against Salesforce</span></> : 'Aug 11, 2026'}</dd></div>
          <div><dt><Icon name="file-text" size={16} />Shown to</dt><dd>Asoka, always<span className="props-m">loaded with every request</span></dd></div>
          <div><dt><Icon name="layers" size={16} />Linked from</dt><dd>6 pages<span className="props-m">Index, Churn, Quote to cash…</span></dd></div>
          <div className="ti-conf-p"><dt><Icon name="scan-eye" size={16} />Confidence</dt><dd><Confidence confirmed={ask === 'answered' ? 1 : 0} decided={share === 'decided' ? 1 : 0} /></dd></div>
        </dl>

        <div className={'ti-on' + (onLena.length ? '' : ' clear')} aria-live="polite">
          {onLena.length ? <>
            <span className="ti-on-h"><span className="ti-on-av" aria-hidden="true"><Icon name="user" size={12} /></span><b>Waiting on Lena Marchetti</b><span className="ti-on-n">{onLena.length}</span></span>
            <ul>{onLena.map((x) => <li key={x.id}><button className="wl" onClick={() => jump(x.id)}>{x.t}</button></li>)}</ul>
            {reminded ? <span className="ti-plan-n"><Icon name="circle-check" size={12} />Reminded in Slack just now</span> : <button className="btn ghost" onClick={remindLena}><Icon name="hash" size={14} />Remind Lena in Slack</button>}
          </> : <span className="ti-on-h"><Icon name="circle-check" size={14} /><b>Nothing waits on Lena Marchetti</b><span className="ti-oq-m">She signed off both fixes and decided report sharing.</span></span>}
        </div>

        <p className="lede">Who signs off on what, the two gates every production change passes through, and the access that carries the most risk today.</p>

        <Toc items={SECTIONS} />

        <h2 id="t-who">Who signs off</h2>
        <p className="ti-note"><Mark tone="warn" icon="circle-help">From the knowledge base · not re-checked in the last audit</Mark></p>
        <Block id="ti-approvers" cls="tbl ti-tbl">
          <table>
            <thead><tr><th>Domain</th><th>Approvers</th></tr></thead>
            <tbody>{APPROVERS.map((a) => a.flag
              ? <tr key={a.d} id="b-ti-sasha" className={(ask === 'answered' ? 'ti-fixed' : 'ti-flag') + (w.proof ? ' trc' : '') + (w.trace === 'ti-sasha' ? ' traced' : '')} {...sasha}><td>{a.d}</td><td>
                {ask === 'answered' ? <><span className="ti-new">Delphine Roux (Sr Director Integration Services)</span> <span className="ti-row-flag"><Mark tone="ok" icon="circle-check">Confirmed by Dale Whitaker · just now</Mark></span><span className="ti-ed">Edited just now · was “Sasha Merrill”, an integration seat</span></>
                  : <>{a.who} <span className="ti-row-flag"><Mark tone="warn" icon="user">{a.flag}</Mark>{ask === 'asking' && <span className="ti-asking"><LivePulse />Asoka is asking Dale Whitaker, VP GTM Ops</span>}</span></>}
              </td></tr>
              : <tr key={a.d}><td>{a.d}</td><td>{a.who}</td></tr>)}</tbody>
          </table>
        </Block>
        <p className="ti-aside">{ask === 'answered' ? 'The row pointed at a machine identity; Dale Whitaker named the person who owns it. The rest of the list is still from the knowledge base.' : 'The flagged row points at a machine identity: a real defect in the org’s own approver list, and why people data and identity data have to be read together.'}</p>

        <h2 id="t-gates">Two gates</h2>
        {/* Two gates, simplified: the order as two plain rows, then three one-line rules. */}
        <Block id="ti-gates"><ol className="ti-g2">
          <li><span className="ti-n">1</span><span className="ti-g2-t"><span className="lt"><b>Business gate.</b> The named RevOps approver signs off the plan: the exact records, dates, values and reasons.</span></span></li>
          <li><span className="ti-n">2</span><span className="ti-g2-t"><span className="lt"><b>Platform gate.</b> Technical approval for the write itself, asked for only after gate 1.</span></span></li>
        </ol></Block>
        <Block id="ti-notcount"><ul className="ti-g2-rules">
          <li><span className="lt"><b>For churn,</b> the approver confirms four inputs: account, churn date, reason picklist value and notes.</span></li>
          <li><span className="lt"><b>Never counts as gate 1:</b> the requester’s ask, a ticket status change, someone else saying to proceed, or silence.</span></li>
          <li><span className="lt"><b>Exception:</b> if the requester is the named approver and their ticket already set out the exact plan, don’t ask again, unless an input has changed.</span></li>
        </ul></Block>

        <h2 id="t-priv">Privilege surface</h2>
        <p className="ti-note ti-check"><Mark tone="ok" icon="badge-check">Verified live · {check === 'done' || moved ? 're-checked just now' : 're-checked 52 min ago'}</Mark>
          {check === 'checking' ? <span className="ti-asking"><LivePulse />Asoka is re-checking against Salesforce</span> : <span className="ti-checked-q">Asoka re-checks hourly</span>}</p>
        <Block id="ti-roster"><dl className="ti-stats">
          <div><dt className="tk">System Administrator seats</dt><dd><b><LiveNum value={admin} /></b><span>12 human · <LiveNum value={machine} /> machine · granted by profile, not role</span></dd></div>
          <div><dt className="tk">Licences in use</dt><dd><b><LiveNum value={lic} /><small>/109</small></b><span>{109 - lic === 1 ? 'saturated: one seat left' : `${109 - lic} seats free`}</span></dd></div>
          <div><dt className="tk">Live powerful permission sets</dt><dd><b><LiveNum value={done('ti-f-vendor') ? 0 : 1} /></b><span>{done('ti-f-vendor') ? 'of 7 · the vendor’s is scoped' : 'of 7 · the vendor’s'}</span></dd></div>
        </dl></Block>
        <ol className="ti-find">
          {FINDINGS.map((f) => (
            <li key={f.t} className={done(f.id) ? 'ok' : f.sev}>
              <span className={'ti-sev ' + (done(f.id) ? 'ok' : f.sev)}>{done(f.id) ? 'Fixed' : f.sev === 'high' ? 'High' : f.sev === 'med' ? 'Watch' : 'Right'}</span>
              <div className="ti-fbody">
              {f.id === 'ti-f-machine'
                ? <Block id={f.id}><b><span className="lt">{done(f.id) ? <>No machine identities on System Administrator</> : <><span key={machine} className={moved ? 'ti-new' : ''}>{machine}</span> machine identities on full System Administrator</>}</span></b>{moved && <span className="ti-ed">Edited just now · one moved to an integration licence in Salesforce</span>}<p>{f.d}</p>{!fix[f.id] && <p className="ti-fix"><Icon name="arrow-right" size={12} />Move them to an integration licence + API-only profile: recovers ~{machine} seats and takes them off admin.</p>}</Block>
                : <Block id={f.id}><b><span className="lt">{f.t}</span></b><p>{f.d}</p>{f.fix && !fix[f.id] && <p className="ti-fix"><Icon name="arrow-right" size={12} />{f.fix}</p>}</Block>}
              {PLAN[f.id] && fix[f.id] && <Waiting wid={'w-' + f.id} kind="fix" head={PLAN[f.id].title}
                fields={[
                  { k: 'What changes', v: <ul className="ti-plan-l">{PLAN[f.id].lines(machineNow).map((l) => <li key={l}>{l}</li>)}</ul> },
                  { k: 'Who decides', v: <>Lena Marchetti signs off the plan <span className="ti-oq-m">· Adaeze Nwosu approves the write</span></> },
                ]}
                steps={fixSteps(f.id)} status={fixStatus(f.id)} done={done(f.id)}
                doneHead={PLAN[f.id].title} doneNote={<p className="ti-oq-m2">{PLAN[f.id].done(f.id === 'ti-f-machine' ? fixedN : 1)}. Signed off by Lena Marchetti, approved by Adaeze Nwosu.</p>} />}
              </div>
            </li>
          ))}
        </ol>
        <h3>Over-grants to flag</h3>
        <ul className="ti-over">{OVER.map((x, i) => <li key={x}><Block id={'ti-over-' + i}><span className="lt">{x}</span></Block></li>)}</ul>

        <h2 id="t-access">Access requests</h2>
        {/* Access requests, simplified like Two gates: the gap in one line, the dashboard steps as two rows, the open question last. */}
        <Block id="ti-model"><p className="ti-lead"><span className="lt"><b>Kestrel has no documented Salesforce access model.</b> That gap is behind most requests: permission sets, report visibility, field-level security, dashboards, freezes and licence counts.</span></p></Block>
        <Block id="ti-dash"><ol className="ti-g2">
          <li><span className="ti-n">1</span><span className="ti-g2-t"><span className="lt"><b>Assign the dashboard permission set.</b> For access to an agent-built dashboard.</span></span></li>
          <li><span className="ti-n">2</span><span className="ti-g2-t"><span className="lt"><b>Admin-approve the connected app.</b> Without it the grant fails with <code>invalid_app_access</code>, which looks as if it didn’t work.</span></span></li>
        </ol></Block>
        {req > 0 && (
          <div className="ti-req" aria-live="polite">
            <span className="ti-req-h"><LivePulse on={req < 3} /><span className="tk">Latest request · just now</span></span>
            <p><b>A Sales Ops analyst needs the Pipeline Health dashboard.</b></p>
            <ol>
              <li className={req >= 2 ? 'done' : 'now'}><span className="cx-ck" aria-hidden="true">{req >= 2 ? <Icon name="check" size={12} /> : <i />}</span>Dashboard permission set assigned</li>
              <li className={req >= 3 ? 'done' : req === 2 ? 'now' : ''}><span className="cx-ck" aria-hidden="true">{req >= 3 ? <Icon name="check" size={12} /> : req === 2 ? <i /> : null}</span>{req >= 3 ? 'Connected app approved by Adaeze Nwosu: access works' : 'Waiting for Adaeze Nwosu to approve the connected app'}</li>
            </ol>
          </div>
        )}
        <Block id="ti-sharing">
          <Waiting wid="w-ti-sharing" kind="decision" head={<span className="lt">Who may see reports and dashboards beyond the sales hierarchy?</span>}
            fields={[
              { k: 'Why it matters', v: <>Until it’s decided, Asoka escalates every request to widen visibility and never decides one itself. <b>2 requests are waiting.</b></> },
              { k: 'Who decides', v: <>Lena Marchetti, VP Compliance <span className="ti-oq-m">· Adaeze Nwosu implements (from Who signs off)</span></> },
              { k: 'Asoka’s draft', v: <><span className="ti-draft">Draft</span>Reports stay within the sales hierarchy by default; wider sharing needs the report owner’s VP. <span className="ti-oq-m">From how reports are shared today.</span></> },
              { k: 'Waiting', v: <ul className="ti-oq-w"><li>Marketing Ops · Pipeline by region dashboard</li><li>CS leadership · Renewal risk report</li></ul> },
            ]}
            status={<span className="ti-asking"><LivePulse />Waiting on Lena Marchetti · {ago(reminded, '3 days ago')}</span>}
            done={share === 'decided'}
            doneHead={<span className="lt">Reports and dashboards stay within the sales hierarchy by default; wider sharing needs the report owner’s VP.</span>}
            doneNote={<><span className="ti-ed">Edited just now · was an open question; Asoka’s draft, accepted as written</span><p className="ti-oq-m2">The 2 waiting requests now route to their report owners’ VPs. Adaeze Nwosu implements the sharing settings.</p></>} />
        </Block>

        <h2 id="t-skew">Data caveat</h2>
        <Block id="ti-skew" cls="callout ti-call"><p><span className="lt">The Setup Audit Trail hit its <b>2,000-row cap</b> for the 90-day window. Rankings per person and category are trustworthy; <b>absolute counts understate</b>. Flow authorship is an audit-trail proxy, because the direct query has a gap. Say which of the two you rely on when quoting a number.</span></p></Block>

        <h2 id="t-rel">Related pages</h2>
        <ul className="related">
          {RELATED.map((r) => <li key={r.t}><button onClick={() => w.go('all')}><span className="rel-ic" aria-hidden="true"><Icon name="file-text" size={14} /></span><b>{r.t}</b><span>{r.d}</span></button></li>)}
        </ul>
      </>}
    </article>
  )
}
