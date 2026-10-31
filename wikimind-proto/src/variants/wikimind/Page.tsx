import type React from 'react'
import { FOCUS, GCOLS, GE, GN, GNAME, KIND, MODES, ORDER, TCOL, TIER, type BlockId, type Focus, type Mode } from './data'
import { blameLine, counts, hintOf, isExc, RM, whyLine } from './logic'
import { useW } from './store'

const I = ({ children }: { children: React.ReactNode }) => <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
const ICO: Record<string, React.ReactNode> = {
  resub: <><path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6" /><path d="M18 2.5v4h-4M6 21.5v-4h4" /></>,
  exc: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  path: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h7a3.5 3.5 0 0 1 0 7H10a3.5 3.5 0 0 0 0 7h7" /></>,
  deals: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r=".6" /><circle cx="4" cy="12" r=".6" /><circle cx="4" cy="18" r=".6" /></>,
  tell: <><path d="M21 3 10 14" /><path d="M21 3 14.5 21l-4.5-7-7-4.5z" /></>,
  watch: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  touches: <><circle cx="12" cy="12" r="2.5" /><circle cx="5" cy="5" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="12" cy="20" r="2" /><path d="M6.5 6.5 10 10M17.5 6.5 14 10M12 14.5V18" /></>,
  ask: <path d="M4 5h16v11H9l-5 4z" />,
  lens: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  learn: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  asking: <><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" /><circle cx="12" cy="17" r=".6" /></>,
}
const Chv = ({ rot }: { rot?: number }) => <svg className="chv" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={rot ? { transform: `rotate(${rot}deg)` } : undefined}><path d="M9 6l6 6-6 6" /></svg>

function ActRow({ k, title, sub, pri, toggle }: { k: string; title: string; sub: string; pri?: boolean; toggle?: boolean }) {
  const w = useW(), done = w.done[k], on = !!toggle && w.show === k, flash = !!done && w.flash === 'done-' + k
  return (
    <button className={'actb' + (pri && !done && !on ? ' pri' : '') + (done ? ' dn' : '') + (on ? ' on' : '') + (flash ? ' in' : '')} onClick={() => w.doAct(k)} aria-expanded={toggle ? on : undefined}>
      <span className="ai2"><I>{done ? <path className="tickp" d="M6 12.5l4 4 8-9" /> : ICO[k] || ICO.ask}</I></span>
      <span className="atx"><b>{title}</b><span>{done || sub}</span></span>
      {done ? <span /> : <Chv rot={toggle ? (on ? -90 : 90) : 0} />}
    </button>
  )
}

const DEALS: [string, string, string, string][] = [['Kestrel platform', 'Ana Ruiz', '$520,000', '41% off'], ['Northstar renewal', 'Sam Ortiz', '$310,000', '37% off'], ['Lumen EMEA', 'Léa Morel', '$265,000', '38% off'], ['Orbit add-on', 'Raj Patel', '$180,000', '36% off']]

/** Why you're here and what you can do, depending on how you arrived. */
function Context() {
  const w = useW(), m = w.mode
  return (
    <section className="ctx" aria-label="Why you’re here and what you can do">
      {m === 'cite' && <>
        <div className="ck">Why you’re here</div><h2>Asoka couldn’t extend your approval because requests expire after 14 days.</h2>
        <p>Your request for <b>Helios expansion</b> ($240,000, 28% off, EMEA) went out 16 days ago and lapsed. Nothing is lost. The deal is unlocked and ready to send again.</p>
        <div className="ck2">What you can do</div>
        <div className="acts"><ActRow k="resub" title="Send it again" sub="Asoka resubmits it with the same details." pri /><ActRow k="exc" title="Ask for an extension instead" sub="Deal Desk can grant one. Asoka posts the request for you." /><ActRow k="path" title="See who approves it" sub="Your deal’s route, step by step." toggle /></div>
        {w.show === 'path' && <>
          <div className={'path' + (w.flash === 'path' ? ' in' : '')}><span className="me">You</span><i>→</i><span>Sofia, EMEA director</span><i>→</i><span>Your sales manager</span><i>→</i><span>Finance</span><i>→</i><span className="ok">Approved</span></div>
          <div className={'pnote' + (w.flash === 'path' ? ' in' : '')}>Finance joins because the discount is over 20%. The EMEA step comes from one source, so Asoka will confirm it when your request routes.</div>
        </>}
      </>}
      {m === 'change' && <>
        <div className="ck">What changed</div><h2>Discounts over 35% now go to the CRO instead of Finance.</h2>
        <p>The threshold dropped from 40% on Oct 28. <b>4 open deals</b> now route differently, and their reps may not know yet.</p>
        <div className="ck2">What you can do</div>
        <div className="acts">
          <ActRow k="deals" title="See the 4 affected deals" sub="Who owns them and how big they are." pri toggle />
          {w.show === 'deals' && <ul className={'deals' + (w.flash === 'deals' ? ' in' : '')}>{DEALS.map((d) => <li key={d[0]}><span><b>{d[0]}</b><small>{d[1]}</small></span><span className="r"><b>{d[2]}</b><small>{d[3]}</small></span></li>)}</ul>}
          <ActRow k="tell" title="Tell the affected reps" sub="Asoka sends each one a short note in Slack." /><ActRow k="watch" title="Watch this page" sub="Get a Slack note when approvals change again." />
        </div>
      </>}
      {m === 'demo' && <>
        <div className="ck">Built by Asoka</div><h2>Nobody wrote this page. Asoka assembled it from 23 observations and keeps it current.</h2>
        <p>It knows what it’s sure of and what it isn’t. When something doesn’t add up, it asks the person who’d know.</p>
        <div className="ck2">See for yourself</div>
        <div className="acts"><ActRow k="lens" title={w.blame ? 'Hide how Asoka knows' : 'Show how Asoka knows this'} sub="Every fact, traced to its sources." pri /><ActRow k="learn" title="Watch it learn" sub="A new answer is about to land." /><ActRow k="asking" title="See what it’s still asking" sub="The gaps it’s working to close." /></div>
      </>}
      {m === 'browse' && <>
        <div className="ck">At a glance</div><h2>Deals over $100,000 need approval before Negotiation. Who approves depends on the discount.</h2>
        <p>Up to 20%: the sales manager. 20 to 35%: plus Finance. Over 35%: the CRO. Requests expire after 14 days.</p>
        <div className="ck2">What you can do</div>
        <div className="acts"><ActRow k="touches" title="See what this touches" sub="Automations and people that depend on it." pri /><ActRow k="watch" title="Watch this page" sub="Get a Slack note when approvals change." /><ActRow k="ask" title="Ask a question" sub="Asoka answers from this page and cites it." /></div>
      </>}
    </section>
  )
}

/** One fact. Solid facts carry no mark; tap any fact to see why Asoka believes it. */
function Blk({ id, lead }: { id: BlockId; lead?: boolean }) {
  const w = useW(), b = w.B[id], lens = w.blame, exc = isExc(b)
  let cls = ''
  if (lens) cls = ' mk t-' + b.tier
  else if (exc) cls = ' mk ' + (b.tier === 'one' || b.tier === 'gap' ? 't-' + b.tier : b.flag ? 't-flag' : 't-chg')
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  return (
    <div className={'blk' + cls + (w.sel === id ? ' sel' : '') + (w.cite === id ? ' cited mk' : '') + (id === 'b7' && w.fresh ? ' fresh' : '') + (lead ? ' lead' : '')} id={'blk-' + id}
      role="button" tabIndex={0} aria-expanded={w.why === id} aria-label="Show why Asoka believes this"
      onClick={() => w.toggleWhy(id)} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); w.toggleWhy(id) } }}>
      <p>{b.text}</p>
      {w.cite === id && <div className="xl ctd">Asoka cited this when it replied to you in #deal-desk</div>}
      {b.tier === 'one' && <div className="xl">Seen once. Asoka is watching for more.</div>}
      {b.tier === 'gap' && <div className="xl gap">Asoka is asking Maria Okafor in RevOps</div>}
      {b.flag && <div className="xl flag">{b.flag}</div>}
      {b.changed && <>
        <div className="xl chg">{b.changed}. <button onClick={(e) => { stop(e); w.toggleDiff(id) }}>{w.diff === id ? 'Hide' : 'See'} what changed</button></div>
        {w.diff === id && <div className={'was' + (w.flash === 'diff-' + id ? ' in' : '')}>{b.before}</div>}
      </>}
      {lens && <div className="bm">{blameLine(b)}</div>}
      {w.why === id && (
        <div className={'why' + (w.flash === 'why-' + id ? ' in' : '')} onClick={stop}>
          {whyLine(b)}
          <div className="wb"><button className="lnk" onClick={() => w.setSel(id)}>See the full trail</button><button className="lnk" onClick={() => w.askAbout(id)}>Ask about this</button></div>
        </div>
      )}
    </div>
  )
}

function Box({ x, y, w, h, a, b }: { x: number; y: number; w: number; h: number; a: string; b?: string }) {
  return <><rect className="nb" x={x} y={y} width={w} height={h} rx={12} /><text className="nt" x={x + w / 2} y={y + (b ? 20 : h / 2 + 4)} textAnchor="middle">{a}</text>{b && <text className="ns" x={x + w / 2} y={y + 37} textAnchor="middle">{b}</text>}</>
}
function Diagram() {
  return (
    <svg viewBox="0 0 360 366" role="img" aria-label="Approval flow: deals route by discount to the sales manager, Finance, or the CRO, then unlock when approved">
      <defs>
        <path id="p1" d="M180 56 L180 132 C180 158 62 152 62 180 L62 236 C62 262 180 258 180 286" /><path id="p2" d="M180 56 L180 286" /><path id="p3" d="M180 56 L180 132 C180 158 298 152 298 180 L298 236 C298 262 180 258 180 286" />
      </defs>
      {['M180 56 L180 86', 'M180 132 C180 158 62 152 62 180', 'M180 132 L180 180', 'M180 132 C180 158 298 152 298 180', 'M62 236 C62 262 180 258 180 286', 'M180 236 L180 286', 'M298 236 C298 262 180 258 180 286'].map((d) => <path key={d} className="eg" d={d} />)}
      <Box x={30} y={10} w={300} h={46} a="Rep moves a deal over $100k to Negotiation" />
      <Box x={30} y={86} w={300} h={46} a="Record locks and the request routes" />
      <Box x={8} y={180} w={108} h={56} a="Up to 20%" b="Sales manager" />
      <Box x={126} y={180} w={108} h={56} a="20 to 35%" b="Manager, then Finance" />
      <Box x={244} y={180} w={108} h={56} a="Over 35%" b="CRO" />
      <Box x={30} y={286} w={300} h={46} a="Approved: unlocks and moves on" />
      <text className="ns" x={180} y={356} textAnchor="middle">No answer in 14 days? The request is recalled.</text>
      {!RM && ([['p1', 0], ['p1', 2.6], ['p2', 1.2], ['p2', 3.9], ['p3', 2]] as const).map(([p, t], i) => (
        <circle key={i} r={4.5} fill="var(--accent)"><animateMotion dur="5.2s" begin={t + 's'} repeatCount="indefinite" rotate="auto"><mpath href={'#' + p} /></animateMotion></circle>
      ))}
    </svg>
  )
}

/** Everything this process depends on, and everything that depends on it. */
function Graph() {
  const w = useW(), cx = 220, cy = 190, R = 128, sel = w.gsel
  const pos: Record<string, [number, number, number]> = {}
  GN.forEach((n, i) => { const an = -Math.PI / 2 + (i * 2 * Math.PI) / GN.length; pos[n.id] = [cx + R * Math.cos(an), cy + R * Math.sin(an), an] })
  let act: Record<string, 1> | null = null
  if (sel) { act = { [sel]: 1 }; GE.forEach(([a, b]) => { if (a === sel) act![b] = 1; if (b === sel) act![a] = 1 }) }
  else if (w.gfocus) { act = {}; FOCUS[w.gfocus].forEach((id) => (act![id] = 1)) }
  let cap: React.ReactNode
  if (sel) {
    const nd = GN.find((n) => n.id === sel)!, nb: string[] = []
    GE.forEach(([a, b]) => { const o = a === sel ? b : b === sel ? a : null; if (o) nb.push(GN.find((n) => n.id === o)!.l) })
    cap = <><b>{nd.l}</b>. {nd.d}{nb.length ? ' Connected to ' + nb.join(', ') + '.' : ''}</>
  } else if (w.gfocus === 'touches') cap = <><b>5 automations touch this.</b> Change Large Deal Approval and you also affect the lock handler, the amount lock rule, and CPQ quote sync, which is already failing for multi-currency deals. Talk to Maria Okafor first.</>
  else if (w.gfocus === 'path') cap = <><b>Who approves depends on the deal.</b> For a 28% discount in EMEA: Sofia, then the sales manager, then Finance. Over 35%, the CRO approves directly.</>
  else if (w.gfocus === 'people') cap = <><b>6 people and teams are involved.</b> Maria owns it, Deal Desk runs it, and up to 3 approvers sign off depending on region and discount.</>
  else cap = 'Everything this process depends on, and everything that depends on it. Tap any point to see how it relates.'
  const seg: [Focus | '', string][] = [['', 'Everything'], ['touches', 'What it touches'], ['people', 'Who’s involved'], ['path', 'Who approves']]
  return (
    <>
      <div className="gseg" role="group" aria-label="Filter the map">{seg.map(([f, l]) => <button key={l} className={(w.gfocus || '') === f && !sel ? 'on' : ''} onClick={() => w.filterGraph(f || null)}>{l}</button>)}</div>
      <div className="gwrap">
        <svg viewBox="0 0 440 384" role="img" aria-label="Map of the automations, people, policies, and processes connected to Opportunity approvals">
          {GN.map((n) => { const p = pos[n.id], on = !!act && !!act[n.id]; return <line key={'l' + n.id} x1={cx} y1={cy} x2={p[0].toFixed(1)} y2={p[1].toFixed(1)} stroke={on ? 'var(--accent)' : 'var(--line)'} strokeWidth={on ? 1.8 : 1} opacity={act && !on ? 0.35 : 1} /> })}
          {GE.map(([a0, b0]) => {
            const a = pos[a0], b = pos[b0], on = !!act && !!act[a0] && !!act[b0]
            const mx = (a[0] + b[0]) / 2 + (cx - (a[0] + b[0]) / 2) * 0.45, my = (a[1] + b[1]) / 2 + (cy - (a[1] + b[1]) / 2) * 0.45
            return <path key={a0 + b0} d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`} fill="none" stroke={on ? 'var(--accent)' : 'var(--line)'} strokeWidth={on ? 2.2 : 1.3} strokeDasharray={on ? undefined : '3 3'} opacity={act && !on ? 0.35 : 1} />
          })}
          {GN.map((n) => {
            const p = pos[n.id], c = GCOLS[n.t], dim = !!act && !act[n.id], co = Math.cos(p[2]), si = Math.sin(p[2])
            const lx = cx + (R + 14) * co, anc = co > 0.3 ? 'start' : co < -0.3 ? 'end' : 'middle'
            let ly = cy + (R + 14) * si + 4; if (anc === 'middle') ly += si > 0 ? 9 : -4
            const X = p[0].toFixed(1), Y = p[1].toFixed(1)
            return (
              <g key={n.id} className="gn" opacity={dim ? 0.3 : 1} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={n.l} onClick={() => w.pickNode(n.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); w.pickNode(n.id) } }}>
                {(sel === n.id || (act && act[n.id])) && <circle cx={X} cy={Y} r={13} fill={c} opacity={0.14} />}
                {n.warn && <circle cx={X} cy={Y} r={10.5} fill="none" stroke="var(--gap)" strokeWidth={2} />}
                <circle cx={X} cy={Y} r={6.5} fill={n.t === 'pol' || n.t === 'proc' ? 'var(--panel)' : c} stroke={c} strokeWidth={2} />
                <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor={anc} fontSize={12} fontWeight={500} fill="var(--ink)" paintOrder="stroke" stroke="var(--panel)" strokeWidth={4} strokeLinejoin="round">{n.l}</text>
                <circle cx={X} cy={Y} r={18} fill="transparent" />
              </g>
            )
          })}
          <g style={{ cursor: 'pointer' }} onClick={() => { w.setGsel(null); w.setGfocus(null) }}>
            <rect x={cx - 62} y={cy - 20} width={124} height={40} rx={20} fill="var(--ink)" />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={12.5} fontWeight={600} fill="var(--panel)">This process</text>
          </g>
        </svg>
        <div className="gleg">{(['auto', 'ppl', 'pol', 'proc'] as const).map((t) => <span key={t}><i style={{ background: t === 'pol' || t === 'proc' ? 'var(--panel)' : GCOLS[t], borderColor: GCOLS[t] }} />{GNAME[t]}</span>)}<span><i style={{ background: 'var(--panel)', borderColor: 'var(--gap)' }} />Needs attention</span></div>
        <div className={'gcap' + (w.flash === 'cap' ? ' in' : '')}>{cap}</div>
      </div>
    </>
  )
}

function Acc({ k, title, hint, children }: { k: string; title: string; hint: string; children: React.ReactNode }) {
  const w = useW()
  return (
    <details className="acc" id={'sec-' + k} open={!!w.secs[k]} onToggle={(e) => {
      const t = e.currentTarget, open = t.open
      if (!!w.secs[k] !== open) w.setSecs((s) => ({ ...s, [k]: open }))
      if (open) { t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); window.setTimeout(() => t.classList.remove('in'), 400) }
    }}>
      <summary><span className="at">{title}</span><span className="ah">{hint}</span></summary>
      <div className="ab">{children}</div>
    </details>
  )
}

/** The provenance rail: how the page was built, or the full trail for one fact. */
function Rail() {
  const w = useW(), c = counts(w.B)
  if (!w.sel) return (
    <div className="rcard"><div className="rh"><b style={{ fontSize: 16 }}>How Asoka built this page</b></div>
      <div className="rdef">Tap any paragraph to see why Asoka believes it. Most paragraphs carry no marks. Asoka only flags what’s uncertain, new, or unofficial.</div>
      <div className="rstat"><div><b>23</b><span>observations</span></div><div><b>6</b><span>sources</span></div><div><b>{c.ver} of {ORDER.length}</b><span>verified by Dana</span></div><div><b>{c.gap}</b><span>open question{c.gap === 1 ? '' : 's'}</span></div></div>
      <div className="rsub">Sources used</div><div className="rdef">Salesforce setup and audit trail, Slack, Jira, meeting transcripts, the sales policy, and approvals Asoka watched happen.</div></div>
  )
  const b = w.B[w.sel]
  return (
    <div className="rcard"><div className="rh"><span className={'tchip t-' + b.tier}>{TIER[b.tier][0]}</span><button className="x" onClick={() => w.setSel(null)} aria-label="Close">×</button></div>
      <p className="rq">“{b.text}”</p><div className="rdef">{TIER[b.tier][1]}</div>
      <div className="rsub">Where this came from</div>
      <ol className="chain">{b.prov.map((p, i) => <li key={i}><span className={'ic k-' + p.k} title={KIND[p.k][1]}>{KIND[p.k][0]}</span><div><div className="cs">{p.s} <span className="cw">{p.w}</span></div><div className="ct">{p.t}</div></div></li>)}</ol>
      {b.tier !== 'ver' && <div className="rdef" style={{ marginTop: 14 }}>Not verified by a person yet. If new observations contradict it, Asoka will flag the change.</div>}
      <div style={{ marginTop: 14 }}><button className="chip" onClick={() => w.askAbout(w.sel!)}>Ask Asoka about this</button></div></div>
  )
}

const RELATED = ['Discount policy', 'Quarter-end close', 'CPQ quote sync', 'Deal Desk', 'Renewals']

export function Page() {
  const w = useW(), c = counts(w.B), B = w.B
  return (
    <>
      <div className="pg">
        <article className="art">
          <div className="arr"><span>Prototype, arriving:</span>{(Object.keys(MODES) as Mode[]).map((m) => <button key={m} className={w.mode === m ? 'on' : ''} onClick={() => w.go('page', { mode: m })}>{MODES[m]}</button>)}</div>
          <div className="kick">Sales Cloud, process</div><h1 className="ttl">Opportunity approvals</h1>
          <div className="health"><span className="h"><span className="pdot" />Kept current by Asoka. Changed {w.updated ? 'just now' : '2 days ago'}.</span><button className="tog" onClick={() => w.setBlame((x) => !x)} aria-pressed={w.blame}>{w.blame ? 'Hide how Asoka knows' : 'How Asoka knows this'}</button></div>
          {w.blame && <div className="lensleg">{(['ver', 'cor', 'one', 'gap'] as const).map((k) => <span key={k}><i style={{ background: TCOL[k] }} />{c[k]} {TIER[k][0].toLowerCase()}</span>)}<span style={{ color: 'var(--ink2)' }}>{ORDER.length} facts, 23 observations, 6 sources</span></div>}
          <Context />
          <Acc k="how" title="How it works" hint={hintOf(B, 'The flow, step by step', ['s', 'b1', 'b2', 'b3'])}>
            <Blk id="s" />
            <div className="diag"><div className="dl"><span>Drawn by Asoka from the approval process</span><span><span className="pdot" style={{ display: 'inline-block', marginRight: 6 }} />6 approvals in flight now</span></div><Diagram /></div>
            <Blk id="b1" /><Blk id="b2" /><Blk id="b3" />
          </Acc>
          <Acc k="map" title="How it connects" hint="5 automations, 6 people, 2 policies, 1 process. One needs attention"><Graph /></Acc>
          <Acc k="rules" title="Rules" hint={hintOf(B, '2 rules, enforced in Salesforce', ['b4', 'b5'])}><Blk id="b4" /><Blk id="b5" /></Acc>
          <Acc k="unw" title="Unwritten rules" hint={hintOf(B, 'What people actually do', ['b6', 'b7'])}><p className="note">Things nobody wrote down. Asoka learned them from how people actually work.</p><Blk id="b6" /><Blk id="b7" /></Acc>
          <Acc k="own" title="Who owns it" hint="Maria Okafor owns it. Deal Desk runs it">
            <ul className="slist">{[['Maria Okafor', 'Process owner, RevOps'], ['Deal Desk', 'Runs approvals day to day'], ['Dana Ruiz', 'Asoka’s sysadmin. Verifies this page']].map(([a, r]) => <li key={a}><span className="a">{a}</span><span className="r">{r}</span></li>)}</ul>
          </Acc>
          <Acc k="hist" title="Recent changes" hint="Last change Oct 28">
            <ul className="slist">{[['Oct 28', 'CRO threshold lowered from 40% to 35%', 'Salesforce change, confirmed by SF-2231'], ['Oct 1', 'Quarter-end approvals written down for the first time', 'From 9 Slack threads'], ['Sep 12', 'Finance review added above 20%', 'Salesforce change']].map(([d, a, b]) => <li key={d}><span><span className="a">{a}</span><br /><span className="b">{b}</span></span><span className="r">{d}</span></li>)}</ul>
          </Acc>
          <div className="rel" style={{ marginTop: 22 }}>{RELATED.map((x) => <button key={x} className="pill" onClick={w.stub}>{x}</button>)}</div>
          <div className="demo">Prototype: {w.updated ? 'the new observation has landed.' : <><button className="lnk" onClick={w.observe}>simulate a new observation</button>.</>}</div>
        </article>
        <aside className={'rail' + (w.sel ? ' open' : '')} id="rail" aria-label="Where this came from"><Rail /></aside>
      </div>
      <div className={'scrim' + (w.sel ? ' on' : '')} onClick={() => w.setSel(null)} />
    </>
  )
}
