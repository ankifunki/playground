import { AREAS } from './data'
import { FICON, Tile } from './Pile'
import { AG, Ag } from './agents'
import { FlowSvg } from './Diagrams'
import { whoStr } from './logic'
import { useW } from './store'
import { TrustVectors } from './Trust'

const nf = (n: number) => n.toLocaleString()

export function Home() {
  const w = useW()
  const openPage = (sec?: string) => w.go('page', { sec })
  return (
    <div className="page enter">
      <section className="welcome">
        <div className="kick">Northwind, as the Asoka agents understand it</div>
        <h1>What you can trust the agents with today, and what they need to do more.</h1>
      </section>
      <TrustVectors />
      <div className="hg">
        <div>
          <section className="box"><h2>In focus</h2><div className="bb feat">
            <div className="ft">
              <p><button className="wl" onClick={() => openPage()}>Opportunity approvals</button> is how Northwind reviews large deals before they move to Negotiation. Any deal over $100,000 needs approval, and who approves depends on the discount. 212 approvals watched this quarter.</p>
              <p className="agline" style={{ fontSize: 14, color: 'var(--ink2)' }}><Ag id="approvals" name /> · 5 of 8 verified · updated Oct 28</p>
              <button className="wl" onClick={() => openPage()}>Open the page</button>
            </div>
            <div className="fthumb"><FlowSvg small /></div>
          </div></section>
          <section className="box"><h2>Unwritten rules the agents found</h2><div className="bb"><ul className="dyk">
            <li>At quarter end, large deals are approved in Slack before Salesforce. <small><b className="agw">Approvals</b> · 9 #deal-desk threads</small> <button className="wl" onClick={() => openPage('practice')}>Read more</button></li>
            <li>Approval requests expire after 14 days because two deals once closed on six-week-old prices. <small><b className="agw">Approvals</b> · #revops, 2024</small></li>
            <li>Cases that mention data loss get escalated by hand, whatever their priority. <small><b className="agw">Support</b> · 11 of 11 cases</small> <button className="wl" onClick={(e) => w.openPrev('Case escalation', e.currentTarget)}>Read more</button></li>
          </ul></div></section>
          <section className="box"><h2>Areas</h2><div className="bb areas">{AREAS.map(([name, pages, pct]) => (
            <button key={name} className={'area press' + (pct < 55 ? ' low' : '')} onClick={() => w.area(name)}><b>{name}</b><small>{pages} pages, {pct}% understood</small><div className="cb"><i style={{ width: pct + '%' }} /></div></button>
          ))}</div></section>
        </div>
        <div>
          <section className="box"><h2>What changed</h2><div className="bb"><ul className="news">
            <li><button className="wl" onClick={() => openPage('hist')}>Discounts over 35% now go straight to the CRO</button><small><b className="agw">Approvals</b> · was 40% until Oct 28</small></li>
            <li><button className="wl" onClick={(e) => w.openPrev('CPQ quote sync', e.currentTarget)}>CPQ quote sync is failing for multi-currency deals</button><small><b className="agw">Integrations</b> · since Oct 29, asked Ben Ito why</small></li>
            <li><button className="wl" onClick={(e) => w.openPrev('Deal Desk', e.currentTarget)}>Priya Shah now leads Deal Desk</button><small><b className="agw">Access</b> · org chart, #announcements</small></li>
          </ul></div></section>
          <section className="box"><h2><span className="pdot" />Learning right now</h2><div className="bb"><ul className="feed" id="feed">{w.feed.map((f, i) => (
            <li key={f[1] + i} className={w.feedFresh && i === 0 ? 'in' : ''}><Tile icon={FICON[f[0]] || 'eye'} label={f[0]} /><span>{f[1]}<small><b className="agw">{AG[f[3]].name}</b> · {i === 0 && w.feedFresh ? 'Just now' : i === 0 ? '1 min ago' : i * 3 + ' min ago'}, updated <button className="wl" onClick={(e) => (f[2] === 'Opportunity approvals' ? openPage() : w.openPrev(f[2], e.currentTarget))}>{f[2]}</button></small></span></li>
          ))}</ul>
            <p className="scale"><b>1,284</b> pages, <b id="n-obs">{nf(w.obs)}</b> observations this week, <b>71%</b> checked by a person.</p></div></section>
          <section className="box"><h2>Agents asking <span className="hcnt" id="n-asks">{w.asks}</span></h2><div className="bb"><ul className="news" id="asking">
            {w.newQs.map((x) => (
              <li key={x.id} className={x.fresh ? 'in' : ''}><button className="wl" onClick={() => (x.page ? w.go('page', { tab: 'talk' }) : w.showChat())}>{x.q}</button><small><b className="agw">{AG[x.agent].name}</b> · {x.resolved ? `${x.who} answered just now` : `asking ${whoStr(x)} · just now`}</small></li>
            ))}
            <li><button className="wl" onClick={() => w.go('page', { tab: 'talk' })}>Do flat renewals skip approval on purpose?</button><small><b className="agw">Approvals</b> · {w.learned ? 'Maria Okafor answered just now' : 'asked Maria Okafor, RevOps · Oct 27'}</small></li>
            <li><button className="wl" onClick={(e) => w.openPrev('CPQ quote sync', e.currentTarget)}>Why do multi-currency quotes fail to sync?</button><small><b className="agw">Integrations</b> · asked Ben Ito · 2 days ago</small></li>
            <li><button className="wl" onClick={() => w.go('page', { tab: 'talk' })}>Do EMEA deals really go to Sofia first?</button><small><b className="agw">Approvals</b> · seen once, watching the next one</small></li>
          </ul></div></section>
        </div>
      </div>
    </div>
  )
}
