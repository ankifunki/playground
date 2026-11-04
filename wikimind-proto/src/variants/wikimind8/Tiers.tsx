import { useState } from 'react'
import { Icon, type IconName } from './Icon'
import { Ag, Asoka, Block, useTraceTarget } from './Live'
import { useW } from './store'
import { Toc, type TocItem } from './Toc'
import md from './approval-tiers.md?raw'

/*
 * Approval tiers and the privilege surface: an org-context Markdown file (approval-tiers.md, kept beside this
 * component) mapped onto the Wikimind 9 page. Same facts, new form: properties for the front matter, trust marked
 * only where the source flags it (the approver list is from the KB and not re-checked; the roster is verified live),
 * the two gates as a sequence, the privilege surface as numbers and ranked findings, the open question and the caveat
 * as callouts. Page / Markdown switches to the source file, to compare the two.
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
const CONF = [
  { k: 'live', t: 'Verified live', n: 13, to: 't-priv' },
  { k: 'kb', t: 'From the KB, not re-checked', n: 9, to: 't-who' },
  { k: 'manual', t: 'Written by hand', n: 7, to: 't-gates' },
  { k: 'open', t: 'Open', n: 2, to: 't-access' },
] as const
function Confidence() {
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

export function Tiers() {
  const w = useW(), [view, setView] = useState<'page' | 'md'>('page'), sasha = useTraceTarget('ti-sasha')
  return (
    <article className="doc ti">
      <h1>Approval tiers and the privilege surface</h1>
      <p className="byline">Kept by <Ag id="security" name /><span className="by-sep" />Source: written by hand, mapped from Markdown</p>
      <p className="liveln"><Asoka size={20} state="idle" />Roster re-verified live; the approver list waits on a person{w.proof && <span className="ti-hint"> · hover any line to see where it came from</span>}</p>
      <div className="ti-view" role="tablist" aria-label="View">
        <button role="tab" aria-selected={view === 'page'} className={view === 'page' ? 'on' : ''} onClick={() => setView('page')}>Page</button>
        <button role="tab" aria-selected={view === 'md'} className={view === 'md' ? 'on' : ''} onClick={() => setView('md')}>Markdown</button>
      </div>

      {view === 'md' ? <pre className="ti-md" aria-label="approval-tiers.md">{md}</pre> : <>
        <dl className="props">
          <div><dt><Icon name="badge-check" size={16} />Last verified</dt><dd>Aug 11, 2026</dd></div>
          <div><dt><Icon name="file-text" size={16} />Shown to</dt><dd>Asoka, always<span className="props-m">loaded with every request</span></dd></div>
          <div><dt><Icon name="layers" size={16} />Linked from</dt><dd>6 pages<span className="props-m">Index, Churn, Quote to cash…</span></dd></div>
          <div className="ti-conf-p"><dt><Icon name="scan-eye" size={16} />Confidence</dt><dd><Confidence /></dd></div>
        </dl>

        <p className="lede">Who signs off on what, the two gates every production change passes through, and the access that carries the most risk today.</p>

        <Toc items={SECTIONS} />

        <h2 id="t-who">Who signs off</h2>
        <p className="ti-note"><Mark tone="warn" icon="circle-help">From the knowledge base · not re-checked in the last audit</Mark></p>
        <Block id="ti-approvers" cls="tbl ti-tbl">
          <table>
            <thead><tr><th>Domain</th><th>Approvers</th></tr></thead>
            <tbody>{APPROVERS.map((a) => a.flag
              ? <tr key={a.d} id="b-ti-sasha" className={'ti-flag' + (w.proof ? ' trc' : '') + (w.trace === 'ti-sasha' ? ' traced' : '')} {...sasha}><td>{a.d}</td><td>{a.who} <span className="ti-row-flag"><Mark tone="warn" icon="user">{a.flag}</Mark></span></td></tr>
              : <tr key={a.d}><td>{a.d}</td><td>{a.who}</td></tr>)}</tbody>
          </table>
        </Block>
        <p className="ti-aside">The flagged row points at a machine identity: a real defect in the org’s own approver list, and why people data and identity data have to be read together.</p>

        <h2 id="t-gates">Two gates</h2>
        {/* Two gates, simplified: the order as two plain rows, then three one-line rules. */}
        <Block id="ti-gates"><ol className="ti-g2">
          <li><span className="ti-n">1</span><span className="lt"><b>Business gate.</b> The named RevOps approver signs off the plan: the exact records, dates, values and reasons.</span></li>
          <li><span className="ti-n">2</span><span className="lt"><b>Platform gate.</b> Technical approval for the write itself, asked for only after gate 1.</span></li>
        </ol></Block>
        <Block id="ti-notcount"><ul className="ti-g2-rules">
          <li><span className="lt"><b>For churn,</b> the approver confirms four inputs: account, churn date, reason picklist value and notes.</span></li>
          <li><span className="lt"><b>Never counts as gate 1:</b> the requester’s ask, a ticket status change, someone else saying to proceed, or silence.</span></li>
          <li><span className="lt"><b>Exception:</b> if the requester is the named approver and their ticket already set out the exact plan, don’t ask again, unless an input has changed.</span></li>
        </ul></Block>

        <h2 id="t-priv">Privilege surface</h2>
        <p className="ti-note"><Mark tone="ok" icon="badge-check">Verified live</Mark></p>
        <Block id="ti-roster"><dl className="ti-stats">
          <div><dt className="tk">System Administrator seats</dt><dd><b>19</b><span>12 human · 7 machine · granted by profile, not role</span></dd></div>
          <div><dt className="tk">Licences in use</dt><dd><b>108<small>/109</small></b><span>saturated: one seat left</span></dd></div>
          <div><dt className="tk">Live powerful permission sets</dt><dd><b>1</b><span>of 7 · the vendor’s</span></dd></div>
        </dl></Block>
        <ol className="ti-find">
          {FINDINGS.map((f) => (
            <li key={f.t} className={f.sev}>
              <span className={'ti-sev ' + f.sev}>{f.sev === 'high' ? 'High' : f.sev === 'med' ? 'Watch' : 'Right'}</span>
              <Block id={f.id}><b><span className="lt">{f.t}</span></b><p>{f.d}</p>{f.fix && <p className="ti-fix"><Icon name="arrow-right" size={12} />{f.fix}</p>}</Block>
            </li>
          ))}
        </ol>
        <h3>Over-grants to flag</h3>
        <Block id="ti-over"><ul className="ti-over">{OVER.map((x) => <li key={x}><span className="lt">{x}</span></li>)}</ul></Block>

        <h2 id="t-access">Access requests</h2>
        {/* Access requests, simplified like Two gates: the gap in one line, the dashboard steps as two rows, the open question last. */}
        <Block id="ti-model"><p className="ti-lead"><span className="lt"><b>Kestrel has no documented Salesforce access model.</b> That gap is behind most requests: permission sets, report visibility, field-level security, dashboards, freezes and licence counts.</span></p></Block>
        <Block id="ti-dash"><ol className="ti-g2">
          <li><span className="ti-n">1</span><span className="lt"><b>Assign the dashboard permission set.</b> For access to an agent-built dashboard.</span></li>
          <li><span className="ti-n">2</span><span className="lt"><b>Admin-approve the connected app.</b> Without it the grant fails with <code>invalid_app_access</code>, which looks as if it didn’t work.</span></li>
        </ol></Block>
        <Block id="ti-sharing" cls="callout ask ti-call"><p><span className="lt">Report and dashboard sharing has no policy. Widening visibility beyond the sales hierarchy is undecided: escalate, don’t decide.</span></p></Block>

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
