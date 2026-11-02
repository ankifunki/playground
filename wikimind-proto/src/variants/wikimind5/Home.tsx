import { QaSlot } from './Answer'
import { AG, Ag } from './agents'
import { Pile } from './Claim'
import { Corpus } from './Corpus'
import { ASKS, CHANGED, LEARNED, type Story } from './data'
import { Icon } from './Icon'
import { Ago } from './Job'
import { whoStr } from './logic'
import { useW } from './store'

const DATE = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

/** The approval thresholds as a strip: who approves at each discount, with the old line struck through. */
function Thresholds({ fin, was }: { fin: number; was: { at: number; label: string } }) {
  const pct = (n: number) => (n / 50) * 100 + '%'
  return (
    <div className="thr" role="img" aria-label={`Sales manager up to ${fin}%, Finance added over ${fin}%, CRO over 35%. Previously ${was.label}.`}>
      <div className="thr-bar">
        <span className="thr-s m" style={{ left: 0, width: pct(fin) }}><b>Manager</b></span>
        <span className="thr-s f" style={{ left: pct(fin), width: pct(35 - fin) }}><b>+ Finance</b></span>
        <span className="thr-s c" style={{ left: pct(35), width: pct(15) }}><b>CRO</b></span>
        <span className="thr-was" style={{ left: pct(was.at) }}><small>was {was.at}%</small></span>
      </div>
      <div className="thr-ax">{[0, 10, 20, 30, 40, 50].map((n) => <span key={n} style={{ left: pct(n) }}>{n}%</span>)}</div>
    </div>
  )
}

/** The lead story: the biggest change in Northwind's Salesforce. It is replaced live when a new change lands. */
function Lead() {
  const w = useW(), live = w.cfg !== 'idle'
  return (
    <article className="hm-lead" id="lead">
      <div className="hm-k">
        {live ? <span className="tdone info"><span className="pdot" />Just now</span> : <span className="tk">Oct 28</span>}
        <span className="tk">Changed in Salesforce</span>
      </div>
      <h2>{live ? 'Finance now reviews discounts over 25%, not 20%' : 'Discounts over 35% now go straight to the CRO'}</h2>
      <p className="hm-deck">{live
        ? 'Priya Shah changed the approval step a moment ago. The Approvals agent saw it, rewrote Discount approvals, and asked Dana to re-check.'
        : 'The CRO threshold dropped from 40%. The Approvals agent rewrote 4 pages and has routed 23 deals by the new rule since.'}</p>
      <Thresholds fin={w.fin} was={live ? { at: 20, label: 'Finance over 20%' } : { at: 40, label: 'CRO over 40%' }} />
      <div className="hm-by">
        <Ag id="approvals" name />
        <span className={'tdone' + (live && w.cfg === 'changed' ? ' wait' : '')}>{live ? (w.cfg === 'changed' ? 'Dana is re-checking' : 'Verified by Dana just now') : 'Verified by Dana Ruiz'}</span>
        <Pile ns={live ? [15] : [3, 12]} />
        <button className="wl" onClick={() => (live ? w.showCfg() : w.showClaims([3, 12]))}>Read it on the page</button>
      </div>
    </article>
  )
}

/** The live wire: what each agent is doing right now. Pausable. */
function Wire() {
  const w = useW()
  return (
    <aside className="hm-wire" aria-label="Live">
      <div className="hm-wh"><span className={'hm-live' + (w.wireOn ? '' : ' off')}><Icon name="radio" size={16} />{w.wireOn ? 'Live' : 'Paused'}</span>
        <button className="ibtn sm" onClick={w.toggleWire} aria-label={w.wireOn ? 'Pause live updates' : 'Resume live updates'} title={w.wireOn ? 'Pause' : 'Resume'}><Icon name={w.wireOn ? 'pause' : 'play'} size={14} /></button></div>
      <ol>{w.wire.map((x, i) => (
        <li key={x.id} className={i === 0 && x.id > 0 ? 'in' : ''}>
          <Ag id={x.ag} />
          <span><span className="hm-wt">{x.t}</span><small><b className="agw">{AG[x.ag].name}</b> · {i === 0 ? 'just now' : `${i * 5}s ago`} · <button className="wl" onClick={(e) => (x.page === 'Discount approvals' ? (x.ns ? w.showClaims(x.ns) : w.go('page')) : w.openPrev(x.page, e.currentTarget))}>{x.page}</button></small></span>
        </li>
      ))}</ol>
    </aside>
  )
}

function StoryCol({ title, items, icon }: { title: string; items: Story[]; icon: 'pencil-line' | 'eye' }) {
  const w = useW()
  return (
    <section className="hm-col">
      <h3><Icon name={icon} size={16} />{title}</h3>
      <ul>{items.map((s) => (
        <li key={s.t}>
          <button className="hm-st" onClick={(e) => (s.sec ? (s.ns ? w.showClaims(s.ns) : w.go('page', { sec: s.sec })) : w.openPrev(s.page!, e.currentTarget))}>{s.t}</button>
          <p>{s.s}</p>
          <div className="hm-meta"><Ag id={s.ag} name suffix="" />{s.tag && <span className={'tdone' + (s.tag[1] === 'warn' ? ' wait' : s.tag[1] === 'info' ? ' info' : '')}>{s.tag[0]}</span>}{s.ns && <Pile ns={s.ns} max={3} />}</div>
        </li>
      ))}</ul>
    </section>
  )
}

function AskCol() {
  const w = useW()
  return (
    <section className="hm-col" id="asking-col">
      <h3><Icon name="circle-help" size={16} />Asking people <span className="hcnt" id="n-asks">{w.asks}</span></h3>
      <ul>
        {w.newQs.map((x) => (
          <li key={x.id} className={x.fresh ? 'in' : ''}>
            <button className="hm-st" onClick={() => w.showQa(x.qaId)}>{x.q}</button>
            <p>{x.resolved ? `${x.who} answered just now.` : `Asking ${whoStr(x)}.`}</p>
            <div className="hm-meta"><Ag id={x.agent} name suffix="" /><span className={'tdone' + (x.resolved ? '' : ' wait')}>{x.resolved ? 'Answered' : 'Asking'}</span></div>
          </li>
        ))}
        {ASKS.map((a, i) => {
          const done = i === 0 && w.learned
          return (
            <li key={a.q}>
              <button className="hm-st" onClick={(e) => (i === 0 ? (w.learned ? w.showRenewal() : w.go('page', { sec: 'practice' })) : a.sec ? w.go('page', { sec: a.sec }) : w.openPrev(a.page!, e.currentTarget))}>{a.q}</button>
              <p>{done ? 'Maria Okafor answered. The page was rewritten.' : a.who === 'Watching' ? a.s : `${a.who}, ${a.s}`}</p>
              <div className="hm-meta"><Ag id={a.ag} name suffix="" /><span className={'tdone' + (done ? '' : ' wait')}>{done ? 'Answered' : a.who === 'Watching' ? 'Watching' : 'Asking'}</span></div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function Home() {
  const w = useW()
  return (
    <div className="page enter hm">
      <div className="hm-mast">
        <div>
          <h1>Today at Northwind</h1>
          <div className="hm-date"><span className="tk">{DATE}</span><span className="tk">Written live by 6 agents</span><span className="tk"><Ago prefix="Updated" /></span></div>
        </div>
        <div className="hm-side">
          <button className="hm-tour press" onClick={w.startTour}><Icon name="play" size={14} />Take the 1-minute tour</button>
        </div>
      </div>
      <QaSlot where="home" sec="home" />
      <Corpus />
      <div className="hm-top">
        <Lead />
        <Wire />
      </div>
      <div className="hm-cols">
        <StoryCol title="Changed" items={CHANGED} icon="pencil-line" />
        <StoryCol title="Learned" items={LEARNED} icon="eye" />
        <AskCol />
      </div>
      <p className="demo"><span className="tk">Demo</span><button className="wl" onClick={w.arrive}>Arrive from Slack</button><button className="wl" onClick={w.startTour}>Take the tour</button></p>
    </div>
  )
}
