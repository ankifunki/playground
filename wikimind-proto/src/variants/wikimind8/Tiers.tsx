import { useState } from 'react'
import { Icon, type IconName } from './Icon'
import { Ag, Asoka } from './Live'
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

const FINDINGS: { sev: 'high' | 'med' | 'ok'; t: string; d: string; fix?: string }[] = [
  { sev: 'high', t: '7 machine identities on full System Administrator', d: 'The biggest exposure. Each burns a full Salesforce seat in a licence-saturated org.', fix: 'Move them to an integration licence + API-only profile: recovers ~7 seats and takes them off admin.' },
  { sev: 'high', t: 'A vendor permission set with ViewAllData + ModifyAllData + ViewSetup', d: 'Assigned to a CS-platform integration user run by an external vendor: unrestricted read and write on every object, hidden behind a read-only-looking, API-only profile.', fix: 'Scope it to the objects the vendor needs.' },
  { sev: 'med', t: 'Powerful permissions are granted by profile, not permission set', d: 'Only one powerful permission set has a live assignee (the vendor one); the other six have none. ModifyAllData, ViewAllData, ManageUsers and AuthorApex come from profiles, so a permission-set audit alone misses them.' },
  { sev: 'ok', t: 'The integration permission set is the right posture', d: 'Correctly scoped, 9 assignees. It is not the answer to a “give me full access” request.' },
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

function Mark({ tone, icon, children }: { tone: 'ok' | 'warn' | 'open'; icon: IconName; children: React.ReactNode }) {
  return <span className={'ti-mark ' + tone}><Icon name={icon} size={12} />{children}</span>
}

export function Tiers() {
  const w = useW(), [view, setView] = useState<'page' | 'md'>('page')
  return (
    <article className="doc ti">
      <h1>Approval tiers and the privilege surface</h1>
      <p className="byline">Kept by <Ag id="security" name /><span className="by-sep" />Source: written by hand, mapped from Markdown</p>
      <p className="liveln"><Asoka size={20} state="idle" />Roster re-verified live; the approver list waits on a person</p>
      <div className="ti-view" role="tablist" aria-label="View">
        <button role="tab" aria-selected={view === 'page'} className={view === 'page' ? 'on' : ''} onClick={() => setView('page')}>Page</button>
        <button role="tab" aria-selected={view === 'md'} className={view === 'md' ? 'on' : ''} onClick={() => setView('md')}>Markdown</button>
      </div>

      {view === 'md' ? <pre className="ti-md" aria-label="approval-tiers.md">{md}</pre> : <>
        <dl className="props">
          <div><dt><Icon name="badge-check" size={16} />Last verified</dt><dd>Aug 11, 2026</dd></div>
          <div><dt><Icon name="scan-eye" size={16} />Confidence</dt><dd>Mixed<span className="props-m">roster live-verified · approvers from the KB</span></dd></div>
          <div><dt><Icon name="file-text" size={16} />Shown to</dt><dd>Asoka, always<span className="props-m">loaded with every request</span></dd></div>
          <div><dt><Icon name="layers" size={16} />Linked from</dt><dd>6 pages<span className="props-m">Index, Churn, Quote to cash…</span></dd></div>
        </dl>

        <p className="lede">Who signs off on what, the two gates every production change passes through, and the access that carries the most risk today.</p>

        <Toc items={SECTIONS} />

        <h2 id="t-who">Who signs off</h2>
        <p className="ti-note"><Mark tone="warn" icon="circle-help">From the knowledge base · not re-checked in the last audit</Mark></p>
        <div className="blk tbl ti-tbl">
          <table>
            <thead><tr><th>Domain</th><th>Approvers</th></tr></thead>
            <tbody>{APPROVERS.map((a) => (
              <tr key={a.d} className={a.flag ? 'ti-flag' : ''}><td>{a.d}</td><td>{a.who}{a.flag && <span className="ti-row-flag"><Mark tone="warn" icon="user">{a.flag}</Mark></span>}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="ti-aside">The flagged row points at a machine identity: a real defect in the org’s own approver list, and why people data and identity data have to be read together.</p>

        <h2 id="t-gates">Two gates</h2>
        <p>Every production change passes through both, in this order. Neither replaces the other.</p>
        <ol className="ti-gates">
          <li><span className="ti-n">1</span><div><b>Business gate</b><p>The named RevOps approver signs off on the plan: the exact records, dates, values and reasons.</p></div></li>
          <li aria-hidden="true" className="ti-arrow"><Icon name="arrow-right" size={16} /></li>
          <li><span className="ti-n">2</span><div><b>Platform gate</b><p>Technical approval for the write itself, requested only after the business gate.</p></div></li>
        </ol>
        <h3>For churn, the approver affirms four inputs</h3>
        <ul className="ti-chips">{['Account', 'Churn date', 'Reason picklist value', 'Notes'].map((x) => <li key={x}>{x}</li>)}</ul>
        <h3>What does not count as the business gate</h3>
        <ul className="ti-no">
          {['The requester’s original ask, however well-formed the ticket', 'A ticket status change', 'A decision from Finance, a CSM steer, or anyone else saying to proceed', 'Silence: a missing reply is not approval, however long the thread has run'].map((x) => <li key={x}><Icon name="x" size={14} />{x}</li>)}
        </ul>
        <div className="callout ti-call"><span className="co-ic"><Icon name="circle-check" size={16} /></span><p><b>One exception.</b> When the requester is the named approver and their ticket already authorised the exact plan on all four inputs, don’t ask again. If any input has shifted since, ask.</p></div>

        <h2 id="t-priv">Privilege surface</h2>
        <p className="ti-note"><Mark tone="ok" icon="badge-check">Verified live</Mark></p>
        <dl className="ti-stats">
          <div><dt className="tk">System Administrator seats</dt><dd><b>19</b><span>12 human · 7 machine · granted by profile, not role</span></dd></div>
          <div><dt className="tk">Licences in use</dt><dd><b>108<small>/109</small></b><span>saturated: one seat left</span></dd></div>
          <div><dt className="tk">Live powerful permission sets</dt><dd><b>1</b><span>of 7 · the vendor’s</span></dd></div>
        </dl>
        <ol className="ti-find">
          {FINDINGS.map((f) => (
            <li key={f.t} className={f.sev}>
              <span className={'ti-sev ' + f.sev}>{f.sev === 'high' ? 'High' : f.sev === 'med' ? 'Watch' : 'Right'}</span>
              <div><b>{f.t}</b><p>{f.d}</p>{f.fix && <p className="ti-fix"><Icon name="arrow-right" size={12} />{f.fix}</p>}</div>
            </li>
          ))}
        </ol>
        <h3>Over-grants to flag</h3>
        <ul className="ti-over">{OVER.map((x) => <li key={x}>{x}</li>)}</ul>

        <h2 id="t-access">Access requests</h2>
        <div className="callout ask ti-call"><span className="co-ic"><Icon name="circle-help" size={16} /></span><p><b>Kestrel has no documented Salesforce access model.</b> That gap is behind most access requests; it’s catalogued in Policies and ownership.</p></div>
        <h3>What arrives</h3>
        <ul className="ti-chips">{['Grant a permission set', 'Why can’t X see report Y', 'Field-level security on a new field', 'Access to a dashboard', 'Freeze or unfreeze a user', 'Licence counts'].map((x) => <li key={x}>{x}</li>)}</ul>
        <h3>Access to an agent-built dashboard takes two steps</h3>
        <ol className="ti-steps">
          <li><span className="ti-n">1</span>Assign the dashboard permission set</li>
          <li><span className="ti-n">2</span>Admin-approve the connected app</li>
        </ol>
        <p className="ti-aside">The permission set alone fails with <code>invalid_app_access</code>, which looks as if the grant didn’t work.</p>
        <div className="callout ask ti-call"><span className="co-ic"><Icon name="circle-help" size={16} /></span><p><b>Open question: report and dashboard sharing has no policy.</b> A request to widen visibility beyond the sales hierarchy is undecided, not an implicit yes: escalate rather than decide. Access to data the requester may not be entitled to see needs confirmation.</p></div>

        <h2 id="t-skew">Data caveat</h2>
        <div className="callout ti-call"><span className="co-ic"><Icon name="text" size={16} /></span><p>The Setup Audit Trail hit its <b>2,000-row cap</b> for the 90-day window. Rankings per person and category are trustworthy; <b>absolute counts understate</b>. Flow authorship is an audit-trail proxy, because the direct query has a gap. Say which of the two you rely on when quoting a number.</p></div>

        <h2 id="t-rel">Related pages</h2>
        <ul className="related">
          {RELATED.map((r) => <li key={r.t}><button onClick={() => w.go('all')}><span className="rel-ic" aria-hidden="true"><Icon name="file-text" size={14} /></span><b>{r.t}</b><span>{r.d}</span></button></li>)}
        </ul>
      </>}
    </article>
  )
}
