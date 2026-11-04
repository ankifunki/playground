import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { money } from './data'
import { Icon } from './Icon'
import { useW } from './store'

/**
 * Try it out (Wikimind 5): one outlined input panel (your deal: discount and size), and a read-only answer: who
 * approves and how long, the threshold strip with your deal marked, and the reason in one sentence. From the live config.
 */
export function Sim({ onWatch }: { onWatch?: (deal: { amt: number; disc: number }) => void }) {
  const w = useW(), [deal, setDeal] = useState({ amt: 240000, disc: 28 })
  const small = deal.amt <= 100000, f = w.fin
  const who = small ? 'No approval needed' : deal.disc > 35 ? 'CRO' : deal.disc > f ? 'Sales manager → Finance' : 'Sales manager'
  const time = small ? '' : deal.disc > 35 ? '6 h 05 m' : deal.disc > f ? '3 h 40 m' : '1 h 10 m'
  const why = small ? `${money(deal.amt)} is under $100,000.` : deal.disc > 35 ? `${deal.disc}% is over 35%.` : deal.disc > f ? `${deal.disc}% is over ${f}%, so Finance joins.` : `${deal.disc}% is ${f}% or less.`
  const set = (p: Partial<typeof deal>) => setDeal((d) => ({ ...d, ...p }))
  return (
    <div className="sim" id="sim" aria-label="Try a deal">
      <div className="sim-in" role="group" aria-label="Your deal">
        <span className="tk">Your deal</span>
        <label className="sim-r"><span>Discount</span><b>{deal.disc}%</b>
          <input type="range" min={0} max={50} step={1} value={deal.disc} onChange={(e) => set({ disc: +e.target.value })} aria-label="Discount" style={{ '--p': (deal.disc / 50) * 100 + '%' } as React.CSSProperties} /></label>
        <label className="sim-r"><span>Deal size</span><b>{money(deal.amt)}</b>
          <input type="range" min={50000} max={1000000} step={10000} value={deal.amt} onChange={(e) => set({ amt: +e.target.value })} aria-label="Deal size" style={{ '--p': ((deal.amt - 50000) / 950000) * 100 + '%' } as React.CSSProperties} /></label>
      </div>
      <div className="sim-out" aria-live="polite">
        <span className="tk">Who approves</span>
        <p className="sim-ans"><b>{who}</b>{time && <span>usually {time}</span>}</p>
        <Thresholds fin={f} mark={deal.disc} off={small} />
        <p className="sim-reason">{why}</p>
        {onWatch && <button className="wl sim-watch" onClick={() => onWatch(deal)}><Icon name="play" size={12} />Watch this deal in How it works</button>}
      </div>
    </div>
  )
}

/**
 * The approval thresholds as a strip: who approves at each discount. Shared by Home's lead story (with the old line
 * struck through) and Try a deal (with a marker at the visitor's deal; dimmed when the deal is too small to need approval).
 */
export function Thresholds({ fin, was, mark, off }: { fin: number; was?: { at: number; label: string }; mark?: number; off?: boolean }) {
  const pct = (n: number) => (Math.min(50, n) / 50) * 100 + '%'
  const on = mark === undefined || off ? null : mark > 35 ? 'c' : mark > fin ? 'f' : 'm'
  const cls = (k: string) => 'thr-s ' + k + (on === k ? ' on' : '')
  return (
    <div className={'thr' + (on ? ' pick' : '') + (off ? ' off' : '')} role="img" aria-label={`Sales manager up to ${fin}%, Finance added over ${fin}%, CRO over 35%.${was ? ` Previously ${was.label}.` : ''}${mark !== undefined ? ` This deal: ${mark}% off.` : ''}`}>
      <div className="thr-bar">
        <span className={cls('m')} style={{ left: 0, width: pct(fin) }}><b>Manager</b></span>
        <span className={cls('f')} style={{ left: pct(fin), width: pct(35 - fin) }}><b>+ Finance</b></span>
        <span className={cls('c')} style={{ left: pct(35), width: pct(15) }}><b>CRO</b></span>
        {was && <span className="thr-was" style={{ left: pct(was.at) }}><small>was {was.at}%</small></span>}
        {mark !== undefined && <span className="thr-mark" style={{ left: pct(mark) }}><small>{mark}%</small></span>}
      </div>
      <div className="thr-ax">{[0, 10, 20, 30, 40, 50].map((n) => <span key={n} style={{ left: pct(n) }}>{n}%</span>)}</div>
    </div>
  )
}

/**
 * Wikimind 9: Try it out folded into How it works. Pick a deal or set your own size and discount; the answer updates
 * at once and the player above replays that deal's route (slider moves settle for 300ms first, so dragging doesn't
 * restart it on every step).
 */
const PRESETS = [
  { name: 'Helios expansion', amt: 240000, disc: 28 },
  { name: 'Atlas renewal', amt: 180000, disc: 12 },
  { name: 'Orion platform', amt: 620000, disc: 38 },
  { name: 'Kestrel new logo', amt: 64000, disc: 18 },
]
export function DealControls({ deal, onChange }: { deal: { name: string; amt: number; disc: number }; onChange: (d: { name: string; amt: number; disc: number }) => void }) {
  const w = useW(), [d, setD] = useState(deal), f = w.fin
  const timer = useRef(0)
  useEffect(() => { setD(deal) }, [deal.name, deal.amt, deal.disc]) // eslint-disable-line react-hooks/exhaustive-deps
  const push = (x: typeof d, now = false) => { setD(x); window.clearTimeout(timer.current); if (now) onChange(x); else timer.current = window.setTimeout(() => onChange(x), 300) }
  const set = (p: Partial<typeof d>) => push({ ...d, ...p, name: 'Your deal' })
  const small = d.amt <= 100000
  const who = small ? 'No approval needed' : d.disc > 35 ? 'The CRO' : d.disc > f ? 'Sales manager, then Finance' : 'Sales manager'
  const time = small ? '' : d.disc > 35 ? 'about 6 h' : d.disc > f ? 'about 3 h 40 m' : 'about 1 h'
  const why = small ? `${money(d.amt)} is under $100,000.` : d.disc > 35 ? `${d.disc}% is over 35%.` : d.disc > f ? `${d.disc}% is over ${f}%, so Finance joins.` : `${d.disc}% is ${f}% or less.`
  return (
    <div className="dc" role="group" aria-label="Play a deal">
      <div className="dc-top">
        <span className="tk">Play a deal</span>
        <div className="dc-pre">{PRESETS.map((p) => <button key={p.name} className={d.name === p.name ? 'on' : ''} aria-pressed={d.name === p.name} onClick={() => push(p, true)}>{p.name.split(' ')[0]}<small>{money(p.amt)} · {p.disc}%</small></button>)}</div>
      </div>
      <div className="dc-in">
        <label className="sim-r"><span>Discount</span><b>{d.disc}%</b>
          <input type="range" min={0} max={50} step={1} value={d.disc} onChange={(e) => set({ disc: +e.target.value })} aria-label="Discount" style={{ '--p': (d.disc / 50) * 100 + '%' } as React.CSSProperties} /></label>
        <label className="sim-r"><span>Deal size</span><b>{money(d.amt)}</b>
          <input type="range" min={50000} max={1000000} step={10000} value={d.amt} onChange={(e) => set({ amt: +e.target.value })} aria-label="Deal size" style={{ '--p': ((d.amt - 50000) / 950000) * 100 + '%' } as React.CSSProperties} /></label>
      </div>
      <p className="dc-ans" aria-live="polite"><b>{who}</b>{time && <span> · usually {time}</span>}<span className="dc-why">{why}</span></p>
    </div>
  )
}
