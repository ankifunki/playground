import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AG, ago, PAGES, SPACES } from './data'
import { HowFlow, Sim } from './Flow'
import { Watch } from './Watch'
import { Icon } from './Icon'
import { Ag, Block, Chip, LivePulse, LiveText, Why } from './Live'
import { useW } from './store'

/** Notion-style properties: who keeps the page, who verified it, how fresh it is. Live values tick. */
function Props({ ag, re, verify, extra }: { ag: keyof typeof AG; re: number; verify?: ReactNode; extra?: ReactNode }) {
  const w = useW(), [t0] = useState(w.now)
  return (
    <dl className="props">
            <div><dt><Icon name="badge-check" size={15} />Verified by</dt><dd>{verify ?? 'Dana Ruiz'}</dd></div>
      <div><dt><Icon name="radio" size={15} />Last re-read</dt><dd className="num"><LivePulse />{ago(re + (w.now - t0) / 1000)}<span className="props-m">re-read every hour against Salesforce</span></dd></div>
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

/**
 * Path to full automation (Wikimind 4), for this page's job: upright bars, each one deal of the last 120. Solid runs on
 * its own, light asks a person first, amber is blocked by a gap. The legend names each look; what holds it back is said.
 */
export function PathBar({ own: o = 52, ask: a = 38, gaps = 'EMEA routing, flat renewals', card }: { own?: number; ask?: number; gaps?: string; card?: boolean }) {
  // Bars are 3px wide with a 3px gap, always; as many as fit the width, so the spacing never varies.
  const ref = useRef<HTMLDivElement>(null), [n, setN] = useState(100)
  useLayoutEffect(() => {
    const el = ref.current?.parentElement; if (!el) return
    const f = () => { const cs = getComputedStyle(el), w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); setN(Math.max(20, Math.floor((w + 3) / 6))) }; f()
    const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect()
  }, [])
  const own = Math.round(n * o / 100), ask = Math.round(n * a / 100), g = 100 - o - a
  return (
    <section className={'path' + (card ? ' card' : '')} aria-label={`Path to full automation: ${o}% runs on its own, ${a}% asks a person first, ${g}% blocked by gaps`}>
      <div className="path-h" style={{ width: n * 6 - 3 }}><span className="tk">Path to full automation</span><span className="path-n">{o}%<small>runs on its own</small></span></div>
      <div className="path-bars" aria-hidden="true" ref={ref} style={{ width: n * 6 - 3 }}>{Array.from({ length: n }, (_, i) => <i key={i} className={i < own ? 'own' : i < own + ask ? 'ask' : 'gap'} style={{ animationDelay: `${i * 5}ms` }} />)}</div>
      <p className="path-l"><span className="own">Runs on its own {o}%</span><span className="ask">Asks a person first {a}%</span><span className="gap">Blocked by gaps {g}%: {gaps}</span></p>
    </section>
  )
}

/** The demo page: Discount approvals, written and kept by the Approvals agent. */
export function Approvals() {
  const w = useW(), f = w.fin
  const verify = w.verify === 'checking' ? <span className="re-check"><i aria-hidden="true" />Dana Ruiz is re-checking a change</span> : <>Dana Ruiz</>
  return (
    <article className="doc">
      <h1>Discount approvals</h1>
      <p className="byline">Kept by <Ag id="approvals" name /><span className="by-sep" />Owned by Maria Okafor, RevOps</p>
      <p className="liveln"><LivePulse />{w.presence?.page === 'discount-approvals' ? <>Approvals agent is writing <b>{w.presence.label}</b></> : <>Re-reading 2 new #deal-desk threads</>}</p>
      <Props ag="approvals" re={4} verify={verify} extra={<>
        <div><dt><Icon name="layers" size={15} />Sources</dt><dd>16 sources: Salesforce config, 9 Slack threads, 4 tickets, 2 meetings</dd></div>
        <div><dt><Icon name="arrow-right" size={15} />Cited</dt><dd className="num">214 times this month, by 3 agents</dd></div>
      </>} />
      <PathBar />

      <Block id="sum" cls="lede">
        <p>Discount approval is how Northwind reviews big deals before they move to Negotiation. Any deal over $100,000 needs approval, and who approves depends on the discount. Most approvals finish in under four hours.</p>
      </Block>

      <h2>How it works</h2>
      <HowFlow />
      <h3>Try it out</h3>
      <Sim />
      <h3>Watch it</h3>
      <Watch />

      <h2>Who approves</h2>
      <Block id="who-mgr"><ul><li><LiveText id="who-mgr" text={`Up to ${f}% off: the sales manager approves on their own.`} /></li></ul></Block>
      <Block id="who-fin"><ul><li><LiveText id="who-fin" text={`From ${f}% to 35%: the sales manager, then Finance.`} /></li></ul></Block>
      <Block id="who-cro"><ul><li>Over 35%: the CRO approves directly.</li></ul></Block>

      <h2>Rules</h2>
      <Toggle id="r-exp" title="When a request expires"><p>An approval request expires after 14 days, and the rep has to submit it again. The rule exists because two deals closed on six-week-old prices in 2024.</p></Toggle>
      <Toggle id="r-after" title="After approval"><p>Once a deal is approved, only Deal Desk can change its amount. Discounts over 10% need a written reason.</p></Toggle>

      <h2>In practice</h2>
      <h3>Quarter-end approvals in Slack</h3>
      <Block id="qe"><p><LiveText id="qe" text={`At quarter end, Deal Desk approves large deals in #deal-desk first and logs them in Salesforce afterward: ${w.qe[0]} of the last ${w.qe[1]} quarter ends.`} /></p></Block>
      <h3>Flat renewals</h3>
      {w.renewal === 'asking'
        ? <Block id="renew" cls="callout ask"><span className="co-ic"><Icon name="circle-help" size={16} /></span><p>Renewals with no price change skip approval, even over $100,000, but no rule explains it. <span className="ask-who"><Ag id="approvals" size={16} />Asking Maria Okafor in RevOps</span></p></Block>
        : <Block id="renew"><p><LiveText id="renew" text="Flat renewals skip approval on purpose: it has been policy since 2023, because a flat renewal doesn’t change revenue risk." /></p></Block>}

      <h2>What touches this</h2>
      <Block id="cfg" cls="tbl">
        <table>
          <thead><tr><th>Automation</th><th>Type</th><th>What it does</th><th>Status</th><th aria-label="Trace" /></tr></thead>
          <tbody>
            <tr><td className="code">Large Deal Approval</td><td>Approval process</td><td><LiveText text={`Routes deals over $100,000: manager, Finance over ${f}%, CRO over 35%`} /></td><td><span className="st">Active</span></td><td /></tr>
            <tr><td className="code">Discount_Requires_Reason</td><td>Validation rule</td><td>Blocks a discount over 10% without a reason</td><td><span className="st">Active</span></td><td /></tr>
            <tr><td className="code">Amount_Locked_After_Approval</td><td>Validation rule</td><td>Only Deal Desk can change an approved amount</td><td><span className="st">Active</span></td><td /></tr>
            <tr id="b-cfg-cpq" className={w.presence?.block === 'cfg-cpq' ? 'editing' : ''}><td className="code">CPQ quote sync</td><td>Integration</td><td>Sends approved discounts to CPQ quotes</td><td>{w.cpq === 'failing' ? <span className="st warn">Failing for multi-currency</span> : <span className="st ok">Fixed · 40 of 40 synced</span>}<Chip id="cfg-cpq" /></td><td className="tc"><Why id="cfg-cpq" /></td></tr>
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
