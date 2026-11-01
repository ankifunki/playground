import type React from 'react'
import { QaSlot } from './Answer'
import { AREAS } from './data'
import { whoStr } from './logic'
import { useW } from './store'
import { TrustVectors } from './Trust'

const nf = (n: number) => n.toLocaleString()
const APPROVALS = 'Opportunity approvals'

type Row = { k: string; tone?: 'warn' | 'ok'; t: string; s: string; on: (e: React.MouseEvent<HTMLButtonElement>) => void; fresh?: boolean; id?: string }

/** One live line under the hero: what Asoka is reading this second. */
function Now() {
  const w = useW(), [kind, text, page] = w.feed[0]
  return (
    <p className="now" aria-live="polite">
      <span className="pdot" /><span className="tk">Right now</span>
      <span className="nt" key={w.feedTick}>
        <span className="nk">{kind}</span> {text}, updating{' '}
        <button className="wl" onClick={(e) => (page === APPROVALS ? w.go('page') : w.openPrev(page, e.currentTarget))}>{page}</button>
      </span>
    </p>
  )
}

export function Home() {
  const w = useW()
  const openPage = (sec?: string) => w.go('page', { sec })
  const prev = (name: string) => (e: React.MouseEvent<HTMLButtonElement>) => w.openPrev(name, e.currentTarget)
  // One feed for everything that is moving: changes, what Asoka is reading, and what it is asking.
  const rows: Row[] = [
    ...w.newQs.map((x): Row => ({ k: x.resolved ? 'Answered' : 'Asking', tone: x.resolved ? 'ok' : 'warn', t: x.q, s: x.resolved ? `${x.who} answered just now.` : `Asking ${whoStr(x)}, just now.`, on: () => w.showQa(x.qaId), fresh: x.fresh, id: x.id })),
    { k: 'Changed', t: 'Discounts over 35% now go straight to the CRO', s: 'It was 40% until Oct 28. 4 pages rewritten.', on: () => openPage('how') },
    { k: w.learned ? 'Answered' : 'Asking', tone: w.learned ? 'ok' : 'warn', t: 'Do flat renewals skip approval on purpose?', s: w.learned ? 'Maria Okafor answered just now. The page was rewritten.' : 'Asked Maria Okafor in RevOps, Oct 27.', on: () => (w.learned ? w.showRenewal() : openPage('practice')) },
    ...w.feed.slice(1, 3).map((f, i): Row => ({ k: f[0], t: f[1], s: `${(i + 1) * 5} min ago, updated ${f[2]}.`, on: (e) => (f[2] === APPROVALS ? openPage() : w.openPrev(f[2], e.currentTarget)), id: f[1] + i })),
    { k: 'Changed', t: 'CPQ quote sync is failing for multi-currency deals', s: 'Since Oct 29. Asoka asked Integrations why.', on: prev('CPQ quote sync') },
    { k: 'Asking', tone: 'warn', t: 'Do EMEA deals really go to Sofia first?', s: 'Seen once. Watching the next EMEA approval.', on: () => openPage() },
    { k: 'Changed', t: 'Priya Shah now leads Deal Desk', s: 'From the org chart and #announcements.', on: prev('Deal Desk') },
  ]
  return (
    <div className="page enter">
      <section className="welcome">
        <div className="kick">Northwind, as Asoka understands it</div>
        <h1>What you can trust Asoka with today, and what it needs to do more.</h1>
        <p>How reliable it is, how much already runs on its own, and what stands between here and full automation.</p>
        <Now />
      </section>
      <QaSlot where="home" sec="home" />
      <TrustVectors />
      <div className="hg">
        <section className="box moving">
          <h2>What’s moving<span className="sp2" /><span className="hmeta">Asoka is asking <span className="hcnt" id="n-asks">{w.asks}</span></span></h2>
          <div className="bb"><ul className="mv">{rows.map((r) => (
            <li key={r.id || r.t} className={r.fresh ? 'in' : ''}>
              <span className={'mk2 ' + (r.tone || '')}>{r.k}</span>
              <span><button className="wl" onClick={r.on}>{r.t}</button><small>{r.s}</small></span>
            </li>
          ))}</ul>
            <p className="scale"><b>1,284</b> pages, <b id="n-obs">{nf(w.obs)}</b> observations this week, <b>71%</b> checked by a person.</p>
          </div>
        </section>
        <section className="box">
          <h2>In focus</h2>
          <div className="bb feat">
            <button className="wl ftt" onClick={() => openPage()}>Opportunity approvals</button>
            <p>How Northwind reviews large deals before they move to Negotiation. Any deal over $100,000 needs approval, and who approves depends on the discount. Asoka watched 212 approvals this quarter.</p>
            <p className="aside">5 of 8 statements verified. Rewritten Oct 28.</p>
            <button className="wl" onClick={() => openPage()}>Open the page</button>
          </div>
        </section>
      </div>
      <div className="hg lower">
        <section className="box"><h2>Unwritten rules Asoka found</h2><div className="bb"><ul className="dyk">
          <li>At quarter end, large deals are approved in Slack before Salesforce. <small>Learned from 9 #deal-desk threads.</small> <button className="wl" onClick={() => openPage('practice')}>Read more</button></li>
          <li>Approval requests expire after 14 days because two deals once closed on six-week-old prices. <small>From a 2024 #revops thread.</small></li>
          <li>Cases that mention data loss get escalated by hand, whatever their priority. <small>Seen in 11 of 11 cases.</small> <button className="wl" onClick={prev('Case escalation')}>Read more</button></li>
        </ul></div></section>
        <section className="box"><h2>Areas</h2><div className="bb areas">{AREAS.map(([name, pages, pct]) => (
          <button key={name} className={'area press' + (pct < 55 ? ' low' : '')} onClick={() => w.area(name)}><b>{name}</b><small>{pages} pages, {pct}% understood</small><div className="cb"><i style={{ width: pct + '%' }} /></div></button>
        ))}</div></section>
      </div>
      <p className="demo"><span className="tk">Demo</span><button className="wl" onClick={w.arrive}>Open the page as someone arriving from Slack</button><span>or press S. Press L for Maria’s reply, A for a person to answer your question.</span></p>
    </div>
  )
}
