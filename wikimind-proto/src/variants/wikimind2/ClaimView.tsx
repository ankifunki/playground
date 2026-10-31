import { cl, proc } from './data'
import { Drift, FindOut } from './parts'
import { useW } from './store'

/** One claim, with why it's true, how it changed over time, and its sources. */
export function ClaimView() {
  const w = useW(), c = cl(w.cid)!, p = proc(c.p)!
  const last = c.hist.length - 1, i = w.tt[c.id] ?? last, v = c.hist[i], then = i < last
  const rel = c.rel.includes(p.n) ? c.rel : [p.n, ...c.rel]
  return (
    <>
      <div className={'cstate' + (c.st === 'chk' ? ' chk' : c.st === 'chg' ? ' chg' : '')}>{c.st === 'solid' ? '✓ Solid. Several sources agree.' : c.st === 'chg' ? c.reason + '. Solid.' : 'Check this: ' + c.reason.toLowerCase()}</div>
      <div className="ctext">{c.t}</div>
      {c.note && <p className="what" style={{ fontSize: 17 }}>{c.note}</p>}
      {c.drift && <><div className="sh2">Policy vs. practice</div><Drift c={c} /></>}
      <div className="sh2">Why it’s like this</div>
      {c.why.length ? <ol className="chain">{c.why.map((x, k) => <li key={k}><div className="cd">{x.d}</div><div className="ct">{x.t}</div><div className="cs">{x.s}</div></li>)}</ol>
        : <div className="unk"><span className="x1">Asoka doesn’t know why yet<small>{c.id === 'c7' ? 'It asked Maria Okafor, who owns the process.' : 'It will ask the owner of ' + p.n.toLowerCase() + '.'}</small></span><FindOut k={'why-' + c.id} asking={c.id === 'c7'} /></div>}
      <div className="sh2">How it changed</div>
      {c.hist.length > 1 ? (
        <div className="tt">
          <div className="tthead"><span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink2)' }}>{v.d}</span><span className={'ttbadge' + (then ? ' then' : '')}>{then ? 'What we believed then' : 'Now'}</span></div>
          <p className="ttv" key={i}>{v.t}</p>
          <p className="ttw">What changed it: {v.w}</p>
          <input type="range" min={0} max={last} step={1} value={i} onChange={(e) => w.setTT((t) => ({ ...t, [c.id]: +e.target.value }))} aria-label="Move through time" />
          <div className="ttl">{c.hist.map((x, k) => <span key={k}>{x.d}</span>)}</div>
        </div>
      ) : <p className="ttone">Unchanged since {c.hist[0].d}. {c.hist[0].w}</p>}
      <details className="ev"><summary>Based on {c.src.length} source{c.src.length === 1 ? '' : 's'} ›</summary><ul>{c.src.map((s) => <li key={s}>{s}</li>)}</ul></details>
      <div className="sh2" style={{ marginTop: 18 }}>Connected to</div>
      <div className="chips2">{rel.map((r) => <button key={r} className="chip2 press" onClick={() => w.setPeek(r)}>{r}</button>)}</div>
    </>
  )
}
