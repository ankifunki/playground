import { useEffect, useRef } from 'react'
import { QaSlot } from './Answer'
import { C, Margin } from './Claim'
import { ARRIVAL, REFS } from './data'
import { FlowSvg } from './Diagrams'
import { Icon } from './Icon'
import { RM } from './logic'
import { Replay } from './Replay'
import { useW } from './store'

const OLD_RENEWAL = 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.'
const CHANGED = { t: 'Changed Oct 28', tone: 'info' } as const
const SEEN_ONCE = { t: 'Seen once', tone: 'warn' } as const

/** An inline link to another page. Related pages live in the sentences, not in a list at the bottom. */
function L({ to, children }: { to: string; children?: string }) {
  const w = useW()
  return <button className="wl il" onClick={(e) => w.openPrev(to, e.currentTarget)}>{children || to}</button>
}

function Dots({ on, off = 0 }: { on: number; off?: number }) {
  return <div className="dots" aria-hidden="true">{Array.from({ length: on }, (_, i) => <i key={i} />)}{Array.from({ length: off }, (_, i) => <i key={'n' + i} className="n" />)}</div>
}

/** The open question lives where the doubt is. When Maria answers, the card rewrites itself in place. */
function Renewal() {
  const w = useW()
  if (w.learned) return (
    <div className={'obs done' + (w.diffPlay ? ' upd' : '')} id="renewal">
      <div className="ok2">Confirmed by Maria Okafor just now</div>
      <p className={'was' + (w.diffPlay ? ' anim' : '')}><del>{OLD_RENEWAL}</del></p>
      <p className={w.diffPlay ? 'write' : ''}><C ns={[11, 14]} mark={{ t: 'Changed just now', tone: 'ok' }}>Flat <L to="Renewals">renewals</L> skip approval on purpose. It has been the policy since 2023, because flat renewals don’t change revenue risk.</C></p>
      <div className="said">“Yes, on purpose since 2023. Flat renewals don’t change revenue risk.” <span>Maria Okafor, RevOps</span></div>
    </div>
  )
  return (
    <div className="obs" id="renewal">
      <div className="ok2">Open question. Asoka asked Maria Okafor on Oct 27</div>
      <p><C ns={[11]}>{OLD_RENEWAL}</C></p>
      <Dots on={14} />
      <div className="dl">14 of 14 flat renewals last quarter skipped approval.</div>
      <div className="wait">{w.talkTyping
        ? <><span className="typing"><i /><i /><i /></span>Maria is replying</>
        : <>No reply yet. <button className="wl" onClick={w.learn}>Simulate her reply</button></>}</div>
    </div>
  )
}

/** Arriving from a Slack citation: lead with the question and answer, and mark the sentences behind it. */
function Arrival() {
  const w = useW()
  if (!w.arrival) return null
  return (
    <section className="arrive" aria-label="Why you are here">
      <div className="qah"><span className="tk">From Asoka’s reply in {ARRIVAL.channel}</span><button className="ibtn sm" onClick={w.leaveArrival} aria-label="Read the whole page" title="Read the whole page"><Icon name="x" size={16} /></button></div>
      <p className="qq">{ARRIVAL.q}</p>
      <p className="qan">{ARRIVAL.a}</p>
      <div className="qsrc">The two sentences behind that answer are marked below. <button className="wl" onClick={() => w.showClaims(ARRIVAL.ns)}>Show me</button></div>
    </section>
  )
}

/** The trust vectors for this one process, in a line under the title. */
function TrustLine() {
  const w = useW(), gaps = w.learned ? 1 : 2
  return (
    <div className="tline" aria-label="How far to trust this page">
      <div><span className="tk">Reliability</span><b>99%</b><small>138 of 140 matched a person</small></div>
      <div><span className="tk">Automation</span><b>Asks first</b><small>Resets and seats run alone</small></div>
      <div><span className="tk">Gaps</span><b>{gaps}</b><small>{w.learned ? 'EMEA routing' : 'EMEA routing, flat renewals'}</small></div>
    </div>
  )
}

export function Page() {
  const w = useW(), learn = useRef(w.learn)
  learn.current = w.learn
  const verified = Object.values(REFS).filter((r) => r.v).length
  // Demo: Maria answers on her own about 20 seconds in, so the rewrite happens without a presenter key.
  useEffect(() => {
    if (w.learned) return
    const t = window.setTimeout(() => learn.current(), RM ? 8000 : 20000)
    return () => window.clearTimeout(t)
  }, [w.learned])
  return (
    <div className="page art">
      <div className="doc">
        <article className="art-body">
          <h1 className="t">Opportunity approvals</h1>
          <div className="byline">
            <span>Written and kept current by Asoka. Owned by <L to="Maria Okafor" /> in RevOps.</span>
            <span className="live"><span className="pdot" />{w.learned ? 'Rewritten just now from Maria’s answer' : 'Reading 2 new Slack threads about this'}</span>
          </div>
          <TrustLine />
          <Arrival />
          <section id="s-lead">
            <p><b>Opportunity approval</b> is how Northwind reviews large deals before they move to Negotiation. <C ns={[1]}>Any deal over $100,000 needs approval,</C> <C ns={[3, 13]}>and who approves depends on the discount, under the <L to="Discount policy" />.</C> <C ns={[4]} mark={SEEN_ONCE} cls="uns">EMEA deals reportedly go to the regional director first.</C> <C ns={[5]}>Most approvals finish in under four hours.</C></p>
            <QaSlot where="page" sec="lead" />
          </section>
          <section id="s-how">
            <h2>How it works</h2>
            <div className="fig"><FlowSvg /><div className="fc"><span>Drawn by Asoka from the approval process.</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="pdot" />6 approvals in flight now</span></div></div>
            <p><C ns={[2]}>When a rep moves a qualifying deal to Negotiation, Salesforce locks the record and routes it for approval.</C> <C ns={[3, 12, 13]} mark={CHANGED}>Discounts over 20% add Finance as a second approver. Over 35%, the CRO approves directly.</C></p>
            <QaSlot where="page" sec="how" />
            <h3>Watch it happen</h3>
            <Replay />
            <p className="aside">Replayed by Asoka from a real approval on Oct 29.</p>
          </section>
          <section id="s-rules">
            <h2>Rules</h2>
            <p><C ns={[6]}>An approval request expires after 14 days. The record unlocks and the rep has to submit it again.</C> <C ns={[7]}>The rule exists because two deals closed on six-week-old prices in 2024.</C></p>
            <p><C ns={[8]}>Once a deal is approved, only <L to="Deal Desk" /> can change its amount.</C></p>
            <QaSlot where="page" sec="rules" />
          </section>
          <section id="s-practice">
            <h2>In practice</h2>
            <p className="aside">What people actually do, which nobody wrote down. Asoka learned it by watching the work.</p>
            <div className="obs">
              <div className="ok2">Unofficial. Differs from the written policy</div>
              <p><C ns={[9, 10]}>At <L to="Quarter-end close">quarter end</L>, Deal Desk approves large deals in #deal-desk first and logs them in Salesforce afterward.</C></p>
              <Dots on={9} off={3} />
              <div className="dl">9 of the last 12 quarter-end deals. Filled: approved in Slack first.</div>
            </div>
            <Renewal />
            <QaSlot where="page" sec="practice" />
          </section>
          <section id="s-touches">
            <h2>What touches this</h2>
            <div className="tscroll"><table className="wt"><tbody>
              <tr><th>Automation</th><th>Type</th><th>Status</th></tr>
              <tr><td>Large Deal Approval</td><td>Approval process</td><td>Changed Oct 28</td></tr>
              <tr><td>Discount_Requires_Reason</td><td>Validation rule</td><td>Healthy</td></tr>
              <tr><td>Amount_Locked_After_Approval</td><td>Validation rule</td><td>Healthy</td></tr>
              <tr><td><L to="CPQ quote sync" /></td><td>Integration</td><td className="bad">Failing for multi-currency since Oct 29</td></tr>
            </tbody></table></div>
          </section>
          <p className="colophon">
            Written by Asoka from {Object.keys(REFS).length + (w.learned ? 1 : 0)} sources, {verified} of them checked by Dana Ruiz. Rewritten {w.learned ? 7 : 6} times since March 2024.
            <span className="hint-fine"> Point at any sentence to see where it came from.</span><span className="hint-touch"> Tap any sentence to see where it came from.</span>
          </p>
        </article>
        <Margin />
      </div>
    </div>
  )
}
