import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './Icon'
import { Ag } from './Live'
import { RM, useW } from './store'

/*
 * Watch Asoka write a page. First the access it needs, up top: one read-only grant per source, each with its scopes;
 * Salesforce is required, the rest are optional. Grant it and the sources connect, then the Discount approvals page
 * is written live: a status line says what it is reading, headings and sentences type in word by word with numbered
 * citations, each source joins the list at the foot as it's read, the config table fills row by row, an open question
 * goes to a person, and an admin verifies. A source you leave off becomes a named gap in the page, so the page shows
 * exactly what each grant buys. Scripted demo; nothing is fetched.
 */

type Src = 'sf' | 'slack' | 'tickets' | 'meet'
const SOURCES: { id: Src; ic: IconName; name: string; scope: string; got: string; req?: boolean }[] = [
  { id: 'sf', ic: 'cloud', name: 'Salesforce', req: true, scope: 'Setup and metadata: approval processes, validation rules, flows, field history, setup audit trail', got: 'Six years of setup history' },
  { id: 'slack', ic: 'hash', name: 'Slack', scope: 'Public channels you choose: #deal-desk, #revops', got: '2 channels · 1,284 messages' },
  { id: 'tickets', ic: 'ticket', name: 'Tickets', scope: 'Cases tagged discount or approval', got: '46 tickets' },
  { id: 'meet', ic: 'video', name: 'Meetings', scope: 'RevOps weekly transcripts', got: '12 transcripts' },
]

type Ev =
  | { t: number; k: 'read'; src: Src; n: number; what: string }
  | { t: number; k: 'title' | 'h'; text: string }
  | { t: number; k: 'p' | 'li'; group: string; text: string; cite: number[]; src?: Src; label?: string }
  | { t: number; k: 'q'; text: string; who: string; src: Src }
  | { t: number; k: 'row'; cells: [string, string, string]; warn?: boolean; src?: Src }
  | { t: number; k: 'gap'; src: Src; text: string }
  | { t: number; k: 'verify'; state: 'sent' | 'done' }

/** The script, in milliseconds from the first read. Citation numbers refer to the `read` events' n. */
const SCRIPT: Ev[] = [
  { t: 0, k: 'read', src: 'sf', n: 1, what: 'Approval process · Large Deal Approval' },
  { t: 500, k: 'title', text: 'Discount approvals' },
  { t: 1200, k: 'read', src: 'sf', n: 2, what: 'Opportunity · Stage, Amount and Discount fields' },
  { t: 1600, k: 'p', group: 'sum', text: 'Deals over $100,000 need approval before they move to Negotiation.', cite: [1, 2] },
  { t: 3000, k: 'p', group: 'sum', text: 'The discount decides who approves.', cite: [1] },
  { t: 3900, k: 'h', text: 'Who approves' },
  { t: 4100, k: 'read', src: 'sf', n: 3, what: 'Approval steps 1 to 3 · entry criteria' },
  { t: 4500, k: 'li', group: 'who', text: 'Up to 20% off: the sales manager approves alone.', cite: [3] },
  { t: 5600, k: 'li', group: 'who', text: 'From 20% to 35%: the sales manager, then Finance.', cite: [3] },
  { t: 6700, k: 'li', group: 'who', text: 'Over 35%: the CRO approves directly.', cite: [3] },
  { t: 7700, k: 'h', text: 'Rules' },
  { t: 7800, k: 'read', src: 'sf', n: 4, what: 'Validation rules · Discount_Requires_Reason, Amount_Locked_After_Approval' },
  { t: 8200, k: 'p', group: 'rules', text: 'Discounts over 10% need a written reason. Once a deal is approved, only Deal Desk can change its amount.', cite: [4] },
  { t: 10200, k: 'read', src: 'slack', n: 5, what: '#revops · a 2024 thread on expired approvals' },
  { t: 10600, k: 'p', group: 'rules2', text: 'Requests expire after 14 days, added after two deals closed on six-week-old prices.', cite: [5], src: 'slack' },
  { t: 10600, k: 'gap', src: 'slack', text: 'Why the rules exist is usually argued in Slack: grant #revops to add it.' },
  { t: 12300, k: 'h', text: 'In practice' },
  { t: 12400, k: 'read', src: 'slack', n: 6, what: '#deal-desk · 9 quarter-end threads' },
  { t: 12800, k: 'p', group: 'qe', label: 'Unwritten rule', text: 'At quarter end, Deal Desk approves large deals in #deal-desk first, then logs them in Salesforce (9 of the last 12 quarter ends).', cite: [6], src: 'slack' },
  { t: 12800, k: 'gap', src: 'slack', text: 'Unwritten practice, like quarter-end approvals in #deal-desk, needs Slack.' },
  { t: 14800, k: 'read', src: 'meet', n: 7, what: 'RevOps weekly · Oct 21 transcript' },
  { t: 15200, k: 'p', group: 'time', text: 'Most approvals finish in under four hours; Finance is the slowest step.', cite: [7], src: 'meet' },
  { t: 15200, k: 'gap', src: 'meet', text: 'How long approvals take in practice comes from RevOps meetings.' },
  { t: 16600, k: 'read', src: 'tickets', n: 8, what: 'Tickets · 14 flat renewals over $100,000' },
  { t: 17000, k: 'q', text: 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.', who: 'Asking Maria Okafor, RevOps', src: 'tickets' },
  { t: 17000, k: 'gap', src: 'tickets', text: 'Exceptions people hit, like flat renewals skipping approval, show up in tickets.' },
  { t: 18700, k: 'h', text: 'What touches this' },
  { t: 18800, k: 'read', src: 'sf', n: 9, what: 'Integrations · CPQ quote sync log' },
  { t: 19100, k: 'row', cells: ['Large Deal Approval', 'Approval process', 'Active'] },
  { t: 19500, k: 'row', cells: ['Discount_Requires_Reason', 'Validation rule', 'Active'] },
  { t: 19900, k: 'row', cells: ['Amount_Locked_After_Approval', 'Validation rule', 'Active'] },
  { t: 20300, k: 'row', cells: ['CPQ quote sync', 'Integration', 'Failing for multi-currency'], warn: true },
  { t: 21200, k: 'verify', state: 'sent' },
  { t: 24200, k: 'verify', state: 'done' },
]
const END = 24800, WORD_MS = 42

const SRC_IC: Record<Src, IconName> = { sf: 'cloud', slack: 'hash', tickets: 'ticket', meet: 'video' }

/** A sentence that types in word by word, then its citation marks appear. */
function Typed({ text, ms, cite }: { text: string; ms: number; cite?: number[] }) {
  const words = text.split(' '), n = Math.min(words.length, Math.floor(ms / WORD_MS) + 1), done = n >= words.length
  return (
    <>
      {words.slice(0, n).map((w, i) => <span key={i} className="gn-w">{w}{i < words.length - 1 ? ' ' : ''}</span>)}
      {!done && <i className="gn-caret" aria-hidden="true" />}
      {done && cite?.map((c) => <sup key={c} className="gn-cite">{c}</sup>)}
    </>
  )
}

export function Generate() {
  const w = useW()
  const [grant, setGrant] = useState<Record<Src, boolean>>({ sf: true, slack: true, tickets: true, meet: true })
  const [phase, setPhase] = useState<'access' | 'connect' | 'write' | 'done'>('access')
  const [conn, setConn] = useState(0), [t, setT] = useState(0), [paused, setPaused] = useState(false)
  const follow = useRef(true), caret = useRef<HTMLDivElement>(null)
  const chosen = SOURCES.filter((s) => grant[s.id])

  // Connect each granted source in turn, then start writing.
  useEffect(() => {
    if (phase !== 'connect') return
    if (conn >= chosen.length) { const id = window.setTimeout(() => setPhase('write'), 500); return () => window.clearTimeout(id) }
    const id = window.setTimeout(() => setConn((c) => c + 1), RM ? 60 : 650); return () => window.clearTimeout(id)
  }, [phase, conn, chosen.length])
  // The playhead.
  useEffect(() => {
    if (phase !== 'write' || paused) return
    if (RM) { setT(END); setPhase('done'); return }
    let raf = 0, last = performance.now()
    const f = (now: number) => { const dt = Math.max(0, Math.min(250, now - last)); last = now; setT((x) => { const y = x + dt; if (y >= END) { setPhase('done'); return END } return y }); raf = requestAnimationFrame(f) }
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf)
  }, [phase, paused])
  // Follow the writing unless the reader scrolls up.
  useEffect(() => {
    const f = (e: WheelEvent) => { if (e.deltaY < 0) follow.current = false }
    addEventListener('wheel', f, { passive: true }); return () => removeEventListener('wheel', f)
  }, [])
  useEffect(() => {
    if (phase === 'write' && follow.current) caret.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [Math.floor(t / 400), phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => { follow.current = true; setConn(0); setT(0); setPaused(false); setPhase('connect'); window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }) }
  const reset = () => { setPhase('access'); setT(0); setConn(0) }

  // What has happened by now, with sources you didn't grant turned into gaps.
  const on = (src?: Src) => !src || grant[src]
  const evs = SCRIPT.filter((e) => e.t <= t && (e.k === 'gap' ? !grant[e.src] : e.k === 'read' || e.k === 'q' ? grant[e.src] : on((e as { src?: Src }).src)))
  const reads = evs.filter((e): e is Extract<Ev, { k: 'read' }> => e.k === 'read')
  const nowRead = reads[reads.length - 1]
  const sentences = evs.filter((e) => e.k === 'p' || e.k === 'li').length
  const qs = evs.filter((e) => e.k === 'q').length, gaps = evs.filter((e) => e.k === 'gap').length
  const verify = [...evs].reverse().find((e): e is Extract<Ev, { k: 'verify' }> => e.k === 'verify')
  // Renumber citations to the sources actually read, in order.
  const num = new Map(reads.map((r, i) => [r.n, i + 1]))
  const cites = (c: number[]) => c.map((x) => num.get(x)).filter((x): x is number => !!x)

  // Group the body: consecutive sentences of one paragraph or list share an element; rows share one table.
  type Block = { key: string; kind: 'title' | 'h' | 'p' | 'ul' | 'q' | 'gap' | 'table'; items: Ev[] }
  const blocks: Block[] = []
  evs.forEach((e) => {
    if (e.k === 'read' || e.k === 'verify') return
    const lastB = blocks[blocks.length - 1]
    if ((e.k === 'p' || e.k === 'li') && lastB && lastB.key === e.group) { lastB.items.push(e); return }
    if (e.k === 'row' && lastB?.kind === 'table') { lastB.items.push(e); return }
    blocks.push({ key: e.k === 'p' || e.k === 'li' ? e.group : e.k + e.t, kind: e.k === 'li' ? 'ul' : e.k === 'row' ? 'table' : e.k, items: [e] })
  })
  const writing = phase === 'write'
  const sec = Math.round(t / 1000)

  return (
    <article className="doc gn">
      <p className="home-k">Demo · watch Asoka write a page</p>

      {/* Access up top: what Asoka reads, and why. */}
      <section className={'gn-acc' + (phase === 'access' ? '' : ' on')} aria-label="Access Asoka needs">
        <div className="gn-acc-h">
          <div><b>Access Asoka needs</b><span>Read-only. It writes pages here, never in your tools.</span></div>
          {phase !== 'access' && <button className="wl" onClick={reset}>Change access</button>}
        </div>
        <ul>
          {SOURCES.map((s, i) => {
            const idx = chosen.findIndex((c) => c.id === s.id), live = phase !== 'access' && grant[s.id], connected = live && (phase !== 'connect' || idx < conn)
            const readN = reads.filter((r) => r.src === s.id).length
            return (
              <li key={s.id} className={(grant[s.id] ? 'g' : 'off') + (connected ? ' ok' : '')} style={{ animationDelay: `${i * 40}ms` }}>
                <span className="gn-ic" aria-hidden="true"><Icon name={s.ic} size={16} /></span>
                <span className="gn-src"><b>{s.name}{s.req && <small className="tk">Required</small>}</b><span>{phase === 'access' ? s.scope : !grant[s.id] ? 'Not granted' : connected ? `${s.got}${readN ? ` · read ${readN}` : ''}` : 'Connecting'}</span></span>
                {phase === 'access'
                  ? <button className={'gn-sw' + (grant[s.id] ? ' on' : '')} role="switch" aria-checked={grant[s.id]} aria-label={`Grant ${s.name}`} disabled={s.req} onClick={() => setGrant((g) => ({ ...g, [s.id]: !g[s.id] }))}><i /></button>
                  : <span className="gn-state">{!grant[s.id] ? '—' : connected ? <Icon name="check" size={14} /> : <i className="gn-spin" aria-hidden="true" />}</span>}
              </li>
            )
          })}
        </ul>
        {phase === 'access' && (
          <div className="gn-go">
            <button className="btn primary" onClick={start}><Icon name="play" size={12} />Grant read access and write the page</button>
            <span>Page: Discount approvals · verified by Dana Ruiz, Salesforce admin</span>
          </div>
        )}
      </section>

      {/* The live status: what it's reading now, and the counts. */}
      {(writing || phase === 'done') && (
        <div className="gn-now" aria-live="polite">
          <span className="gn-who"><Ag id="approvals" size={20} /><span><b>Asoka</b> · Approvals job</span></span>
          <span className="gn-what">{phase === 'done' ? 'Done. Re-reads hourly from here on.' : nowRead ? <>Reading <b>{nowRead.what}</b></> : 'Starting'}</span>
          <span className="gn-ct num"><span>{reads.length} sources</span><span>{sentences} statements</span><span>{qs} {qs === 1 ? 'question' : 'questions'}</span><span>{sec}s</span></span>
          {writing && <button className="ib" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume' : 'Pause'}><Icon name={paused ? 'play' : 'pause'} size={14} /></button>}
        </div>
      )}

      {phase === 'connect' && <p className="gn-wait">Connecting {chosen.length} {chosen.length === 1 ? 'source' : 'sources'}…</p>}

      {/* The page, as it's written. */}
      {(writing || phase === 'done') && (
        <div className="gn-page">
          {blocks.map((b) => {
            const age = (e: Ev) => t - e.t
            if (b.kind === 'title') { const e = b.items[0] as Extract<Ev, { k: 'title' | 'h' }>; return <h1 key={b.key} className="gn-in"><Typed text={e.text} ms={age(e) * 0.6} /></h1> }
            if (b.kind === 'h') { const e = b.items[0] as Extract<Ev, { k: 'title' | 'h' }>; return <h2 key={b.key} className="gn-in">{e.text}</h2> }
            if (b.kind === 'p') {
              const first = b.items[0] as Extract<Ev, { k: 'p' | 'li' }>
              return (
                <p key={b.key} className={'gn-in' + (b.key === 'sum' ? ' gn-lede' : '')}>
                  {first.label && <span className="gn-lab tk">{first.label}</span>}
                  {b.items.map((e, i) => { const x = e as Extract<Ev, { k: 'p' | 'li' }>; return <span key={i}>{i > 0 && ' '}<Typed text={x.text} ms={age(x)} cite={cites(x.cite)} /></span> })}
                </p>
              )
            }
            if (b.kind === 'ul') return <ul key={b.key} className="gn-in">{b.items.map((e, i) => { const x = e as Extract<Ev, { k: 'p' | 'li' }>; return <li key={i} className="gn-in"><Typed text={x.text} ms={age(x)} cite={cites(x.cite)} /></li> })}</ul>
            if (b.kind === 'q') { const e = b.items[0] as Extract<Ev, { k: 'q' }>; return <div key={b.key} className="gn-q gn-in"><span className="tk">Open question</span><p><Typed text={e.text} ms={age(e)} /></p>{age(e) > 1200 && <span className="gn-ask"><Ag id="approvals" size={16} />{e.who}</span>}</div> }
            if (b.kind === 'gap') { const e = b.items[0] as Extract<Ev, { k: 'gap' }>; return <div key={b.key} className="gn-gap gn-in"><Icon name={SRC_IC[e.src]} size={14} /><span><b>Needs {SOURCES.find((s) => s.id === e.src)!.name}</b> {e.text}</span></div> }
            if (b.kind === 'table') return (
              <table key={b.key} className="gn-tbl gn-in"><thead><tr><th>Automation</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>{b.items.map((e, i) => { const x = e as Extract<Ev, { k: 'row' }>; return <tr key={i} className="gn-in"><td className="code">{x.cells[0]}</td><td>{x.cells[1]}</td><td className={x.warn ? 'warn' : ''}>{x.cells[2]}</td></tr> })}</tbody></table>
            )
            return null
          })}
          {writing && <div ref={caret} className="gn-anchor" aria-hidden="true" />}

          {reads.length > 0 && (
            <section className="gn-srcs">
              <h2>Sources</h2>
              <ol>{reads.map((r) => <li key={r.n} className="gn-in"><Icon name={SRC_IC[r.src]} size={14} /><span>{r.what}</span></li>)}</ol>
            </section>
          )}

          {verify && (
            <div className={'gn-ver gn-in ' + verify.state}>
              {verify.state === 'sent' ? <><i className="gn-spin" aria-hidden="true" /><span><b>Sent to Dana Ruiz to verify.</b> She checks each statement against Salesforce.</span></>
                : <><Icon name="badge-check" size={16} /><span><b>Verified by Dana Ruiz</b> · {Math.max(1, sentences - 2)} of {sentences} statements; the rest stay marked until someone confirms them.</span></>}
            </div>
          )}

          {phase === 'done' && (
            <div className="gn-end gn-in">
              <p><b>Written in {sec} seconds</b> from {reads.length} sources: {sentences} statements, {qs} open {qs === 1 ? 'question' : 'questions'}{gaps ? `, ${gaps} ${gaps === 1 ? 'gap' : 'gaps'} until you grant more access` : ''}. Nobody typed it.</p>
              <div className="gn-end-b">
                <button className="btn primary" onClick={() => w.go('discount-approvals')}>Open the kept page<Icon name="arrow-right" size={16} /></button>
                <button className="btn ghost" onClick={reset}>Write it again</button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
