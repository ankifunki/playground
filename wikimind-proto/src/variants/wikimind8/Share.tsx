import { useState } from 'react'
import { AG } from './data'
import { Icon, type IconName } from './Icon'
import { Ag, Asoka } from './Live'
import { PAGES } from './data'
import { useW, type Art } from './store'

/*
 * Artifacts and sharing them in Slack (Wikimind 9). An artifact is something Asoka made from what it knows, kept in
 * a job's grove with its sources: the page's How it works player ("How discount approvals work"), or a one-pager,
 * checklist or runbook made on request in chat. Share in Slack posts a link that unfurls into a preview card; Asoka
 * posts it, and the share is logged in Live activity. Nothing leaves the browser.
 */

export const CHANNELS = ['#deal-desk', '#revops', '#sales-leaders']
const SRC_IC: Record<string, IconName> = { Salesforce: 'cloud', '#': 'hash', ticket: 'ticket', meeting: 'video' }
const srcIcon = (s: string): IconName => (s.includes('Salesforce') ? SRC_IC.Salesforce : s.includes('#') || s.includes('Slack') ? 'hash' : s.includes('ticket') ? 'ticket' : s.includes('meeting') ? 'video' : 'file-text')
export const artLink = (a: Art) => `wikimind.rippling.com/${a.id === 'how' ? 'discount-approvals#how' : 'a/' + a.id}`

/**
 * Make an artifact from a request, if Asoka knows enough to. Topics map to what the workspace holds; anything else is
 * declined rather than guessed. `fin` is today's Finance threshold, so the content follows the live config.
 */
export function makeArt(text: string, fin: number): Art | 'how' | null {
  const t = text.toLowerCase(), id = (s: string) => s + '-' + Date.now().toString(36)
  if (/how (it|discount approvals?|approvals?) works?|approval (flow|route)|routing/.test(t)) return 'how'
  if (/quarter.?end/.test(t)) return {
    id: id('qe'), title: 'Quarter-end approvals checklist', kind: 'Checklist', ag: 'approvals', from: 'discount-approvals', mine: true,
    lede: 'What Deal Desk does in the last week of a quarter, in the order it happens, and what Asoka checks along the way.',
    blocks: [{ k: 'steps', items: ['Large deals are approved in #deal-desk first, then logged in Salesforce (9 of the last 12 quarter ends).', 'Asoka logs each Slack approval against its opportunity within the hour.', `Discounts over ${fin}% still need Finance; over 35% need the CRO, even in Slack.`, 'Flat renewals skip approval (asking Maria Okafor to confirm it’s on purpose).', 'On the last day, Asoka lists any deal approved in Slack but not yet in Salesforce.'] }],
    sources: ['Salesforce config', '14 #deal-desk threads', '2 meetings'],
  }
  if (/cpq|sync|currency/.test(t)) return {
    id: id('cpq'), title: 'When a CPQ quote fails to sync', kind: 'Runbook', ag: 'integrations', from: 'discount-approvals', mine: true,
    lede: 'What to check when an approved discount doesn’t reach the quote, and who fixes what.',
    blocks: [{ k: 'steps', items: ['Check the quote’s currency: multi-currency deals failed after the Oct 29 CPQ update.', 'Asoka retries the sync once and posts the error in #revops.', 'Ben Ito (Integrations) owns the currency mapping.', 'Don’t re-approve the deal: the approval stands; only the quote is behind.'] }],
    sources: ['Salesforce config', '412 sync errors', '3 tickets'],
  }
  if (/renewal/.test(t)) return {
    id: id('renew'), title: 'Flat renewals and approval', kind: 'Explainer', ag: 'approvals', from: 'discount-approvals', mine: true,
    lede: 'Renewals with no price change skip discount approval, even over $100,000.',
    blocks: [{ k: 'text', t: 'Asoka has seen it on every flat renewal since 2023, but no rule in Salesforce explains it. It’s asking Maria Okafor in RevOps whether it’s on purpose; her answer will update this.' }],
    sources: ['Salesforce config', '6 #revops threads'],
  }
  if (/access review|okta|sign.?in/.test(t)) return {
    id: id('ar'), title: 'What the access review checks', kind: 'One-pager', ag: 'security', from: 'access-reviews', mine: true,
    lede: 'The quarterly access review, as Asoka runs it for IT.',
    blocks: [{ k: 'rows', head: ['Check', 'What Asoka does'], rows: [['Admin users idle 90 days', 'Lists them and drafts the removal'], ['API users idle 90 days', 'Lists them; IT approves the list'], ['Sign-in anomalies', 'Needs Okta sign-in logs (asked Nov 1)']] }],
    sources: ['Salesforce users', 'IT tickets'],
  }
  if (/discount|approv|threshold|cheat.?sheet|one.?pager|who approves/.test(t)) return {
    id: id('disc'), title: 'Discount approvals cheat sheet', kind: 'One-pager', ag: 'approvals', from: 'discount-approvals', mine: true,
    lede: 'Who approves a discount on a deal over $100,000, and how long it usually takes.',
    blocks: [
      { k: 'rows', head: ['Discount', 'Who approves'], rows: [[`Up to ${fin}%`, 'Sales manager · about an hour'], [`${fin}% to 35%`, 'Sales manager, then Finance · about four hours'], ['Over 35%', 'CRO · about a day']] },
      { k: 'text', t: 'Under $100,000, no approval is needed. Requests expire after 14 days. Discounts over 10% need a written reason.' },
    ],
    sources: ['Salesforce config', '9 #deal-desk threads', '4 tickets'],
  }
  return null
}

/** How a shared link looks in Slack: Asoka's message with the link, and the preview card it unfurls into. */
export function Unfurl({ a, msg }: { a: Art; msg?: string }) {
  const w = useW()
  return (
    <div className="sh-msg">
      <span className="sh-av" aria-hidden="true"><Asoka size={20} /></span>
      <div className="sh-body">
        <span className="sh-who"><b>Asoka</b><span className="tk">App</span></span>
        {msg && <p className="sh-text">{msg}</p>}
        <div className="sh-card">
          <span className="sh-site">Wikimind · Rippling</span>
          <b className="sh-title">{a.title}</b>
          <p>{a.lede}</p>
          {a.id === 'how' ? (
            <ol className="sh-route" aria-label="Rep, Asoka, sales manager, Finance, unlocked">
              {['Rep', 'Asoka', 'Sales manager', 'Finance', 'Unlocked'].map((s, i) => <li key={s} className={i === 1 ? 'ag' : ''}>{s}</li>)}
            </ol>
          ) : a.blocks[0]?.k === 'rows' ? (
            <dl className="sh-rows">{a.blocks[0].rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          ) : a.blocks[0]?.k === 'steps' ? <p className="sh-more">{a.blocks[0].items.length} steps · {a.blocks[0].items[0]}</p> : null}
          <span className="sh-meta">{a.kind} · {AG[a.ag].name} grove · {a.sources.length} sources{a.id === 'how' && <> · Finance over {w.fin}%</>}</span>
        </div>
      </div>
    </div>
  )
}

/** The Share in Slack panel: the preview, a channel, an optional message, then Post. */
export function SharePanel({ id }: { id: string }) {
  const w = useW(), a = w.arts.find((x) => x.id === id)
  const [ch, setCh] = useState(CHANNELS[0]), [msg, setMsg] = useState(id === 'how' ? 'How discount approvals work today, with the live thresholds. Play your own deal to see who approves.' : ''), [copied, setCopied] = useState(false)
  if (!a) return null
  const posted = w.shared[id]
  const copy = () => { try { navigator.clipboard?.writeText('https://' + artLink(a)) } catch { /* not allowed */ } setCopied(true); window.setTimeout(() => setCopied(false), 1600) }
  return (
    <div className="ap bk sh">
      <div className="ms-h"><span className="tk">{a.kind} · {AG[a.ag].name} grove</span><b>{a.title}</b><p>Asoka posts the link; it opens as a preview anyone in the channel can play.</p></div>
      {!posted && <>
        <div className="rl-f"><span className="tk">Channel</span><span className="rl-sc">{CHANNELS.map((c) => <button type="button" key={c} className={c === ch ? 'on' : ''} aria-pressed={c === ch} onClick={() => setCh(c)}>{c}</button>)}</span></div>
        <label className="rl-f"><span className="tk">Message (optional)</span><textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Add a note" /></label>
      </>}
      <section><h3>{posted ? `Posted in ${posted}` : 'Preview'}</h3><Unfurl a={a} msg={msg.trim() || undefined} /></section>
      <div className="ap-foot bk-foot">
        {posted ? <p className="bk-asked"><Icon name="circle-check" size={14} />Shared in {posted}. Logged in Live activity.</p>
          : <button className="btn primary" onClick={() => w.shareArt(id, ch)}><Icon name="hash" size={14} />Post to {ch}</button>}
        <button className="btn ghost" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
      </div>
    </div>
  )
}

/** An artifact's own page, in its grove: what it is, where it came from, the content, and Share in Slack. */
export function ArtView({ id }: { id: string }) {
  const w = useW(), a = w.arts.find((x) => x.id === id)
  if (!a) return <article className="doc"><h1>Not found</h1></article>
  return (
    <article className="doc art">
      <div className="doc-ic" aria-hidden="true"><Icon name="layers" size={28} /></div>
      <p className="art-k tk">{a.kind} · made by Asoka{a.mine ? ' for you' : ''}</p>
      <h1>{a.title}</h1>
      <p className="art-meta"><Ag id={a.ag} size={16} />{AG[a.ag].name} grove · from <button className="wl" onClick={() => w.go(a.from)}>{PAGES[a.from]?.title}</button>{w.shared[a.id] && <> · shared in {w.shared[a.id]}</>}</p>
      <div className="art-acts"><button className="btn soft" onClick={() => w.openShare(a.id)}><Icon name="hash" size={14} />Share in Slack</button></div>
      <p className="art-lede">{a.lede}</p>
      {a.blocks.map((b, i) => b.k === 'text' ? <p key={i}>{b.t}</p>
        : b.k === 'steps' ? <ol key={i} className="art-steps">{b.items.map((x) => <li key={x}>{x}</li>)}</ol>
          : <table key={i} className="art-tbl"><thead><tr><th>{b.head[0]}</th><th>{b.head[1]}</th></tr></thead><tbody>{b.rows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>)}
      <h2 className="art-h">Built from</h2>
      <ul className="art-src">{a.sources.map((s) => <li key={s}><Icon name={srcIcon(s)} size={14} />{s}</li>)}</ul>
    </article>
  )
}
