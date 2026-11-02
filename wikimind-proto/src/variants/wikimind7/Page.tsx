import { useState, type ReactNode } from 'react'
import { AG, ago, PAGES, SPACES } from './data'
import { Flow } from './Flow'
import { Icon } from './Icon'
import { Ag, Block, Chip, LiveText, Why } from './Live'
import { useW } from './store'

/** Notion-style properties: who keeps the page, who verified it, how fresh it is. Live values tick. */
function Props({ ag, re, verify, extra }: { ag: keyof typeof AG; re: number; verify?: ReactNode; extra?: ReactNode }) {
  const w = useW(), [t0] = useState(w.now)
  return (
    <dl className="props">
      <div><dt><Icon name="stamp" size={15} />Kept by</dt><dd><Ag id={ag} name /></dd></div>
      <div><dt><Icon name="badge-check" size={15} />Verified by</dt><dd>{verify ?? 'Dana Ruiz'}</dd></div>
      <div><dt><Icon name="radio" size={15} />Last re-read</dt><dd className="num">{ago(re + (w.now - t0) / 1000)}<span className="props-m">re-read every hour against Salesforce</span></dd></div>
      {extra}
    </dl>
  )
}

function Toggle({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Block id={id} cls="tg">
      <button className={'tg-h' + (open ? ' open' : '')} aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="chevron-right" size={14} />{title}</button>
      {open && <div className="tg-b">{children}</div>}
    </Block>
  )
}

/** The demo page: Discount approvals, written and kept by the Approvals agent. */
export function Approvals() {
  const w = useW(), f = w.fin
  const verify = w.verify === 'checking' ? <span className="re-check"><i aria-hidden="true" />Dana Ruiz is re-checking a change</span> : <>Dana Ruiz</>
  return (
    <article className="doc">
      <div className="doc-ic" aria-hidden="true"><Icon name="stamp" size={28} /></div>
      <h1>Discount approvals</h1>
      <Props ag="approvals" re={4} verify={verify} extra={<>
        <div><dt><Icon name="layers" size={15} />Sources</dt><dd>16 sources: Salesforce config, 9 Slack threads, 4 tickets, 2 meetings</dd></div>
        <div><dt><Icon name="arrow-right" size={15} />Cited</dt><dd className="num">214 times this month, by 3 agents</dd></div>
      </>} />

      <Block id="sum" cls="callout">
        <span className="co-ic"><Icon name="file-text" size={16} /></span>
        <p>Discount approval is how Northwind reviews big deals before they move to Negotiation. Any deal over $100,000 needs approval, and who approves depends on the discount. Most approvals finish in under four hours.</p>
      </Block>

      <h2>How it works</h2>
      <Flow />

      <h2>Who approves</h2>
      <Block id="who-mgr"><ul><li><LiveText text={`Up to ${f}% off: the sales manager approves on their own.`} /></li></ul></Block>
      <Block id="who-fin"><ul><li><LiveText text={`From ${f}% to 35%: the sales manager, then Finance.`} /></li></ul></Block>
      <Block id="who-cro"><ul><li>Over 35%: the CRO approves directly.</li></ul></Block>

      <h2>Rules</h2>
      <Toggle id="r-exp" title="When a request expires"><p>An approval request expires after 14 days, and the rep has to submit it again. The rule exists because two deals closed on six-week-old prices in 2024.</p></Toggle>
      <Toggle id="r-after" title="After approval"><p>Once a deal is approved, only Deal Desk can change its amount. Discounts over 10% need a written reason.</p></Toggle>

      <h2>In practice</h2>
      <h3>Quarter-end approvals in Slack</h3>
      <Block id="qe"><p><LiveText text={`At quarter end, Deal Desk approves large deals in #deal-desk first and logs them in Salesforce afterward: ${w.qe[0]} of the last ${w.qe[1]} quarter ends.`} /> <span className="mk warn">Unofficial</span></p></Block>
      <h3>Flat renewals</h3>
      {w.renewal === 'asking'
        ? <Block id="renew" cls="callout ask"><span className="co-ic"><Icon name="circle-help" size={16} /></span><p>Renewals with no price change skip approval, even over $100,000, but no rule explains it. <span className="ask-who"><Ag id="approvals" size={16} />Asking Maria Okafor in RevOps</span></p></Block>
        : <Block id="renew"><p><LiveText text="Flat renewals skip approval on purpose: it has been policy since 2023, because a flat renewal doesn’t change revenue risk." /></p></Block>}

      <h2>Configured in Salesforce</h2>
      <Block id="cfg" cls="tbl">
        <table>
          <thead><tr><th>Automation</th><th>Type</th><th>What it does</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td className="code">Large Deal Approval</td><td>Approval process</td><td><LiveText text={`Routes deals over $100,000: manager, Finance over ${f}%, CRO over 35%`} /></td><td><span className="mk">Active</span></td></tr>
            <tr><td className="code">Discount_Requires_Reason</td><td>Validation rule</td><td>Blocks a discount over 10% without a reason</td><td><span className="mk">Active</span></td></tr>
            <tr><td className="code">Amount_Locked_After_Approval</td><td>Validation rule</td><td>Only Deal Desk can change an approved amount</td><td><span className="mk">Active</span></td></tr>
            <tr id="b-cfg-cpq" className={w.presence?.block === 'cfg-cpq' ? 'editing' : ''}><td className="code">CPQ quote sync</td><td>Integration</td><td>Sends approved discounts to CPQ quotes</td><td>{w.cpq === 'failing' ? <span className="mk warn">Failing for multi-currency</span> : <span className="mk ok fresh">Fixed · 40 of 40 synced</span>} <Chip id="cfg-cpq" /> <Why id="cfg-cpq" /></td></tr>
          </tbody>
        </table>
      </Block>

      <p className="colo">Written by the <b>Approvals agent</b> from what it observed, never typed by a person. Every change is announced, typed in where you can see it, and kept with why it changed.</p>
    </article>
  )
}

/** Any other page: properties, its lede, and an honest note that the demo has one full page. */
export function Stub({ id }: { id: string }) {
  const w = useW(), p = PAGES[id], sp = SPACES.find((s) => s.ag === p.ag)!
  return (
    <article className="doc">
      <div className="doc-ic" aria-hidden="true"><Icon name={AG[p.ag].icon} size={28} /></div>
      <h1>{p.title}</h1>
      <Props ag={p.ag} re={p.re} />
      <Block id={'stub-' + id} cls="callout"><span className="co-ic"><Icon name="file-text" size={16} /></span><p>{p.lede}</p></Block>
      <p className="colo">One of {sp.total} pages the {AG[p.ag].name} agent keeps. This demo has one full page: <button className="wl" onClick={() => w.go('discount-approvals')}>Discount approvals</button>.</p>
    </article>
  )
}
