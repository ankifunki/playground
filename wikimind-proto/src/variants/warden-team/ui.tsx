import type React from 'react'
import { createContext, useContext } from 'react'
import { DIMS, G, GCOL, LVL, STAGES, TYPEN } from './data'
import type { Warden } from './engine'

export const Ctx = createContext<Warden | null>(null)
export const useE = () => { const e = useContext(Ctx); if (!e) throw new Error('no engine'); return e }
const tmS = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const tmH = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const stCls = (s: string) => (s === 'Blocked' ? 'Blocked' : s === 'Undone' ? 'Undone' : s === 'Done' ? '' : 'wait')

/* ---------- avatars ---------- */
function Glyph({ id }: { id: string }) {
  const f = `var(--${id}-fg)`
  if (id === 'iris') return <><rect x="20" y="20" width="24" height="24" rx="6" fill="none" stroke={f} strokeWidth="2.5" /><path d="M26 16v4M32 16v4M38 16v4M26 44v4M32 44v4M38 44v4M16 26h4M16 38h4M44 26h4M44 38h4" stroke={f} strokeWidth="2.5" strokeLinecap="round" /><circle cx="27.5" cy="30" r="2.4" fill={f} /><circle cx="36.5" cy="30" r="2.4" fill={f} /><path d="M28 37q4 3 8 0" fill="none" stroke={f} strokeWidth="2.2" strokeLinecap="round" /></>
  if (id === 'sol') return <><path d="M32 15l14 5v11c0 9-6 15-14 18c-8-3-14-9-14-18V20z" fill="none" stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><circle cx="27" cy="29" r="2.4" fill={f} /><circle cx="37" cy="29" r="2.4" fill={f} /><path d="M28 37h8" stroke={f} strokeWidth="2.2" strokeLinecap="round" /></>
  if (id === 'fen') return <><circle cx="27" cy="25" r="2.4" fill={f} /><circle cx="37" cy="25" r="2.4" fill={f} /><rect x="21" y="38" width="5" height="9" rx="1.5" fill={f} /><rect x="29.5" y="34" width="5" height="13" rx="1.5" fill={f} /><rect x="38" y="30" width="5" height="17" rx="1.5" fill={f} /></>
  return <><circle cx="27" cy="32" r="11" fill="none" stroke={f} strokeWidth="2.5" /><circle cx="37" cy="32" r="11" fill="none" stroke={f} strokeWidth="2.5" /><circle cx="29" cy="30" r="2.2" fill={f} /><circle cx="35" cy="30" r="2.2" fill={f} /><path d="M29 36q3 2.4 6 0" fill="none" stroke={f} strokeWidth="2.2" strokeLinecap="round" /></>
}
/** The ring says how an agent is doing and pulses while it's thinking; the badge counts what waits on you. */
export function Avatar({ a, size, badge }: { a: any; size: number; badge?: boolean }) {
  const e = useE(), st = e.stOf(a), rc = st === 'ok' ? 'var(--ok)' : st === 'watch' ? 'var(--warn)' : 'var(--bad)', n = badge ? e.agentPend(a).length : 0
  return <span className="avw" aria-hidden="true"><svg viewBox="0 0 64 64" width={size} height={size}><circle className={'ring' + (e.S.thinking === a.id ? ' think' : '')} cx="32" cy="32" r="30" fill="none" stroke={rc} strokeWidth="2.5" /><rect x="7" y="7" width="50" height="50" rx="17" fill={`var(--${a.id}-bg)`} /><Glyph id={a.id} /></svg>{n > 0 && <span className="badge">{n}</span>}</span>
}

/* ---------- messages ---------- */
function Btns({ k, i, yes, no }: { k: string; i: number; yes: string; no?: string }) {
  const e = useE(), m = e.thread(k)[i]
  return <div className="btns"><button className={'btn' + (no ? ' pri' : '')} onClick={() => e.resolve(k, m, true)}>{yes}</button>{no && <button className="btn" onClick={() => e.resolve(k, m, false)}>{no}</button>}</div>
}
function Note({ k, m, i }: { k: string; m: any; i: number }) {
  const e = useE(), lab = ({ ask: 'Needs you', unless: 'Will do unless you say no', fyi: 'For your info' } as any)[m.kind]
  return (
    <div className="card">
      <div className="nl"><span className={'kd ' + m.kind}>{lab}</span><span className="src">Learned from {m.src}</span></div>
      <div className="t">{m.title}</div><div className="w">{m.why}</div>
      {m.kind === 'unless' && !m.res && <div className="when">{m.when}</div>}
      {m.res ? <div className="res">{m.res}{m.w && <> <button className="lnk" onClick={() => e.go('trace:' + m.w)}>Trace</button></>}</div>
        : m.kind === 'ask' ? <Btns k={k} i={i} yes="Yes" no="No" /> : m.kind === 'unless' ? <Btns k={k} i={i} yes="Go ahead" no="Don’t" /> : <Btns k={k} i={i} yes="Got it" />}
    </div>
  )
}
export function Msg({ k, m, i }: { k: string; m: any; i: number }) {
  const e = useE()
  switch (m.k) {
    case 'u': return <div className="u">{m.text}</div>
    case 'a': return <div className="a">{m.text}</div>
    case 'rcpt': return <div className="rc"><span>✓</span>{m.text}{m.w && <button className="lnk" onClick={() => e.go('trace:' + m.w)}>Trace</button>}</div>
    case 'note': return <Note k={k} m={m} i={i} />
    case 'plan': {
      const names = m.agents.map((id: string) => e.ag(id).name), rest = names.slice(1)
      const code = 'connection: ' + m.tool.toLowerCase() + '\ncredential: service-account, scope=' + (m.mode === 'read' ? 'read' : 'write-proposed') + ', rotate=30d\nrollout: canary=' + m.agents[0] + ' (1d) -> ' + (rest.length ? m.agents.slice(1).join(', ') : 'none') + '\nlevel: ' + (m.mode === 'read' ? 'L0 observe' : 'L1 propose') + '\nshared_knowledge: +1 fact'
      return <div className="card"><div className="t">Roll out {m.tool}</div>
        <ul className="ul"><li>{names[0]} gets it first{rest.length ? ', then ' + rest.join(' and ') + ' after one clean day' : ''}.</li><li>{m.mode === 'read' ? 'Read-only' : 'Propose-only, so a person approves every change'}. Scoped service account, rotated every 30 days.</li><li>Nobody acts on their own in {m.tool} until they’ve earned it.</li></ul>
        <details className="rule"><summary>See the plan</summary><code>{code}</code></details>
        {m.res ? <div className="res">{m.res}</div> : <Btns k={k} i={i} yes="Roll out" no="Change" />}</div>
    }
    case 'rollout': {
      const R = m.ref, md = R.mode === 'read' ? 'read-only' : 'propose-only'
      return <div className="card"><div className="ih"><div className="t">{R.tool}</div><span className={'tag' + (R.stage === 0 ? ' s' : '')}>{R.stage === 0 ? 'Canary' : 'Live'}</span></div>
        <div className="rlist">{R.agents.map((id: string, j: number) => { const g = e.ag(id); return <span key={id} style={{ display: 'contents' }}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar a={g} size={26} />{g.name}</span><em>{R.stage === 1 || j === 0 ? 'Connected, ' + md : 'Waiting for a clean day'}</em></span> })}</div></div>
    }
    case 'revoke':
      return <div className="card"><div className="t">Remove {m.tool} everywhere?</div><div className="w">{m.holders.map((id: string) => e.ag(id).name).join(' and ')} have access. I’ll revoke their credentials, drop what they learned only from {m.tool}, and keep the audit history.</div>
        {m.res ? <div className="res">{m.res}</div> : <Btns k={k} i={i} yes="Revoke" no="Keep" />}</div>
    case 'grule':
      return <div className="card"><div className="t">{m.rule}</div><div className="w">Applies to {m.scope.length === e.A.length ? 'the whole team' : e.ag(m.scope[0]).name + ' only'}. It becomes a hard rule, not a habit.</div>
        <details className="rule"><summary>See the rule</summary><code>{m.code}</code></details>
        {m.res ? <div className="res">{m.res}</div> : <Btns k={k} i={i} yes="Apply" no="Not now" />}</div>
    case 'facts': return <div className="card"><div className="t">Shared knowledge</div><div className="w">What everyone on the team knows about the company. Newest last.</div><ul className="ul">{e.S.facts.map((f: string) => <li key={f}>{f}</li>)}</ul></div>
    case 'lessons': return <div className="card"><div className="t">What I’ve learned</div><div className="w">Habits that change how I work. Say “forget” plus the habit to remove one.</div><ul className="ul">{e.ag(k).lessons.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
  }
  return null
}
export const Typing = ({ k }: { k: string }) => { const e = useE(); return e.S.typing === k ? <div className="typing" aria-label="Typing"><i /><i /><i /></div> : null }

/* ---------- team and agent ---------- */
export function TeamView() {
  const e = useE(), A = e.A, hr = new Date().getHours(), gw = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'
  const nd = A.reduce((s: number, a: any) => s + e.agentPend(a).length, 0) + e.fleetPend().length, np = A.filter((a: any) => a.paused).length
  const notes: { a: any; m: any }[] = []
  A.forEach((a: any) => a.msgs.forEach((m: any) => { if (m.k === 'note') notes.push({ a, m }) }))
  notes.sort((x, y) => y.m.ts - x.m.ts)
  return (
    <>
      <section className="greet"><h1>{gw}, Priya</h1><p>{np === A.length ? 'Everyone is paused. Resume when you’re ready.' : nd ? (nd === 1 ? 'One thing needs you' : nd + ' things need you') + '. Everything else is handled.' : 'Nothing needs you right now. The team has it.'}</p></section>
      <div className="grid">{A.map((a: any) => <button key={a.id} className="mate" onClick={() => e.go(a.id)} aria-label={`Open ${a.name}, ${a.role}`}><Avatar a={a} size={56} badge /><span><span className="nm">{a.name}</span><br /><span className="rl">{a.role}</span></span><span className="ln">{e.lineOf(a)}</span></button>)}</div>
      {notes.length > 0 && <><h2>Noticed lately</h2>{notes.slice(0, 5).map(({ a, m }, i) => {
        const st = m.res ? m.res : ({ ask: 'needs you', unless: 'will go ahead unless you say no', fyi: 'for your info' } as any)[m.kind]
        return <button key={i} className="nt" onClick={() => e.go(a.id)}><Avatar a={a} size={34} /><span className="tx"><span className="tt">{m.title}</span><br /><span className="sb">{a.name}, {st.charAt(0).toLowerCase() + st.slice(1)}</span></span></button>
      })}</>}
      {(e.S.team.length > 0 || e.S.typing === 'team') && <h2>Team chat</h2>}
      {e.S.team.map((m: any, i: number) => <Msg key={i} k="team" m={m} i={i} />)}
      <Typing k="team" />
    </>
  )
}
export function AgentView({ a }: { a: any }) {
  const e = useE()
  return (
    <>
      <section className="ahead">
        <div className="row1"><Avatar a={a} size={76} /><div><h1>{a.name}</h1><div className="rl">{a.role}<span className="ai">AI agent</span></div></div></div>
        <div className="ln">{e.lineOf(a)}</div>
        <div className="facts"><span>Does on its own</span><span>{a.auto} kinds of work</span><span>Asks you first</span><span>{a.prop} kinds of work</span><span>Works in</span><span>{a.tools.join(', ')}</span><span>Speaks up</span><span>At most {a.budget} times a day{a.saved ? ', ' + a.saved + ' saved for your digest' : ''}</span></div>
        <div className="btns"><button className="btn pri" onClick={() => e.go(a.id + ':b')}>How {a.name} works</button><button className={'btn' + (a.paused ? '' : ' stop')} onClick={() => e.pause(a, !a.paused)}>{a.paused ? 'Resume ' : 'Pause '}{a.name}</button><button className="lnk" onClick={() => e.go(a.id + ':log')}>Work log</button></div>
      </section>
      {!a.msgs.length && e.S.typing !== a.id && <p className="w">Nothing new from {a.name}. It speaks up when it notices something worth your time.</p>}
      {a.msgs.map((m: any, i: number) => <Msg key={i} k={a.id} m={m} i={i} />)}
      <Typing k={a.id} />
    </>
  )
}

/* ---------- work log and traces ---------- */
export function LogView({ who }: { who: string }) {
  const e = useE(), a = who === 'all' ? null : e.ag(who)
  const list = e.WORK.filter((u: any) => (!a || u.agent === a.id) && e.matchQ(u)).sort((x: any, y: any) => y.ts - x.ts)
  return (
    <>
      <section className="bh"><div className="row1">{a && <Avatar a={a} size={48} />}<div><h1>{a ? a.name + '’s work log' : 'All work'}</h1><div className="rl">Every unit of work, newest first. Tap one for its full trace.</div></div></div></section>
      {e.S.q && <div className="btns" style={{ margin: '-6px 0 12px' }}><span className="pt l">Showing: {e.S.q}</span><button className="lnk" onClick={e.clearQ}>Clear</button></div>}
      {list.length ? list.map((u: any) => <button key={u.id} className="wrow" onClick={() => e.go('trace:' + u.id)}><time>{tmH(u.ts)}</time>{!a && <Avatar a={e.ag(u.agent)} size={24} />}<span className="x">{u.title}</span><span className={'st2 ' + stCls(u.status)}>{u.status}</span></button>) : <p className="w">Nothing matches. Try a person, a system, or “blocked.”</p>}
      {a && <p style={{ marginTop: 10 }}><button className="lnk" onClick={() => e.go('all:log')}>See the whole team’s work</button></p>}
    </>
  )
}
export function TraceView({ u }: { u: any }) {
  const e = useE()
  if (!u) return <p className="w">That trace doesn’t exist.</p>
  const a = e.ag(u.agent), r = u.link ? e.unitById(u.link) : null
  return (
    <>
      <section className="bh"><div className="row1"><Avatar a={a} size={44} /><div><h1 style={{ fontSize: 21 }}>{u.title}</h1><div className="rl">{a.name}, {a.role} <span className={'st2 ' + stCls(u.status)}>{u.status}</span></div></div></div>
        <div className="mono">{u.id.toUpperCase()}, started {tmS(u.ts)}</div><div className="w" style={{ marginTop: 6 }}>{u.why}</div></section>
      <ol className="tlog">{u.steps.map((s: any, i: number) => { const c = s.k === 'Blocked' ? 'bk' : s.who === 'You' || s.who === 'Dev' ? 'you' : s.k === 'Did' || s.k === 'Result' ? 'ok' : ''; return <li key={i} className={c}><div><span className="k">{s.k}</span><span className="tm">{tmS(u.ts + s.s * 1000)}</span></div><div className="d">{s.d}</div><div className="who">{s.who}</div></li> })}</ol>
      {r && <button className="nt" onClick={() => e.go('trace:' + r.id)}><Avatar a={e.ag(r.agent)} size={30} /><span className="tx"><span className="tt">Related: {r.title}</span><br /><span className="sb">{e.ag(r.agent).name}</span></span></button>}
      <div className="btns"><button className="btn" onClick={() => e.toast('Copied ' + u.id.toUpperCase() + ' as JSON, with every step, actor, and timestamp.')}>Copy as JSON</button>{u.rev && u.status === 'Done' && <button className="btn stop" onClick={() => e.undoUnit(u.id)}>Undo this</button>}</div>
      <p className="w" style={{ fontSize: 13.5, marginTop: 12 }}>Kept for 7 years. Read-only: nobody, including the agent, can edit a trace.</p>
    </>
  )
}

/* ---------- brain: map, profile, details ---------- */
function BrainMap({ a }: { a: any }) {
  const e = useE(), S = e.S, g = G[a.id], cx = 200, cy = 200, W = S.walk && S.walk.id === a.id ? S.walk : null, f = `var(--${a.id}-fg)`
  const order = ['sys', 'rule', 'know', 'habit', 'ppl'], pos: Record<string, [number, number, number]> = {}
  const inner = g.nodes.filter((n: any) => n.t === 'pb'), outer = g.nodes.filter((n: any) => n.t !== 'pb').sort((x: any, y: any) => order.indexOf(x.t) - order.indexOf(y.t))
  inner.forEach((n: any, i: number) => { const an = -Math.PI / 2 + (i * 2 * Math.PI) / inner.length + 0.35; pos[n.id] = [cx + 62 * Math.cos(an), cy + 62 * Math.sin(an), an] })
  outer.forEach((n: any, i: number) => { const an = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / outer.length; pos[n.id] = [cx + 128 * Math.cos(an), cy + 128 * Math.sin(an), an] })
  pos['@'] = [cx, cy, 0]
  const edges: [string, string][] = g.edges.slice(), linked: Record<string, 1> = {}
  g.edges.forEach((ed: [string, string]) => { linked[ed[0]] = 1; linked[ed[1]] = 1 })
  inner.forEach((n: any) => edges.push(['@', n.id])); outer.forEach((n: any) => { if (!linked[n.id]) edges.push(['@', n.id]) })
  let act: Record<string, 1> | null = null
  if (W) { act = { '@': 1 }; g.walk.steps[W.i].n.forEach((id: string) => (act![id] = 1)); if (W.i >= 1) act[g.walk.pb] = 1 }
  else if (S.gsel && pos[S.gsel]) { act = { [S.gsel]: 1 }; edges.forEach(([x, y]) => { if (x === S.gsel) act![y] = 1; if (y === S.gsel) act![x] = 1 }) }
  let cap: React.ReactNode
  if (W) {
    const stp = g.walk.steps[W.i]
    cap = <div className="cap"><div className="cap-k">Watching: {g.walk.title}</div><div className="stages">{STAGES.map((st, i) => <button key={st} className={'stg' + (i === W.i ? ' on' : i < W.i ? ' done' : '')} onClick={() => e.pickStage(i)}>{st}</button>)}</div><div className="cap-t">{STAGES[W.i]}</div><div className="w">{stp.t}</div>
      <div className="btns">{W.playing ? <button className="btn" onClick={e.closeWalk}>Stop</button> : <><button className="btn pri" onClick={() => e.playWalk(a)}>Replay</button><button className="btn" onClick={e.closeWalk}>Close</button></>}</div></div>
  } else if (S.gsel && S.gsel !== '@') {
    const nd = g.nodes.find((n: any) => n.id === S.gsel), nb: string[] = []
    edges.forEach(([x, y]) => { const o = x === S.gsel ? y : y === S.gsel ? x : null; if (o && o !== '@') { const n2 = g.nodes.find((n: any) => n.id === o); if (n2) nb.push(n2.l) } })
    cap = <div className="cap"><div className="cap-k">{TYPEN[nd.t]}</div><div className="cap-t">{nd.l}</div><div className="w">{nd.d}</div>{nb.length > 0 && <div className="w" style={{ fontSize: 14, marginTop: 6 }}>Connected to {nb.join(', ')}.</div>}<div className="w" style={{ fontSize: 13.5, marginTop: 8 }}>To change it, tap it in the details below or tell {a.name}.</div></div>
  } else cap = <div className="cap"><div className="w">Every task runs the same loop: {STAGES.join(', ').toLowerCase()}. Tap any point on the map to see what it touches.</div><div className="btns"><button className="btn pri" onClick={() => e.playWalk(a)}>▶ Watch {a.name} handle a task</button></div></div>
  return (
    <div className="card" style={{ marginBottom: 14 }}><div className="t">Brain map</div><div className="w">What {a.name} knows and uses, and how it all connects.</div>
      <svg className="gsvg" viewBox="0 0 400 400" width="100%" role="img" aria-label={`Map of ${a.name}’s playbooks, systems, rules, knowledge, habits, and people`}>
        {edges.map(([x, y], i) => {
          const p = pos[x], q = pos[y]; if (!p || !q) return null
          const on = !!act && !!act[x] && !!act[y] && (!!W || x === S.gsel || y === S.gsel)
          const mx = (p[0] + q[0]) / 2 + (cy - (p[1] + q[1]) / 2) * 0.12, my = (p[1] + q[1]) / 2 + ((p[0] + q[0]) / 2 - cx) * 0.12
          return <path key={i} d={`M${p[0].toFixed(1)} ${p[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`} fill="none" stroke={on ? f : 'var(--line)'} strokeWidth={on ? 2.4 : 1.3} opacity={act && !on ? 0.35 : 1} strokeLinecap="round" />
        })}
        {g.nodes.map((n: any) => {
          const p = pos[n.id], dim = !!act && !act[n.id], r = n.t === 'pb' ? 10 : 6.5, c = n.t === 'pb' ? f : GCOL[n.t], hl = S.gsel === n.id || (W && act && act[n.id])
          let lx: number, ly: number, anc: 'start' | 'end' | 'middle'
          if (n.t === 'pb') { lx = p[0]; ly = p[1] + 25; anc = 'middle' }
          else { const co = Math.cos(p[2]), si = Math.sin(p[2]); lx = cx + 142 * co; ly = cy + 142 * si + 4; anc = co > 0.3 ? 'start' : co < -0.3 ? 'end' : 'middle'; if (anc === 'middle') ly += si > 0 ? 9 : -3 }
          const X = p[0].toFixed(1), Y = p[1].toFixed(1)
          return (
            <g key={n.id} className="gn" opacity={dim ? 0.28 : 1} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={n.l} onClick={() => e.pickNode(n.id)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); e.pickNode(n.id) } }}>
              {hl && <circle cx={X} cy={Y} r={r + 6} fill={c} opacity={0.16} />}
              <circle cx={X} cy={Y} r={r} fill={n.t === 'ppl' ? 'var(--panel)' : c} stroke={c} strokeWidth={2} />
              <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor={anc} fontSize={12} fontWeight={n.t === 'pb' ? 700 : 500} fill="var(--ink)" paintOrder="stroke" stroke="var(--panel)" strokeWidth={4} strokeLinejoin="round">{n.l}</text>
              <circle cx={X} cy={Y} r={18} fill="transparent" />
            </g>
          )
        })}
        <g style={{ cursor: 'pointer' }} onClick={e.clearMap} transform={`translate(${cx - 27},${cy - 27}) scale(.84)`}><circle cx="32" cy="32" r="31" fill="var(--panel)" /><rect x="7" y="7" width="50" height="50" rx="17" fill={`var(--${a.id}-bg)`} /><Glyph id={a.id} /></g>
      </svg>
      <div className="legend">{[['pb', 'Playbooks'], ['sys', 'Systems'], ['rule', 'Hard rules'], ['know', 'Knowledge'], ['habit', 'Habits'], ['ppl', 'People']].map(([t, l]) => { const cc = t === 'pb' ? f : GCOL[t]; return <span key={t}><i style={{ background: t === 'ppl' ? 'var(--panel)' : cc, borderColor: cc }} />{l}</span> })}</div>
      {cap}
    </div>
  )
}
function Radar({ a, P, D }: { a: any; P: any; D: any }) {
  const cx = 150, cy = 118, R = 74, n = DIMS.length, f = `var(--${a.id}-fg)`
  const pt = (i: number, v: number) => { const an = -Math.PI / 2 + (i * 2 * Math.PI) / n, r = (R * v) / 5; return [cx + r * Math.cos(an), cy + r * Math.sin(an)] }
  const poly = (V: any) => DIMS.map((d, i) => pt(i, V[d.k]).map((x) => x.toFixed(1)).join(',')).join(' ')
  const changed = DIMS.some((d) => D[d.k] !== P[d.k])
  return (
    <svg viewBox="0 0 300 236" width="100%" style={{ maxWidth: 340 }} role="img" aria-label="Operating profile across five dials">
      {[1, 2, 3, 4, 5].map((lv) => { const ring: any = {}; DIMS.forEach((d) => (ring[d.k] = lv)); return <polygon key={lv} points={poly(ring)} fill="none" stroke="var(--line)" strokeWidth={1} /> })}
      {DIMS.map((d, i) => { const p = pt(i, 5); return <line key={d.k} x1={cx} y1={cy} x2={p[0].toFixed(1)} y2={p[1].toFixed(1)} stroke="var(--line)" /> })}
      {changed && <polygon points={poly(P)} fill="none" stroke="var(--ink2)" strokeWidth={1.5} strokeDasharray="4 3" />}
      <polygon points={poly(D)} fill={f} fillOpacity={0.18} stroke={f} strokeWidth={2.4} strokeLinejoin="round" />
      {DIMS.map((d, i) => { const p = pt(i, D[d.k]), L = pt(i, 6.1), anc = Math.abs(L[0] - cx) < 8 ? 'middle' : L[0] > cx ? 'start' : 'end'; return <g key={d.k}><circle cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={4} fill={f} /><text x={L[0].toFixed(1)} y={(L[1] + 4).toFixed(1)} textAnchor={anc} fontSize={12.5} fontWeight={600} fill="var(--ink)">{d.name}</text></g> })}
    </svg>
  )
}
/** Five dials. Drag one to see what last week would have looked like, then apply; widening needs Dev. */
function Profile({ a }: { a: any }) {
  const e = useE(), S = e.S, P = a.prof, D = S.draft && S.draft.id === a.id ? S.draft.v : P, ch = DIMS.filter((d) => D[d.k] !== P[d.k])
  return (
    <div className="card" style={{ marginBottom: 14 }}><div className="t">Operating profile</div><div className="w">Five dials that shape how {a.name} approaches every task. Drag one to see what would change.</div>
      <div className="radar"><Radar a={a} P={P} D={D} /></div>
      {DIMS.map((d) => <div className="dial" key={d.k}><div className="dh"><span className="dn">{d.name}</span><span className="dv">{d.words[D[d.k] - 1]}</span></div><input type="range" min={1} max={5} step={1} value={D[d.k]} onChange={(ev) => e.setDial(d.k, +ev.target.value)} aria-label={d.name} /><div className="de"><span>{d.lo}</span><span>{d.hi}</span></div></div>)}
      <div>{!ch.length ? <><div className="imp-h">Last week, at these settings</div>{[DIMS[0], DIMS[1], DIMS[3]].map((d) => <div className="imp" key={d.k}><b>{d.imp(a, P[d.k])}</b></div>)}</>
        : <><div className="imp-h">If these settings had been on last week</div>{ch.map((d) => { const now = d.imp(a, P[d.k]); return <div className="imp" key={d.k}><b>{d.imp(a, D[d.k])}</b><small>Now: {now.charAt(0).toLowerCase() + now.slice(1)}</small></div> })}
          {e.isWide(P, D) && <div className="w" style={{ fontSize: 14, marginTop: 4 }}>This widens what {a.name} can do, so Dev has to approve it.</div>}
          <div className="btns"><button className="btn pri" onClick={() => e.applyProf(a)}>Apply</button><button className="btn" onClick={e.resetDials}>Reset</button></div></>}</div>
      {S.profMsg && S.profMsg.id === a.id && <div className="res">{S.profMsg.t}</div>}
    </div>
  )
}
function Pk({ sec, i, j = null, children, tag }: { sec: string; i: number; j?: number | null; children: React.ReactNode; tag?: React.ReactNode }) {
  const e = useE(), f = e.S.focus, on = !!f && f.sec === sec && f.i === i && f.j === j
  return <button className={'pk' + (on ? ' on' : '')} onClick={() => e.pick(sec, i, j)}><span className="x">{children}</span>{tag}</button>
}
const Tg = ({ t, c }: { t: string; c?: string }) => <span className={'pt' + (c ? ' ' + c : '')}>{t}</span>
const Sec = ({ t, s, open, children }: { t: string; s: string; open?: boolean; children: React.ReactNode }) => <details className="sec" open={open}><summary><span className="st">{t}</span><span className="ss">{s}</span></summary><div className="sb2">{children}</div></details>
function Chg({ a, m, i }: { a: any; m: any; i: number }) {
  const e = useE()
  return <div className="card"><div className="t">{m.label}</div><div className="diff"><div className="d">− {m.before}</div><div className="p">+ {m.after}</div></div>{m.note && <div className="w" style={{ fontSize: 14 }}>{m.note}</div>}
    {m.res ? <div className="res">{m.res}</div> : <div className="btns"><button className="btn pri" onClick={() => e.chgGo(a, a.bmsgs[i], true)}>Apply</button><button className="btn" onClick={() => e.chgGo(a, a.bmsgs[i], false)}>Cancel</button></div>}</div>
}
export function BrainView({ a }: { a: any }) {
  const e = useE(), B = e.BR[a.id], k = a.id + ':b'
  let asks = 0; B.sops.forEach((s: any) => s.steps.forEach((x: any) => { if (x.h) asks++ }))
  const c: Record<string, number> = { read: 0, propose: 0, act: 0 }; B.access.forEach((x: any) => c[x.lvl]++)
  const dyn = e.S.rules.filter((r: any) => r.scope.includes(a.id))
  return (
    <>
      <section className="bh"><div className="row1"><Avatar a={a} size={52} /><div><h1>How {a.name} works</h1><div className="rl">Everything that shapes what {a.name} does. Tap any line to change it, or just say what you want.</div></div></div></section>
      <BrainMap a={a} />
      <Profile a={a} />
      <h2>The details</h2>
      <Sec t="Job" s={B.job.split('. ')[0].replace(/\.$/, '') + '.'}><Pk sec="job" i={0}>{B.job}</Pk>{B.people.map((p: string, i: number) => <Pk key={i} sec="people" i={i}>{p}</Pk>)}</Sec>
      <Sec t="Playbooks" s={`${B.sops.length} playbooks. ${asks} step${asks === 1 ? '' : 's'} ask you first.`} open>
        {B.sops.map((s: any, i: number) => <div className="sop" key={s.name}><Pk sec="sops" i={i}><b>{s.name}</b></Pk><div className="trg">Runs when: {s.trigger}</div><ol>{s.steps.map((x: any, j: number) => <li key={j}><Pk sec="sops" i={i} j={j} tag={x.h ? <Tg t="Asks you" c="h" /> : undefined}>{x.t}</Pk></li>)}</ol><div className="meta">Ran {s.runs} times. You edited it {s.edits} times.</div></div>)}
      </Sec>
      <Sec t="Access" s={`${B.access.length} systems. Acts in ${c.act}, proposes in ${c.propose}, reads ${c.read}.`}>{B.access.map((x: any, i: number) => <Pk key={x.sys} sec="access" i={i} tag={<span className={'lvp ' + x.lvl}>{LVL[x.lvl]}</span>}><b>{x.sys}</b><br /><span className="sc">{x.scope}</span></Pk>)}</Sec>
      <Sec t="Hard rules" s={`${B.bounds.length + dyn.length} rules the model can’t override.`}>{B.bounds.map((x: any, i: number) => <Pk key={i} sec="bounds" i={i} tag={<Tg t={x.src === 'team' ? 'Team' : 'You'} />}>{x.t}</Pk>)}{dyn.map((r: any, i: number) => <div className="hi" key={'d' + i}><span className="x">{r.rule}</span><Tg t={r.scope.length === e.A.length ? 'Team' : 'You'} /></div>)}</Sec>
      <Sec t="Learned habits" s={`${a.lessons.length} habit${a.lessons.length === 1 ? '' : 's'} picked up from your decisions.`}>{a.lessons.length ? a.lessons.map((x: string, i: number) => <Pk key={i} sec="lessons" i={i} tag={<Tg t="Learned" c="l" />}>{x}</Pk>) : <div className="hi">Nothing learned yet.</div>}</Sec>
      <Sec t="Knowledge" s={`${B.know.length} things of its own, plus ${e.S.facts.length} team facts.`}>{B.know.map((x: string, i: number) => <Pk key={i} sec="know" i={i}>{x}</Pk>)}<details className="rule" style={{ padding: '0 8px' }}><summary>Team facts</summary><ul className="ul">{e.S.facts.map((f: string) => <li key={f}>{f}</li>)}</ul></details></Sec>
      <Sec t="Changes" s={`${a.hist.length} changes, newest first. Today’s can be undone.`}>{a.hist.slice().reverse().map((x: any) => { const i = a.hist.indexOf(x); return <div className="hi" key={i}><time>{x.ts}</time><span className="x">{x.t}</span>{x.undo && <button className="lnk" onClick={() => e.revert(a, i)}>Go back</button>}</div> })}</Sec>
      {a.bmsgs.map((m: any, i: number) => (m.k === 'chg' ? <Chg key={i} a={a} m={m} i={i} /> : <Msg key={i} k={k} m={m} i={i} />))}
      <Typing k={k} />
    </>
  )
}
