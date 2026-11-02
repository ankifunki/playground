import { useEffect, useRef, useState } from 'react'
import { QaSlot } from './Answer'
import { Ag, AgentPile, type AgentId } from './agents'
import { C, Margin, Pile } from './Claim'
import { ARRIVAL, REFS, tierOf, type Mark } from './data'
import { Icon, type IconName } from './Icon'
import { RM } from './logic'
import { HowFlow } from './Flow'
import { Sim } from './Sim'
import { useW } from './store'

const OLD_RENEWAL = 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.'
const SEEN_ONCE: Mark = { t: 'Seen once', tone: 'warn' }
const CHANGED: Mark = { t: 'Changed Oct 28', tone: 'info' }

const NAV: [string, string, IconName][] = [['lead', 'Summary', 'text'], ['try', 'How it works', 'play'], ['rules', 'The rules', 'shield-check'], ['practice', 'In practice', 'eye'], ['config', 'Configured', 'sliders'], ['used', 'Cited by agents', 'receipt']]
const goSec = (id: string) => document.getElementById('s-' + id)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' })

/** Section nav with icons. A rail beside the page on wide screens, a sticky row of chips otherwise. */
function PageNav({ kind }: { kind: 'rail' | 'chips' }) {
  const [on, setOn] = useState('lead')
  // Reads the sections fresh on every scroll, so it keeps working after they are re-rendered (e.g. Page / Markdown).
  useEffect(() => {
    let raf = 0
    const spy = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const secs = Array.from(document.querySelectorAll<HTMLElement>('.art-body section[id^="s-"]'))
        if (!secs.length) return
        let cur = secs[0].id
        for (const s of secs) if (s.getBoundingClientRect().top <= 160) cur = s.id
        if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = secs[secs.length - 1].id
        setOn(cur.slice(2))
      })
    }
    spy(); addEventListener('scroll', spy, { passive: true }); addEventListener('resize', spy)
    const mo = new MutationObserver(spy); const body = document.querySelector('.art-body'); if (body) mo.observe(body, { childList: true })
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', spy); removeEventListener('resize', spy); mo.disconnect() }
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
export function Ago({ prefix = 'Updated', bare }: { prefix?: string; bare?: boolean }) {
  const w = useW(), [, tick] = useState(0)
  useEffect(() => { const t = window.setInterval(() => tick((n) => n + 1), 1000); return () => window.clearInterval(t) }, [])
  const s = Math.max(1, Math.round((Date.now() - w.lastObs) / 1000))
  const t = s < 60 ? s + 's' : Math.round(s / 60) + 'm'
  if (bare) return <span className="ago">{t} ago</span>
  return <span className="ago"><span className="pdot" />{prefix} {t} ago</span>
}

/** The open question lives where the doubt is. When Maria answers, the card rewrites itself in place. */
function Renewal() {
  const w = useW()
  if (w.learned) return (
    <div className={'obs done' + (w.diffPlay ? ' upd' : '')} id="renewal">
      <p className={'was' + (w.diffPlay ? ' anim' : '')}><del>{OLD_RENEWAL}</del></p>
      <p className={w.diffPlay ? 'write' : ''}><C ns={[11, 14]} mark={{ t: 'Maria answered just now', tone: 'ok' }}>Flat <L to="Renewals">renewals</L> skip approval on purpose. It has been the policy since 2023, because flat renewals don’t change revenue risk.</C></p>
      <div className="said">“Yes, on purpose since 2023. Flat renewals don’t change revenue risk.” <span>Maria Okafor, RevOps</span></div>
    </div>
  )
  return (
    <div className="obs" id="renewal">
      <p><C ns={[11]} mark={{ t: 'Asking Maria', tone: 'warn' }}>{OLD_RENEWAL}</C></p>
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

/**
 * How far to trust this page, as the brief's four questions: checked by a person? complete? current? relied on?
 * Gaps and stale content are named, so "complete" and "current" are claims you can check.
 */
/**
 * The page's status, compact, in the same order as Home: how much of this job runs on its own, then the four questions.
 * One strip under the byline, so the page reads as a document first.
 */
function PageStatus({ sents }: { sents: number[][] }) {
  // Wikimind 4's scan: three cells, a value and one plain line each. Each opens its evidence.
  const w = useW(), tiers = sents.map((ns) => tierOf(ns, w.cfg === 'changed')), checked = tiers.filter((t) => t === 'ok').length
  const gaps = w.learned ? 1 : 2
  return (
    <div className="ps3" aria-label="How far to trust this page">
      <button onClick={() => w.go('page', { sec: w.learned ? 'lead' : 'practice' })}><span className="tk">Complete</span><b>5 of 5</b><span>automations; {gaps} open {gaps === 1 ? 'question' : 'questions'}</span></button>
      <button onClick={() => w.openBlame([...new Set(sents.flat())])}><span className="tk">Right</span><b>{checked} of {checked}</b><span>checks by a person held up</span></button>
      <button onClick={() => w.showClaims([17])}><span className="tk">Current</span><b><Ago bare /></b><span>last re-read; 1 line out of date</span></button>
    </div>
  )
}

/** One live line under the byline, like Wikimind 4's "Reading 2 new Slack threads". */
function LiveLine() {
  const w = useW(), srcs = 16 + (w.learned ? 1 : 0) + (w.cfg !== 'idle' ? 1 : 0), n = 6 + (w.learned ? 1 : 0) + (w.cfg !== 'idle' ? 1 : 0)
  const now = w.cfg === 'changed' ? 'Rewriting after a Salesforce change' : 'Re-reading 2 new #deal-desk threads'
  return <p className="pl-live"><i aria-hidden="true" /><span>{now}</span><span className="pl-m">Written from {srcs} sources · rewritten {n} times</span></p>
}

/* ---------- How it's configured: what touches the Opportunity object, and why each thing exists ---------- */
function Config() {
  const w = useW(), ch = w.cfg !== 'idle'
  const autos: { type: string; name: string; ns: number[]; does: string; ag: AgentId; mark?: Mark }[] = [
    { type: 'Approval process', name: 'Large Deal Approval', ns: ch ? [2, 15] : [2, 13], does: `Locks deals over $100,000 and routes them: the manager, Finance over ${w.fin}%, the CRO over 35%.`, ag: 'approvals' },
    { type: 'Validation rule', name: 'Discount_Requires_Reason', ns: [16], does: 'Blocks a discount over 10% without a written reason.', ag: 'finance' },
    { type: 'Validation rule', name: 'Amount_Locked_After_Approval', ns: [8], does: 'Lets only Deal Desk change the amount once a deal is approved.', ag: 'finance' },
    { type: 'Flow', name: 'Notify_Deal_Desk', ns: [17], does: 'Posts approved deals over $500,000 to #deal-desk.', ag: 'approvals', mark: { t: 'Not seen since Aug 14', tone: 'stale' } },
    { type: 'Integration', name: 'CPQ quote sync', ns: [18], does: 'Sends approved discounts to CPQ quotes.', ag: 'integrations', mark: { t: 'Failing for multi-currency', tone: 'warn' } },
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
          <div className="cfg-h"><span className="tk">{a.type}</span></div>
          <code className="cfg-n">{a.name}</code>
          <p><C ns={a.ns} mark={a.mark}>{a.does}</C></p>
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
  const sents = [[1], [2], [3, ...finNs], [4], [5], finNs, [3, 12], [6], [7], [8], [16], [9, 10], w.learned ? [11, 14] : [11], [17]]
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
        <article className="art-body">
          <div className="crumb"><button className="wl crumb-all" onClick={(e) => w.openPages(e.currentTarget)}><Icon name="library" size={14} />All pages</button></div>
          <h1 className="t">Discount approvals</h1>
          <div className="byline">
            <span className="agline">Kept by <Ag id="approvals" name /></span>
            <span className="agline">Verified by <L to="Dana Ruiz" /></span>
          </div>
          <LiveLine />
          <PageStatus sents={sents} />
          <>
          <PageNav kind="chips" />
          <Arrival />
          <section id="s-lead">
            <p><C ns={[1]}><b>Discount approval</b> is how Northwind reviews big deals before they move to Negotiation.</C> <C ns={[2]}>Any deal over $100,000 needs approval,</C> <C ns={[3, ...finNs]}>and who approves depends on the discount, under the <L to="Discount policy" />.</C> <C ns={[4]} mark={SEEN_ONCE} cls="uns">EMEA deals reportedly go to the regional director first.</C> <C ns={[5]}>Most approvals finish in under four hours.</C></p>
            <QaSlot where="page" sec="lead" />
          </section>
          <section id="s-try">
            <h2>How it works</h2>
            <HowFlow />
            <h3>Try it out</h3>
            <Sim />
          </section>
          <section id="s-rules">
            <h2>The rules</h2>
            <h3>Who approves</h3>
            <p>
              <C ns={finNs} mark={cfgMark} id="cfg-sentence">Discounts over {w.cfgAnim ? <><s className="oldv">20%</s> <span className="newv">25%</span></> : w.fin + '%'} add Finance as a second approver.</C>{' '}
              <C ns={[3, 12]} mark={CHANGED}>Over 35%, the CRO approves directly.</C>
            </p>
            <h3>When a request expires</h3>
            <p><C ns={[6]}>An approval request expires after 14 days, and the rep has to submit it again.</C> <C ns={[7]}>The rule exists because two deals closed on six-week-old prices in 2024.</C></p>
            <h3>After approval</h3>
            <p><C ns={[8]}>Once a deal is approved, only <L to="Deal Desk" /> can change its amount.</C> <C ns={[16]}>Discounts over 10% need a written reason.</C></p>
            <QaSlot where="page" sec="rules" />
          </section>
          <section id="s-practice">
            <h2>In practice</h2>
            <h3>Quarter-end approvals in Slack</h3>
            <div className="obs">
              <p><C ns={[9, 10]} mark={{ t: 'Unofficial', tone: 'warn' }}>At <L to="Quarter-end close">quarter end</L>, Deal Desk approves large deals in #deal-desk first and logs them in Salesforce afterward.</C></p>
              <Dots on={9} off={3} />
              <div className="dl">9 of the last 12 quarter ends</div>
            </div>
            <h3>Flat renewals</h3>
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
          </>
          <div className="colophon">
            <span className="colag"><AgentPile ids={['approvals', 'finance', 'integrations']} size={22} />3 agents</span>
            <Pile ns={[...Object.keys(REFS).map(Number), ...(w.learned ? [14] : []), ...(w.cfg !== 'idle' ? [15] : [])]} />
            <span>{Object.keys(REFS).length + (w.learned ? 1 : 0) + (w.cfg !== 'idle' ? 1 : 0)} sources · rewritten {6 + (w.learned ? 1 : 0) + (w.cfg !== 'idle' ? 1 : 0)} times</span>
          </div>
        </article>
        <Margin />
      </div>
    </div>
  )
}
