import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Ag } from './Live'
import { RM, useW } from './store'

const LEN = 15000
const CAPS: [number, string][] = [
  [0, 'A rep moves Helios expansion to Negotiation'],
  [2400, 'Salesforce locks the record for approval'],
  [4200, 'The Approvals agent checks it against the rules'],
  [7600, 'It submits the request to the right people'],
  [9800, 'People approve, in order (sped up)'],
  [12800, 'The record unlocks; a receipt is logged'],
]
const fmt = (ms: number) => `0:${String(Math.floor(ms / 1000)).padStart(2, '0')}`

/**
 * Watch it: a screen recording of the agent working a real deal in Salesforce, re-enacted in the page so it stays
 * live (the thresholds come from the current config). A rep moves the deal, the record locks, the agent checks it and
 * routes it, people approve, the record unlocks. Captions say what is happening; play, pause and scrub like a video.
 */
export function Watch() {
  const w = useW(), f = w.fin, [t, setT] = useState(RM ? LEN - 1 : 0), [play, setPlay] = useState(false)
  const root = useRef<HTMLDivElement>(null), started = useRef(false)
  useEffect(() => {
    const el = root.current; if (!el || RM || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started.current) { started.current = true; setPlay(true) } }, { threshold: 0.5 })
    io.observe(el); return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!play) return
    let raf = 0, prev = performance.now()
    const step = (now: number) => { const dt = now - prev; prev = now; setT((x) => { const n = x + dt; if (n >= LEN) { setPlay(false); return LEN - 1 } return n }); raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf)
  }, [play])

  const neg = t > 1800, locked = t > 2400 && t < 12800, checking = t > 4200 && t < 7600, routed = t > 7600
  const ok1 = t > 10400, ok2 = t > 12000, receipt = t > 13200
  const cap = [...CAPS].reverse().find(([at]) => t >= at)![1]
  const cur = t < 900 ? { x: 20, y: 70 } : t < 7600 ? { x: 37, y: 30 } : { x: 76, y: 34 }
  const pct = (t / LEN) * 100
  const toggle = () => { if (t >= LEN - 1) { setT(0); setPlay(true) } else setPlay(!play) }

  return (
    <div className="wt" ref={root}>
      <div className="wt-win" aria-hidden="true">
        <div className="wt-bar"><i /><i /><i /><span>northwind.lightning.force.com / Opportunity / Helios expansion</span></div>
        <div className="wt-body">
          <div className="wt-rec">
            <div className="wt-h"><span className="wt-obj">Opportunity</span><b>Helios expansion</b>{locked && <span className="wt-lock"><Icon name="lock" size={12} />Locked for approval</span>}</div>
            <ol className="wt-path">{['Qualify', 'Proposal', 'Negotiation', 'Closed'].map((s, i) => <li key={s} className={(i < (neg ? 2 : 1) ? 'done' : '') + (i === (neg ? 2 : 1) ? ' cur' : '')}>{s}</li>)}</ol>
            <dl className="wt-f"><div><dt>Amount</dt><dd>$240,000</dd></div><div><dt>Discount</dt><dd>28%</dd></div><div><dt>Owner</dt><dd>Sam Ortiz</dd></div></dl>
          </div>
          <div className="wt-side">
            <span className="wt-st">Approval history</span>
            {!routed ? <p className="wt-empty">No approvals yet</p> : (
              <ul className="wt-ah">
                <li className="in"><span>Submitted</span><small>Approvals agent</small></li>
                <li className={'in' + (ok1 ? ' ok' : '')}><span>{ok1 ? 'Approved' : 'Pending'}</span><small>Priya Shah · Sales manager</small>{ok1 && <em>+1 h 10 m</em>}</li>
                <li className={'in' + (ok2 ? ' ok' : '')}><span>{ok2 ? 'Approved' : 'Pending'}</span><small>Finance · over {f}%</small>{ok2 && <em>+3 h 40 m</em>}</li>
              </ul>
            )}
          </div>
          {checking && <div className="wt-agent"><Ag id="approvals" size={18} /><span><b>Approvals agent</b> $240,000 is over $100,000 · 28% is over {f}% → Manager, then Finance</span></div>}
          {receipt && <div className="wt-agent ok"><Icon name="lock-open" size={14} /><span>Unlocked · receipt logged on Discount approvals</span></div>}
          <span className={'wt-cur' + (t > 1500 && t < 1900 ? ' click' : '')} style={{ left: cur.x + '%', top: cur.y + '%' }} />
        </div>
      </div>
      <div className="wt-ctl">
        <button className="ib wt-play" onClick={toggle} aria-label={play ? 'Pause' : t >= LEN - 1 ? 'Replay' : 'Play'}><Icon name={play ? 'pause' : t >= LEN - 1 ? 'rotate-ccw' : 'play'} size={14} /></button>
        <input className="wt-scrub" type="range" min={0} max={LEN - 1} value={t} onChange={(e) => { setT(+e.target.value); setPlay(false) }} aria-label="Scrub the recording" style={{ ['--p' as string]: pct + '%' }} />
        <span className="wt-time">{fmt(t)} / {fmt(LEN)}</span>
      </div>
      <p className="wt-cap" key={cap} aria-live="polite">{cap}</p>
    </div>
  )
}
