import { AREAS, LOOP } from './data'
import { FlowSvg, LoopSvg } from './Diagrams'
import { whoStr } from './logic'
import { useW } from './store'
import { TrustVectors } from './Trust'

const nf = (n: number) => n.toLocaleString()

export function Home() {
  const w = useW()
  const counts = { obs: w.obs, edits: w.edits, ver: w.ver, asks: w.asks }
  const openPage = (sec?: string) => w.go('page', { sec })
  return (
    <div className="page enter">
      <section className="welcome">
        <div className="kick">Northwind, as Asoka understands it</div>
        <h1>What you can trust Asoka with today, and what it needs to do more.</h1>
        <p>How reliable it is, how much already runs on its own, and what stands between here and full automation.</p>
      </section>
      <TrustVectors />
      <div className="hg">
        <div>
          <section className="box"><h2>In focus</h2><div className="bb feat">
            <div className="ft">
              <p><button className="wl" onClick={() => openPage()}>Opportunity approvals</button> is how Northwind reviews large deals before they move to Negotiation. Any deal over $100,000 needs approval, and who approves depends on the discount. Asoka watched 212 approvals this quarter.</p>
              <p style={{ fontSize: 14, color: 'var(--ink2)' }}>5 of 8 statements verified. Updated Oct 28.</p>
              <button className="wl" onClick={() => openPage()}>Open the page</button>
            </div>
            <div className="fthumb"><FlowSvg small /></div>
          </div></section>
          <section className="box"><h2>Unwritten rules Asoka found</h2><div className="bb"><ul className="dyk">
            <li>At quarter end, large deals are approved in Slack before Salesforce. <small>Learned from 9 #deal-desk threads.</small> <button className="wl" onClick={() => openPage('practice')}>Read more</button></li>
            <li>Approval requests expire after 14 days because two deals once closed on six-week-old prices. <small>From a 2024 #revops thread.</small></li>
            <li>Cases that mention data loss get escalated by hand, whatever their priority. <small>Seen in 11 of 11 cases.</small> <button className="wl" onClick={(e) => w.openPrev('Case escalation', e.currentTarget)}>Read more</button></li>
          </ul></div></section>
          <section className="box"><h2>How Asoka keeps this current</h2><div className="bb loop">
            <LoopSvg onStep={w.setLoopOn} />
            <ul className="lsteps" id="lsteps">{LOOP.map(([name, text, key], i) => (
              <li key={name} className={w.loopOn === i ? 'on' : ''}><b>{name}</b><span>{text}</span>{key && <em id={'lc-' + key}>{nf(counts[key])}</em>}</li>
            ))}</ul>
            <p className="scale"><b>1,284</b> pages, <b id="n-obs">{nf(w.obs)}</b> observations this week, <b>71%</b> checked by a person.</p>
          </div></section>
          <section className="box"><h2>Areas</h2><div className="bb areas">{AREAS.map(([name, pages, pct]) => (
            <button key={name} className={'area press' + (pct < 55 ? ' low' : '')} onClick={() => w.area(name)}><b>{name}</b><small>{pages} pages, {pct}% understood</small><div className="cb"><i style={{ width: pct + '%' }} /></div></button>
          ))}</div></section>
        </div>
        <div>
          <section className="box"><h2>What changed</h2><div className="bb"><ul className="news">
            <li><button className="wl" onClick={() => openPage('hist')}>Discounts over 35% now go straight to the CRO</button><small>It was 40% until Oct 28. 4 pages updated.</small></li>
            <li><button className="wl" onClick={(e) => w.openPrev('CPQ quote sync', e.currentTarget)}>CPQ quote sync is failing for multi-currency deals</button><small>Since Oct 29. Asoka asked Integrations why.</small></li>
            <li><button className="wl" onClick={(e) => w.openPrev('Deal Desk', e.currentTarget)}>Priya Shah now leads Deal Desk</button><small>From the org chart and #announcements.</small></li>
          </ul></div></section>
          <section className="box"><h2><span className="pdot" />Learning right now</h2><div className="bb"><ul className="feed" id="feed">{w.feed.map((f, i) => (
            <li key={f[1] + i} className={w.feedFresh && i === 0 ? 'in' : ''}><span className="k">{f[0]}</span><span>{f[1]}<small>{i === 0 && w.feedFresh ? 'Just now' : i === 0 ? '1 min ago' : i * 3 + ' min ago'}, updated <button className="wl" onClick={(e) => (f[2] === 'Opportunity approvals' ? openPage() : w.openPrev(f[2], e.currentTarget))}>{f[2]}</button></small></span></li>
          ))}</ul></div></section>
          <section className="box"><h2>Asoka is asking</h2><div className="bb"><ul className="news" id="asking">
            {w.newQs.map((x) => (
              <li key={x.id} className={x.fresh ? 'in' : ''}><button className="wl" onClick={() => (x.page ? w.go('page', { tab: 'talk' }) : w.showChat())}>{x.q}</button><small>{x.resolved ? `Answered by ${x.who} just now.` : `Asking ${whoStr(x)}, just now.`}</small></li>
            ))}
            <li><button className="wl" onClick={() => w.go('page', { tab: 'talk' })}>Do flat renewals skip approval on purpose?</button><small>{w.learned ? 'Answered by Maria Okafor just now.' : 'Asked Maria Okafor in RevOps, Oct 27.'}</small></li>
            <li><button className="wl" onClick={(e) => w.openPrev('CPQ quote sync', e.currentTarget)}>Why do multi-currency quotes fail to sync?</button><small>Asked Ben Ito in Integrations, 2 days ago.</small></li>
            <li><button className="wl" onClick={() => w.go('page', { tab: 'talk' })}>Do EMEA deals really go to Sofia first?</button><small>Watching the next EMEA approval.</small></li>
          </ul></div></section>
        </div>
      </div>
    </div>
  )
}
