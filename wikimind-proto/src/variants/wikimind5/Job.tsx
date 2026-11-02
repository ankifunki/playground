import { useEffect, useRef, useState } from 'react'
import { QaSlot } from './Answer'
import { Ag, AgentPile, type AgentId } from './agents'
import { C, Margin, Pile } from './Claim'
import { ARRIVAL, REFS, tierOf, type Mark } from './data'
import { Icon, type IconName } from './Icon'
import { RM } from './logic'
import { Sim } from './Sim'
import { useW } from './store'

const OLD_RENEWAL = 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.'
const SEEN_ONCE: Mark = { t: 'Seen once', tone: 'warn' }
const CHANGED: Mark = { t: 'Changed Oct 28', tone: 'info' }

const NAV: [string, string, IconName][] = [['lead', 'Summary', 'text'], ['try', 'Try a deal', 'play'], ['rules', 'The rules', 'shield-check'], ['practice', 'In practice', 'eye'], ['config', 'Configured', 'sliders'], ['used', 'Cited by agents', 'receipt']]
const goSec = (id: string) => document.getElementById('s-' + id)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' })

/** Section nav with icons. A rail beside the page on wide screens, a sticky row of chips otherwise. */
function PageNav({ kind }: { kind: 'rail' | 'chips' }) {
  const [on, setOn] = useState('lead')
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setOn(e.target.id.slice(2)) }), { rootMargin: '-120px 0px -65% 0px' })
    document.querySelectorAll('.art-body section[id^="s-"]').forEach((x) => io.observe(x))
    return () => io.disconnect()
  }, [])
  return (
    <nav className={'pnav ' + kind} aria-label="On this page">
      {NAV.map(([id, label, ic]) => (
        <button key={id} className={on === id ? 'on' : ''} aria-current={on === id ? 'true' : undefined} onClick={() => goSec(id)}>
          <Icon name={ic} size={18} /><span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

/** An inline link to another page. The corpus is flat: pages link to each other from inside sentences. */
function L({ to, children }: { to: string; children?: string }) {
  const w = useW()
  return <button className="wl il" onClick={(e) => w.openPrev(to, e.currentTarget)}>{children || to}</button>
}

function Dots({ on, off = 0 }: { on: number; off?: number }) {
  return <div className="dots" aria-hidden="true">{Array.from({ length: on }, (_, i) => <i key={i} />)}{Array.from({ length: off }, (_, i) => <i key={'n' + i} className="n" />)}</div>
}

/** "Updated 4s ago", ticking. Its own timer, so the page doesn't re-render every second. */
export function Ago({ prefix = 'Updated' }: { prefix?: string }) {
  const w = useW(), [, tick] = useState(0)
  useEffect(() => { const t = window.setInterval(() => tick((n) => n + 1), 1000); return () => window.clearInterval(t) }, [])
  const s = Math.max(1, Math.round((Date.now() - w.lastObs) / 1000))
  return <span className="ago"><span className="pdot" />{prefix} {s < 60 ? s + 's' : Math.round(s / 60) + 'm'} ago</span>
}

/** The open question lives where the doubt is. When Maria answers, the card rewrites itself in place. */
function Renewal() {
  const w = useW()
  if (w.learned) return (
    <div className={'obs done' + (w.diffPlay ? ' upd' : '')} id="renewal">
      <div className="ok2">Maria answered the Approvals agent just now</div>
      <p className={'was' + (w.diffPlay ? ' anim' : '')}><del>{OLD_RENEWAL}</del></p>
      <p className={w.diffPlay ? 'write' : ''}><C ns={[11, 14]} mark={{ t: 'Changed just now', tone: 'ok' }}>Flat <L to="Renewals">renewals</L> skip approval on purpose. It has been the policy since 2023, because flat renewals don’t change revenue risk.</C></p>
      <div className="said">“Yes, on purpose since 2023. Flat renewals don’t change revenue risk.” <span>Maria Okafor, RevOps</span></div>
    </div>
  )
  return (
    <div className="obs" id="renewal">
      <div className="ok2">Open question · Approvals agent asked Maria, Oct 27</div>
      <p><C ns={[11]}>{OLD_RENEWAL}</C></p>
      <Dots on={14} />
      <div className="dl">14 of 14 flat renewals last quarter</div>
      <div className="wait">{w.talkTyping ? <><span className="typing"><i /><i /><i /></span>Maria is replying</> : <button className="wl" onClick={w.learn}>Simulate her reply</button>}</div>
    </div>
  )
}

/** Arriving from Slack: the agent pushed back on your request and cited this page. */
function Arrival() {
  const w = useW()
  if (!w.arrival) return null
  return (
    <section className="arrive" aria-label="Why you are here">
      <div className="qah"><span className="tk arrk"><Icon name="hash" size={14} />Approvals agent’s reply in {ARRIVAL.channel}</span><button className="ibtn sm" onClick={w.leaveArrival} aria-label="Read the whole page" title="Read the whole page"><Icon name="x" size={16} /></button></div>
      <p className="qq">{ARRIVAL.who}: “{ARRIVAL.q}”</p>
      <p className="qan">{ARRIVAL.a}</p>
      <div className="qsrc qfoot"><Pile ns={ARRIVAL.ns} /><button className="wl" onClick={() => w.showClaims(ARRIVAL.ns)}>Show the rule</button><button className="wl" onClick={() => w.tryDeal(ARRIVAL.deal.amt, ARRIVAL.deal.disc)}>Try your deal</button></div>
    </section>
  )
}

/** How a person can trust this page: how much a person checked, how fresh it is, and how much the agents rely on it. */
function TrustLine({ sents }: { sents: number[][] }) {
  const w = useW(), ok = sents.filter((ns) => tierOf(ns, w.cfg === 'changed') === 'ok').length
  return (
    <div className="tline" aria-label="How far to trust this page">
      <div><span className="tk">Checked by a person</span><b>{ok} of {sents.length}</b><small>sentences, by Dana Ruiz</small></div>
      <div><span className="tk">Last observed</span><b><Ago prefix="" /></b><small>212 approvals watched this quarter</small></div>
      <div><span className="tk">Cited by agents</span><b>{214 + (w.receipts.some((r) => r.id === 'r0') ? 1 : 0)} times</b><small>this month, to justify what they did</small></div>
    </div>
  )
}

/* ---------- How it's configured: what touches the Opportunity object, and why each thing exists ---------- */
function Config() {
  const w = useW(), ch = w.cfg !== 'idle'
  const autos: { type: string; name: string; ns: number[]; does: string; st: [string, 'ok' | 'warn' | 'info']; ag: AgentId }[] = [
    { type: 'Approval process', name: 'Large Deal Approval', ns: ch ? [2, 15] : [2, 13], does: `Locks deals over $100,000 and routes them: the manager, Finance over ${w.fin}%, the CRO over 35%.`, st: ch ? ['Changed just now', 'info'] : ['Changed Oct 28', 'info'], ag: 'approvals' },
    { type: 'Validation rule', name: 'Discount_Requires_Reason', ns: [16], does: 'Blocks a discount over 10% without a written reason.', st: ['Healthy', 'ok'], ag: 'finance' },
    { type: 'Validation rule', name: 'Amount_Locked_After_Approval', ns: [8], does: 'Lets only Deal Desk change the amount once a deal is approved.', st: ['Healthy', 'ok'], ag: 'finance' },
    { type: 'Flow', name: 'Notify_Deal_Desk', ns: [17], does: 'Posts approved deals over $500,000 to #deal-desk.', st: ['Healthy', 'ok'], ag: 'approvals' },
    { type: 'Integration', name: 'CPQ quote sync', ns: [18], does: 'Sends approved discounts to CPQ quotes.', st: ['Failing for multi-currency', 'warn'], ag: 'integrations' },
  ]
  return (
    <div className="cfg">
      <div className="cfg-obj">
        <span className="tk">Object</span><b>Opportunity</b>
        <div className="cfg-f">{['Amount', 'Discount__c', 'Discount_Reason__c', 'StageName'].map((f) => <code key={f}>{f}</code>)}</div>
        <small>5 automations touch this process</small>
      </div>
      <ul className="cfg-l">{autos.map((a) => (
        <li key={a.name}>
          <div className="cfg-h"><span className="tk">{a.type}</span><span className={'tdone' + (a.st[1] === 'warn' ? ' wait' : a.st[1] === 'info' ? ' info' : '')}>{a.st[0]}</span></div>
          <code className="cfg-n">{a.name}</code>
          <p><C ns={a.ns}>{a.does}</C></p>
          <div className="cfg-by"><Ag id={a.ag} name suffix=" agent watches it" /></div>
        </li>
      ))}</ul>
    </div>
  )
}

/* ---------- Receipts: where agents cited this page to justify what they did ---------- */
function Receipts() {
  const w = useW()
  return (
    <ol className="rc">{w.receipts.map((r) => (
      <li key={r.id} className={r.id === 'r0' ? 'in' : ''}>
        <div className="rc-h"><Ag id={r.ag} name /><span className="tk">{r.when} · {r.ch}</span></div>
        <p className="rc-did">{r.did}</p>
        <button className="rc-why" onClick={() => w.showClaims(r.ns)}><Pile ns={r.ns} max={2} /><span>Because: “{r.why}”</span></button>
        {r.out && <p className="rc-out">{r.out}</p>}
      </li>
    ))}</ol>
  )
}

export function Job() {
  const w = useW(), finNs = w.fin === 20 ? [13] : [15]
  const cfgMark: Mark | undefined = w.cfg === 'changed' ? { t: 'Changed just now · re-checking', tone: 'warn' } : w.cfg === 'verified' ? { t: 'Changed just now', tone: 'ok' } : undefined
  const sents = [[1], [2], [3, ...finNs], [4], [5], finNs, [3, 12], [6], [7], [8], [16], [9, 10], w.learned ? [11, 14] : [11]]
  const verified = Object.values(REFS).filter((r) => r.v).length
  // Live events while you read: an agent cites this page; Salesforce changes; Maria answers. Presenter keys do the same (C, L).
  const fn = useRef(w); fn.current = w
  useEffect(() => {
    const t = [
      window.setTimeout(() => fn.current.addLiveReceipt(), RM ? 4000 : 12000),
      window.setTimeout(() => fn.current.observeChange(), RM ? 9000 : 26000),
      window.setTimeout(() => fn.current.learn(), RM ? 16000 : 52000),
    ]
    return () => t.forEach((x) => window.clearTimeout(x))
  }, [])
  return (
    <div className="page art">
      <div className="doc">
        <PageNav kind="rail" />
        <article className={'art-body' + (w.lens ? ' lens' : '')}>
          <div className="crumb"><span className="tk">Sales Cloud · Opportunity · Process</span></div>
          <h1 className="t">Discount approvals</h1>
          <div className="byline">
            <span className="agline">Kept by <Ag id="approvals" name /></span>
            <span className="agline">Verified by <L to="Dana Ruiz" /></span>
            <span className="live"><Ago /></span>
            <button className={'lensbtn' + (w.lens ? ' on' : '')} aria-pressed={w.lens} onClick={() => w.setLens(!w.lens)}><Icon name="scan-eye" size={16} />Evidence</button>
          </div>
          {w.lens && (
            <div className="lzleg" aria-label="Evidence key">
              <span><i className="lg-ok" />Checked by a person</span><span><i className="lg-obs" />Written from what agents saw</span><span><i className="lg-warn" />Unconfirmed or unofficial</span>{w.cfg === 'changed' && <span><i className="lg-pend" />Being re-checked</span>}
            </div>
          )}
          <TrustLine sents={sents} />
          <PageNav kind="chips" />
          <Arrival />
          <section id="s-lead">
            <p><C ns={[1]}><b>Discount approval</b> is how Northwind reviews big deals before they move to Negotiation.</C> <C ns={[2]}>Any deal over $100,000 needs approval,</C> <C ns={[3, ...finNs]}>and who approves depends on the discount, under the <L to="Discount policy" />.</C> <C ns={[4]} mark={SEEN_ONCE} cls="uns">EMEA deals reportedly go to the regional director first.</C> <C ns={[5]}>Most approvals finish in under four hours.</C></p>
            <QaSlot where="page" sec="lead" />
          </section>
          <section id="s-try">
            <h2>Try a deal</h2>
            <Sim />
          </section>
          <section id="s-rules">
            <h2>The rules</h2>
            <p>
              <C ns={finNs} mark={cfgMark} id="cfg-sentence">Discounts over {w.cfgAnim ? <><s className="oldv">20%</s> <span className="newv">25%</span></> : w.fin + '%'} add Finance as a second approver.</C>{' '}
              <C ns={[3, 12]} mark={CHANGED}>Over 35%, the CRO approves directly.</C>
            </p>
            <p><C ns={[6]}>An approval request expires after 14 days, and the rep has to submit it again.</C> <C ns={[7]}>The rule exists because two deals closed on six-week-old prices in 2024.</C></p>
            <p><C ns={[8]}>Once a deal is approved, only <L to="Deal Desk" /> can change its amount.</C> <C ns={[16]}>Discounts over 10% need a written reason.</C></p>
            <QaSlot where="page" sec="rules" />
          </section>
          <section id="s-practice">
            <h2>In practice</h2>
            <div className="obs">
              <div className="ok2">Unofficial</div>
              <p><C ns={[9, 10]}>At <L to="Quarter-end close">quarter end</L>, Deal Desk approves large deals in #deal-desk first and logs them in Salesforce afterward.</C></p>
              <Dots on={9} off={3} />
              <div className="dl">9 of the last 12 quarter ends</div>
            </div>
            <Renewal />
            <QaSlot where="page" sec="practice" />
          </section>
          <section id="s-config">
            <h2>How it’s configured</h2>
            <Config />
          </section>
          <section id="s-used">
            <h2>Cited by the agents</h2>
            <Receipts />
          </section>
          <div className="colophon">
            <span className="colag"><AgentPile ids={['approvals', 'finance', 'integrations']} size={22} />3 agents</span>
            <Pile ns={[...Object.keys(REFS).map(Number), ...(w.learned ? [14] : []), ...(w.cfg !== 'idle' ? [15] : [])]} />
            <span>{Object.keys(REFS).length + (w.learned ? 1 : 0) + (w.cfg !== 'idle' ? 1 : 0)} sources · {verified} verified · rewritten {6 + (w.learned ? 1 : 0) + (w.cfg !== 'idle' ? 1 : 0)} times</span>
          </div>
        </article>
        <Margin />
      </div>
    </div>
  )
}
