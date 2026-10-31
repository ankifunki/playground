import type React from "react"
import { useEffect, useState } from 'react'
import { KIND, REFS, revs, SECS } from './data'
import { FlowSvg, SparkSvg } from './Diagrams'
import { initials, RM } from './logic'
import { Replay } from './Replay'
import { Rf } from './Rf'
import { useW } from './store'

const RELATED = ['Discount policy', 'Quarter-end close', 'CPQ quote sync', 'Deal Desk', 'Renewals']
const OLD_RENEWAL = 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.'

function Dots({ on, off = 0 }: { on: number; off?: number }) {
  return <div className="dots" aria-hidden="true">{Array.from({ length: on }, (_, i) => <i key={i} />)}{Array.from({ length: off }, (_, i) => <i key={'n' + i} className="n" />)}</div>
}

function Renewal() {
  const w = useW()
  if (w.learned) return (
    <div className={'obs done' + (w.diffPlay ? ' upd' : '')} id="renewal">
      <div className="ok2">Confirmed by RevOps just now</div>
      <p className={'was' + (w.diffPlay ? ' anim' : '')}><del>{OLD_RENEWAL}</del></p>
      <p className={w.diffPlay ? 'write' : ''}>Renewals with no price change skip approval on purpose. It has been the policy since 2023, because flat renewals don’t change revenue risk.<Rf ns={[11, 14]} /></p>
    </div>
  )
  return (
    <div className="obs" id="renewal">
      <div className="ok2">Open question. Asoka is asking Maria Okafor why</div>
      <p>{OLD_RENEWAL}<Rf ns={[11]} /></p>
      <Dots on={14} />
      <div className="dl">14 of 14 flat renewals last quarter skipped approval.</div>
    </div>
  )
}

function Infobox() {
  const w = useW(), tv = 5, tot = 8, several = w.learned ? 2 : 1, checking = w.learned ? 1 : 2
  return (
    <aside className="ibox" aria-label="Summary card">
      <div className="ih">At a glance</div>
      <div className="thumb"><SparkSvg /></div>
      <div className="cap">Approvals per week, watched live by Asoka</div>
      <table><tbody>
        <tr><th>Type</th><td>Salesforce approval process</td></tr>
        <tr><th>Object</th><td>Opportunity</td></tr>
        <tr><th>Owner</th><td><button className="wl" onClick={(e) => w.openPrev('Maria Okafor', e.currentTarget)}>Maria Okafor</button>, RevOps</td></tr>
        <tr><th>Runs</th><td>212 this quarter</td></tr>
        <tr><th>Median time</th><td>3 hours 40 minutes</td></tr>
        <tr><th>Automations</th><td>4, <span style={{ color: 'var(--warn)', fontWeight: 600 }}>1 failing</span></td></tr>
        <tr><th>Last changed</th><td>Oct 28 <button className="wl" onClick={() => w.pickTab('history')}>See changes</button></td></tr>
      </tbody></table>
      <div className="trust">
        <b>{tv} of {tot} statements verified by a person</b>
        <div className="tbar"><i style={{ width: (tv / tot) * 100 + '%', background: 'var(--ok)' }} /><i style={{ width: (several / tot) * 100 + '%', background: 'var(--link)', opacity: 0.5 }} /><i style={{ width: (checking / tot) * 100 + '%', background: 'var(--warn)' }} /></div>
        <small>{several} backed by several sources. {checking} still being checked. Last observed 2 hours ago.</small>
      </div>
    </aside>
  )
}

const scrollTo = (id: string) => document.getElementById('s-' + id)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' })

function Article({ onToc }: { onToc: (id: string) => void }) {
  const w = useW()
  // The contents rail follows the section being read.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) onToc(e.target.id.slice(2)) }), { rootMargin: '-80px 0px -70% 0px' })
    document.querySelectorAll('.art-body section').forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [onToc])
  return (
    <div className="art-body">
      <section id="s-lead">
        <div className="mtoc"><details><summary>On this page</summary><ol>{SECS.slice(1).map(([id, name]) => <li key={id}><button className="wl" onClick={() => scrollTo(id)}>{name}</button></li>)}</ol></details></div>
        <Infobox />
        <p><b>Opportunity approval</b> is how Northwind reviews large deals before they move to Negotiation.<Rf ns={[1]} /> Any deal over $100,000 needs approval,<Rf ns={[2]} /> and who approves depends on the discount.<Rf ns={[3, 13]} /> <span className="uns">EMEA deals reportedly go to the regional director first.</span><Rf ns={[4]} /> Most approvals finish in under four hours.<Rf ns={[5]} /></p>
      </section>
      <section id="s-how">
        <h2>How it works</h2>
        <div className="fig"><FlowSvg /><div className="fc"><span>Drawn by Asoka from the approval process.</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="pdot" />6 approvals in flight now</span></div></div>
        <p>When a rep moves a qualifying deal to Negotiation, Salesforce locks the record and routes it for approval.<Rf ns={[2]} /> Discounts over 20% add Finance as a second approver. Over 35%, the CRO approves directly.<Rf ns={[3, 12, 13]} /></p>
        <h3>Watch it happen</h3>
        <Replay />
        <p style={{ fontSize: 13.5, color: 'var(--ink2)', marginTop: 6 }}>Replayed by Asoka from a real approval on Oct 29.</p>
      </section>
      <section id="s-rules">
        <h2>Rules</h2>
        <p>An approval request expires after 14 days. The record unlocks and the rep has to submit it again.<Rf ns={[6]} /> The rule exists because two deals closed on six-week-old prices in 2024.<Rf ns={[7]} /></p>
        <p>Once a deal is approved, only Deal Desk can change its amount.<Rf ns={[8]} /></p>
      </section>
      <section id="s-practice">
        <h2>In practice</h2>
        <p style={{ color: 'var(--ink2)', fontSize: 15 }}>What people actually do, which nobody wrote down. Asoka learned it by watching the work.</p>
        <div className="obs">
          <div className="ok2">Unofficial. Differs from the written policy</div>
          <p>At quarter end, Deal Desk approves large deals in #deal-desk first and logs them in Salesforce afterward.<Rf ns={[9, 10]} /></p>
          <Dots on={9} off={3} />
          <div className="dl">9 of the last 12 quarter-end deals. Filled: approved in Slack first.</div>
        </div>
        <Renewal />
      </section>
      <section id="s-touches">
        <h2>What touches this</h2>
        <div className="tscroll"><table className="wt"><tbody>
          <tr><th>Automation</th><th>Type</th><th>Status</th></tr>
          <tr><td>Large Deal Approval</td><td>Approval process</td><td>Changed Oct 28</td></tr>
          <tr><td>Discount_Requires_Reason</td><td>Validation rule</td><td>Healthy</td></tr>
          <tr><td>Amount_Locked_After_Approval</td><td>Validation rule</td><td>Healthy</td></tr>
          <tr><td><button className="wl" onClick={(e) => w.openPrev('CPQ quote sync', e.currentTarget)}>CPQ quote sync</button></td><td>Integration</td><td className="bad">Failing for multi-currency since Oct 29</td></tr>
        </tbody></table></div>
      </section>
      <section id="s-hist">
        <h2>History</h2>
        <p>The CRO threshold dropped from 40% to 35% on Oct 28, 2026, after the CRO asked to see more large discounts personally.<Rf ns={[3, 12]} /> Finance was added as a second approver on Sep 12.<Rf ns={[13]} /> The full record of every change is in <button className="wl" onClick={() => w.pickTab('history')}>Changes</button>.</p>
      </section>
      <section id="s-see">
        <h2>Related</h2>
        <ul className="seealso">{RELATED.map((x) => <li key={x}><button className="wl" onClick={(e) => w.openPrev(x, e.currentTarget)}>{x}</button></li>)}</ul>
      </section>
      <section id="s-refs">
        <h2>Sources</h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink2)' }}>Everything Asoka observed to write this page. Tap a number in the text to see it in place.</p>
        <ol className="refs">{Object.entries(REFS).map(([n, r]) => (
          <li key={n} id={'ref-' + n}><span className="k">{KIND[r.k]}</span>: {r.src}, {r.d}. <span className="q">“{r.q}”</span>{r.v && <span className="vr">✓ Verified</span>}</li>
        ))}</ol>
      </section>
    </div>
  )
}

function Msg({ av, cls, who, when, children, enter }: { av: string; cls: string; who: string; when?: string; children: React.ReactNode; enter?: boolean }) {
  return <div className={'msg' + (enter ? ' in' : '')}><span className={'av ' + cls}>{av}</span><div><div className="who">{who}{when && <small>{when}</small>}</div>{children}</div></div>
}

function Talk() {
  const w = useW()
  return (
    <>
      <p style={{ color: 'var(--ink2)', fontSize: 15.5, margin: '20px 0' }}>Where Asoka works out what it doesn’t know yet. When something looks inconsistent or missing, it asks the person most likely to know.</p>
      {w.newQs.filter((x) => x.page).map((x) => (
        <div className="thread" key={x.id}>
          <div className="th"><b>{x.q}</b><span className={'st ' + (x.resolved ? 'o' : 'w')}>{x.resolved ? 'Resolved' : 'Asking'}</span></div>
          <Msg av="A" cls="a" who="Asoka" when="Just now"><p>Someone asked this and I don’t know yet. @{x.who}, can you help? I’ll update the page when you answer.</p></Msg>
          {x.resolved && <Msg av={initials(x.who)} cls="h" who={x.who} when="Just now" enter><p>{x.ans}</p></Msg>}
        </div>
      ))}
      <div className="thread">
        <div className="th"><b>Do flat renewals skip approval on purpose?</b><span className={'st ' + (w.learned ? 'o' : 'w')}>{w.learned ? 'Resolved' : 'Waiting'}</span></div>
        <Msg av="A" cls="a" who="Asoka" when="Oct 27"><p>I saw 14 flat renewals skip approval last quarter, but no rule explains it. @Maria Okafor, is this intentional?</p></Msg>
        {w.talkTyping && !w.learned && <Msg av="MO" cls="h" who="Maria Okafor" when="typing"><span className="typing"><i /><i /><i /></span></Msg>}
        {w.learned && <>
          <Msg av="MO" cls="h" who="Maria Okafor" when="Just now" enter={w.justLearned}><p>Yes, on purpose since 2023. Flat renewals don’t change revenue risk.</p></Msg>
          <Msg av="A" cls="a" who="Asoka" when="Just now" enter={w.justLearned}><p>Thanks. I updated the page and cited your answer. <button className="wl" onClick={w.showRenewal}>See the change</button></p></Msg>
        </>}
        {!w.learned && !w.talkTyping && <Msg av="MO" cls="h" who="Maria Okafor"><p style={{ color: 'var(--ink2)' }}>Hasn’t replied yet. <button className="wl" onClick={w.learn}>Simulate her reply</button></p></Msg>}
      </div>
      <div className="thread">
        <div className="th"><b>EMEA routing seen only once</b><span className="st i">Watching</span></div>
        <Msg av="A" cls="a" who="Asoka" when="Aug 20"><p>One Slack message says EMEA deals go to Sofia first, but there’s no matching step in Salesforce. I’ll confirm on the next EMEA approval and update the article either way.</p></Msg>
      </div>
      <div className="thread">
        <div className="th"><b>Rules section checked</b><span className="st o">Verified</span></div>
        <Msg av="DR" cls="d" who="Dana Ruiz" when="Asoka’s sysadmin, Oct 12"><p>Checked against the approval process settings and the validation rule. Verified.</p></Msg>
      </div>
    </>
  )
}

function History() {
  const w = useW()
  return (
    <>
      <p style={{ color: 'var(--ink2)', fontSize: 15.5, margin: '20px 0' }}>Every edit, who made it, and what caused it. Asoka writes. A person verifies.</p>
      {revs(w.learned).map((r) => {
        const open = w.openRev === r.id
        return (
          <div key={r.id} className={'rev' + (w.hlRev === r.id ? ' hl' : '')}>
            <button onClick={() => w.toggleRev(r.id)} aria-expanded={open}>
              <span className="d">{r.d}</span>
              <span className="x1"><b>{r.t}</b><small>{r.ver ? <span style={{ color: 'var(--ok)', fontWeight: 600 }}>✓ {r.who}</span> : r.who}. Caused by: {r.why}</small></span>
            </button>
            {open && <div className="diff">{r.m && <div className="m">− {r.m}</div>}<div className="p">+ {r.p}</div><div className="c">Caused by: {r.why}</div></div>}
          </div>
        )
      })}
    </>
  )
}

export function Page() {
  const w = useW()
  const [toc, setToc] = useState('lead')
  return (
    <div className="page art">
      <nav className="toc" aria-label="Contents">
        <h4>On this page</h4>
        {SECS.map(([id, name]) => <button key={id} className={toc === id ? 'on' : ''} onClick={() => scrollTo(id)}>{name}</button>)}
      </nav>
      <div>
        <div className="tabs" role="tablist">
          <button className={w.tab === 'read' ? 'on' : ''} role="tab" aria-selected={w.tab === 'read'} onClick={() => w.pickTab('read')}>Overview</button>
          <button className={w.tab === 'talk' ? 'on' : ''} role="tab" aria-selected={w.tab === 'talk'} onClick={() => w.pickTab('talk')}>Questions <span className="cnt" id="qcnt">{w.qCount}</span></button>
          <button className={w.tab === 'history' ? 'on' : ''} role="tab" aria-selected={w.tab === 'history'} onClick={() => w.pickTab('history')}>Changes</button>
        </div>
        <h1 className="t">Opportunity approvals</h1>
        <div className="byline"><span>Written and kept current by Asoka.</span><span className="live"><span className="pdot" />{w.learned ? 'Updated just now from a RevOps answer' : 'Reading 2 new Slack threads about this'}</span></div>
        {w.tab === 'read' ? <Article onToc={setToc} /> : w.tab === 'talk' ? <Talk /> : <History />}
      </div>
    </div>
  )
}
