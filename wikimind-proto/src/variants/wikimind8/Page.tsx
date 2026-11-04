import type React from 'react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AG, ago, PAGES } from './data'
import { Sim } from './Flow'
import { HELIOS, How, type Deal } from './How'
import { Icon } from './Icon'
import { Ag, Block, Chip, LivePulse, LiveText, Sources, useTraceTarget } from './Live'
import { RM, useW } from './store'
import { Toc, type TocItem } from './Toc'

/** Notion-style properties: who keeps the page, who verified it, how fresh it is. Live values tick. */
function Props({ ag, re, verify, extra }: { ag: keyof typeof AG; re: number; verify?: ReactNode; extra?: ReactNode }) {
  const w = useW(), [t0] = useState(w.now)
  return (
    <dl className="props">
            <div><dt><Icon name="badge-check" size={16} />Verified by</dt><dd className="vf-d"><span key={w.verify} className="vf">{verify ?? 'Dana Ruiz'}</span></dd></div>
      <div><dt><Icon name="scan-eye" size={16} />Last checked</dt><dd className="num"><i className="ldot" aria-hidden="true" />{ago(re + (w.now - t0) / 1000)}<span className="props-m">hourly, against Salesforce</span></dd></div>
      {extra}
    </dl>
  )
}

function Toggle({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Block id={id} cls="tg">
      <button className={'tg-h' + (open ? ' open' : '')} aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="chevron-right" size={14} />{title}</button>
      <div className={'tg-x' + (open ? ' open' : '')} inert={!open}><div className="tg-b">{children}</div></div>
    </Block>
  )
}

/**
 * Path to full automation (Wikimind 4), for this page's job: upright bars, each one deal of the last 120. Solid runs on
 * its own, light asks a person first, amber is blocked by a gap. The legend names each look; what holds it back is said.
 */
export function PathBar({ own: o = 52, ask: a = 38, gaps = 'EMEA routing, flat renewals', card, label = true }: { own?: number; ask?: number; gaps?: string; card?: boolean; label?: boolean }) {
  // Bars are 4px wide with a 2px gap, always; as many as fit the width, so the spacing never varies.
  const ref = useRef<HTMLDivElement>(null), [n, setN] = useState(100)
  useLayoutEffect(() => {
    const el = ref.current?.parentElement; if (!el) return
    const f = () => { const cs = getComputedStyle(el), w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); setN(Math.max(20, Math.floor((w + 2) / 6))) }; f()
    const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect()
  }, [])
  const own = Math.round(n * o / 100), ask = Math.round(n * a / 100), g = 100 - o - a
  return (
    <section className={'path' + (card ? ' card' : '')} aria-label={`Path to full automation: ${o}% runs on its own, ${a}% asks a person first, ${g}% blocked by gaps`}>
      <div className="path-h" style={{ width: n * 6 - 2 }}>{label && <span className="tk">Path to full automation</span>}<span className="path-n">{o}%<small>runs on its own</small></span></div>
      <div className="path-bars" aria-hidden="true" ref={ref} style={{ width: n * 6 - 2 }}>{Array.from({ length: n }, (_, i) => <i key={i} className={i < own ? 'own' : i < own + ask ? 'ask' : 'gap'} style={{ animationDelay: `${i * 5}ms` }} />)}</div>
      <p className="path-l"><span className="own">Runs on its own {o}%</span><span className="ask">Asks a person first {a}%</span><span className="gap">Blocked {g}%: {gaps}</span></p>
    </section>
  )
}

const SECTIONS: TocItem[] = [
  { id: 'how', t: 'How it works', blocks: ['flow'] },
  { id: 'who', t: 'Who approves', blocks: ['who-mgr', 'who-fin', 'who-cro'] },
  { id: 'rules', t: 'Rules', blocks: ['r-exp', 'r-after'] },
  { id: 'practice', t: 'In practice', blocks: ['qe', 'renew'] },
  { id: 'touches', t: 'What touches this', blocks: ['cfg', 'cfg-cpq'] },
  { id: 'cited', t: 'Cited by the agents' },
  { id: 'related', t: 'Related pages' },
]

/** Where agents used this page to justify an action, newest first. Each cites one block, which the link opens. Demo data. */
const CITES: { ag: 'approvals' | 'finance'; what: React.ReactNode; where: string; block: string; label: string }[] = [
  { ag: 'approvals', what: <>Pushed back on approving <b>Orion platform</b> at 38% off without the CRO.</>, where: 'Slack · #deal-desk · 2 h ago', block: 'who-cro', label: 'Who approves' },
  { ag: 'approvals', what: <>Told a rep that <b>Kestrel new logo</b> needs no approval: $64,000 is under $100,000.</>, where: 'Ticket SF-4182 · yesterday', block: 'sum', label: 'the summary' },
  { ag: 'finance', what: <>Asked Sam Ortiz to resubmit a 16-day-old request for <b>Atlas renewal</b>.</>, where: 'Slack DM · Oct 30', block: 'r-exp', label: 'When a request expires' },
]
const RELATED = ['discount-policy', 'quarter-end', 'renewals', 'cpq-sync']

/** The demo page: Discount approvals, written and kept by the Approvals agent. */
export function Approvals() {
  const w = useW(), f = w.fin, cpqTarget = useTraceTarget('cfg-cpq')
  // How it works plays Helios by default; Try it out can hand it the visitor's own deal.
  const [demo, setDemo] = useState<{ deal: Deal; run: number }>({ deal: HELIOS, run: 0 })
  const verify = w.verify === 'checking' ? <span className="re-check"><i aria-hidden="true" />Dana Ruiz is re-checking a change</span> : <>Dana Ruiz</>
  return (
    <article className="doc">
      <h1>Discount approvals</h1>
      <p className="byline">Kept by <Ag id="approvals" name /><span className="by-sep" />Owned by Maria Okafor, RevOps</p>
      <p className="liveln"><LivePulse />{w.presence?.page === 'discount-approvals' ? <>Approvals agent is writing <b>{w.presence.label}</b></> : <>Re-reading 2 new #deal-desk threads</>}</p>
      <Props ag="approvals" re={4} verify={verify} extra={<>
        <div><dt><Icon name="layers" size={16} />Sources</dt><dd>Salesforce config, 9 Slack threads, 4 tickets, 2 meetings</dd></div>
        <div><dt><Icon name="arrow-right" size={16} />Cited</dt><dd className="num"><button className="wl" onClick={() => document.getElementById('cited')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' })}>214 times this month, by 3 agents</button></dd></div>
      </>} />

      <PathBar label={false} />

      <Block id="sum" cls="lede">
        <p><span className="lt">Deals over $100,000 need approval before they move to Negotiation. The discount decides who approves. Most approvals take under four hours.</span></p>
      </Block>

      <Toc items={SECTIONS} />

      <h2 id="how">How it works</h2>
      <How deal={demo.deal} run={demo.run} onReset={() => setDemo((d) => ({ deal: HELIOS, run: d.run + 1 }))} />
      <h3>Try it out</h3>
      <Sim onWatch={(d) => { setDemo((x) => ({ deal: { name: 'Your deal', ...d }, run: x.run + 1 })); document.querySelector('.hwk')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }) }} />

      <h2 id="who">Who approves</h2>
      <Block id="who-mgr"><ul><li><LiveText id="who-mgr" text={`Up to ${f}% off: the sales manager approves alone.`} /></li></ul></Block>
      <Block id="who-fin"><ul><li><LiveText id="who-fin" text={`From ${f}% to 35%: the sales manager, then Finance.`} /></li></ul></Block>
      <Block id="who-cro"><ul><li><span className="lt">Over 35%: the CRO approves directly.</span></li></ul></Block>

      <h2 id="rules">Rules</h2>
      <Toggle id="r-exp" title="When a request expires"><p><span className="lt">Requests expire after 14 days, and the rep resubmits. Added in 2024, after two deals closed on six-week-old prices.</span></p></Toggle>
      <Toggle id="r-after" title="After approval"><p><span className="lt">Once a deal is approved, only Deal Desk can change its amount. Discounts over 10% need a written reason.</span></p></Toggle>

      <h2 id="practice">In practice</h2>
      <h3>Quarter-end approvals in Slack</h3>
      <Block id="qe"><p><LiveText id="qe" text={`At quarter end, Deal Desk approves large deals in #deal-desk, then logs them in Salesforce (${w.qe[0]} of the last ${w.qe[1]} quarter ends).`} /></p></Block>
      <h3>Flat renewals</h3>
      <Block id="renew" cls={'callout' + (w.renewal === 'asking' ? ' ask' : ' answered')}>
        <p><LiveText id="renew" text={w.renewal === 'asking' ? 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.' : 'Flat renewals skip approval on purpose: policy since 2023, because they don’t change revenue risk.'} />
          {w.renewal === 'asking' && <span className="ask-who"><Ag id="approvals" size={16} />Asking Maria Okafor in RevOps</span>}</p>
      </Block>

      <h2 id="touches">What touches this</h2>
      <Block id="cfg" cls="tbl">
        <table>
          <thead><tr><th>Automation</th><th>Type</th><th>What it does</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td className="code">Large Deal Approval</td><td>Approval process</td><td><LiveText text={`Routes deals over $100,000: manager, Finance over ${f}%, CRO over 35%`} /></td><td><span className="st">Active</span></td><td /></tr>
            <tr><td className="code">Discount_Requires_Reason</td><td>Validation rule</td><td>Blocks a discount over 10% without a reason</td><td><span className="st">Active</span></td><td /></tr>
            <tr><td className="code">Amount_Locked_After_Approval</td><td>Validation rule</td><td>Only Deal Desk can change an approved amount</td><td><span className="st">Active</span></td><td /></tr>
            <tr id="b-cfg-cpq" className={'trc' + (w.presence?.block === 'cfg-cpq' ? ' editing' : '') + (w.trace === 'cfg-cpq' ? ' traced' : '')} {...cpqTarget}><td className="code">CPQ quote sync</td><td>Integration</td><td>Sends approved discounts to CPQ quotes</td><td>{w.cpq === 'failing' ? <span className="st warn">Failing for multi-currency</span> : <span className="st ok">Fixed · 40 of 40 synced</span>}<Chip id="cfg-cpq" /></td></tr>
          </tbody>
        </table>
      </Block>

      <h2 id="cited">Cited by the agents</h2>
      <ul className="cites">
        {CITES.map((c) => (
          <li key={c.where}>
            <Ag id={c.ag} size={24} />
            <div><p>{c.what}</p><small>{c.where} · cited <button className="wl" onClick={() => w.jump(c.block)}>{c.label}</button></small></div>
          </li>
        ))}
      </ul>

      <h2 id="related">Related pages</h2>
      <ul className="related">
        {RELATED.map((id) => (
          <li key={id}><button onClick={() => w.go(id)}><Ag id={PAGES[id].ag} size={28} /><b>{PAGES[id].title}</b><span>{PAGES[id].lede}</span></button></li>
        ))}
      </ul>

      <Sources items={[{ ic: 'cloud', name: 'Salesforce config: Large Deal Approval, 2 validation rules' }, { ic: 'hash', name: 'Slack: 9 threads in #deal-desk and #revops' }, { ic: 'ticket', name: 'Tickets: 4' }, { ic: 'video', name: 'Meetings: 2 RevOps weeklies' }]}>
        Written by the <b>Approvals agent</b> from <b>16 sources</b>. 5 of 8 statements verified by a person. Rewritten 6 times as Rippling changed.
      </Sources>
    </article>
  )
}

/** Any other page: properties, its lede, and an honest note that the demo has one full page. */
export function Stub({ id }: { id: string }) {
  const w = useW(), p = PAGES[id]
  return (
    <article className="doc">
      <div className="doc-ic" aria-hidden="true"><Icon name={AG[p.ag].icon} size={28} /></div>
      <h1>{p.title}</h1>
      <Props ag={p.ag} re={p.re} />
      <Block id={'stub-' + id} cls="callout"><span className="co-ic"><Icon name="file-text" size={16} /></span><p>{p.lede}</p></Block>
      <p className="colo">This demo writes out one page in full. <button className="wl" onClick={() => w.go('discount-approvals')}>Open Discount approvals</button></p>
    </article>
  )
}
