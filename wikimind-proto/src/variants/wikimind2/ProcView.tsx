import { claimsOf, dependents, dom, proc, type Proc } from './data'
import { ripple } from './logic'
import { ClaimRow, Drift, FindOut } from './parts'
import { useW } from './store'

/** "What breaks if it changes": the ripple of everything that depends on this process. */
function Ripple({ p }: { p: Proc }) {
  const { r1, r2, list } = ripple(p)
  if (!r1.length) return <div className="unk"><span className="x1">Nothing Asoka knows depends on this directly.<small>Changes here are low risk.</small></span></div>
  const cx = 210, cy = 110
  const ring = (arr: [string, number][], R: number, off: number) => arr.map(([name, warn], i) => {
    const an = off + (i * 2 * Math.PI) / arr.length, x = cx + R * Math.cos(an), y = cy + R * 0.82 * Math.sin(an), co = Math.cos(an)
    return (
      <g key={name}>
        <line x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="var(--line)" />
        <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={6} fill={warn ? 'var(--warn)' : 'var(--ink)'} />
        <text x={(x + (co > 0.2 ? 10 : co < -0.2 ? -10 : 0)).toFixed(1)} y={(y + (Math.abs(co) <= 0.2 ? (Math.sin(an) > 0 ? 18 : -10) : 4)).toFixed(1)} textAnchor={co > 0.2 ? 'start' : co < -0.2 ? 'end' : 'middle'} fontSize={12} fontWeight={500} fill="var(--ink)" paintOrder="stroke" stroke="var(--panel)" strokeWidth={4}>{name}</text>
      </g>
    )
  })
  return (
    <div className="blast">
      <svg viewBox="0 0 420 220" role="img" aria-label={'What depends on ' + p.n}>
        {[44, 88].map((r) => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeDasharray="3 4" />)}
        {ring(r1, 44, -Math.PI / 2)}{ring(r2, 88, -Math.PI / 2 + 0.5)}
        <rect x={cx - 46} y={cy - 14} width={92} height={28} rx={14} fill="var(--accent)" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--panel)">This process</text>
      </svg>
      <ul className="blist">{list.map(([n, d, warn]) => <li key={n} className={warn ? 'w' : ''}><span>{n}</span><span>{d}</span></li>)}</ul>
      {p.id === 'approvals' && <p className="shs" style={{ margin: '10px 4px 0' }}>Talk to Maria Okafor in RevOps before changing it. She owns the process.</p>}
    </div>
  )
}

export function ProcView() {
  const w = useW(), p = proc(w.pid)!
  const cs = claimsOf(p.id), flat = cs.filter((c) => !c.drift), dr = cs.filter((c) => c.drift), chg = cs.filter((c) => c.st === 'chg')
  const nDep = p.id === 'approvals' ? 7 : dependents(p.id).length
  const deps = p.deps.map(proc).filter(Boolean) as Proc[]
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
  return (
    <>
      <div className="ptitle">{p.n}</div>
      <p className="what">{p.w}</p>
      {p.own ? <div className="foryou"><b>For you:</b> one rule changed since your last visit. Discounts over 35% now go to the CRO.</div>
        : chg.length > 0 && <div className="foryou"><b>Recently changed:</b> {chg[0].t}</div>}
      {p.cov < 0.55 && <div className="foryou" style={{ background: 'var(--warnb)' }}><b style={{ color: 'var(--warn)' }}>Asoka knows little here.</b> Only {cs.length} {plural(cs.length, 'thing', 'things')} observed so far. Treat this page as a starting point.</div>}
      <div className="pacts">
        <button className={'pact press' + (w.blast ? ' on' : '')} onClick={w.toggleBlast}>What breaks if it changes</button>
        <button className="pact press" onClick={() => w.doWatch(p.id)}>{w.watch[p.id] ? 'Watching' : 'Watch for changes'}</button>
        <button className="pact press" onClick={w.mapHere}>Show on map</button>
      </div>
      <div className="sh2">What’s true</div>
      <p className="shs">{flat.length} {plural(flat.length, 'thing', 'things')}. Colored lines are worth a second look.</p>
      {flat.map((c) => <ClaimRow key={c.id} c={c} />)}
      {dr.length > 0 && <><div className="sh2">Policy vs. practice</div><p className="shs">Where what people do differs from what’s written down. Only visible because Asoka watches the work happen.</p>{dr.map((c) => <Drift key={c.id} c={c} asButton />)}</>}
      <div className="sh2" id="blastsec">What breaks if it changes</div>
      <p className="shs">{nDep ? `${nDep} ${plural(nDep, 'thing depends', 'things depend')} on this.` : 'Nothing Asoka knows depends on this.'}</p>
      {w.blast ? <Ripple p={p} /> : nDep > 0 && <button className="pact press" onClick={w.toggleBlast}>Show the ripple</button>}
      {deps.length > 0 && <><div className="sh2">Connected to</div><p className="shs">What this process relies on or works with.</p>
        <div className="chips2">{deps.map((q) => <button key={q.id} className="chip2 press" onClick={() => w.openProc(q.id)}>{q.n}{q.d !== p.d ? ' · ' + dom(q.d).n : ''}</button>)}</div></>}
      <div className="sh2">What Asoka doesn’t know yet</div>
      <p className="shs">Gaps are shown, not hidden.</p>
      {!p.unk.length && <p className="shs">No open questions right now.</p>}
      {p.unk.map((u, i) => <div key={i} className="unk"><span className="x1">{u[0]}<small>{u[1]}</small></span><FindOut k={p.id + '-' + i} asking={!!u[2]} /></div>)}
      <p className="gen">Generated by Asoka from {cs.length * 3 + 2} observations. Every line links to why it’s true.</p>
    </>
  )
}
