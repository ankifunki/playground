import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { money } from './data'
import { Ag } from './Live'
import { Icon } from './Icon'
import { RM, useW } from './store'

type Frame = { s: number; clk: string; t: string; d?: string; ag?: boolean }

/**
 * How it works, played the way the Approvals agent works a real deal. Four steps on one track; a narration line says
 * what is happening at each moment, with the clock beside it, so the 4 seconds of agent work and the 3 h 40 m of people
 * approving read as what they are. Play / pause / replay; tap a step to jump there. Plays once when it first comes into
 * view; reduced motion starts paused at the end. Thresholds come from the live Salesforce config.
 */
export function HowFlow() {
  const w = useW(), f = w.fin, root = useRef<HTMLDivElement>(null)
  const frames: Frame[] = [
    { s: 0, clk: '0 s', t: 'A rep moves Helios expansion to Negotiation', d: '$240,000 at 28% off' },
    { s: 1, clk: '+1 s', t: 'Reads the Discount policy and the live Salesforce config', ag: true },
    { s: 1, clk: '+2 s', t: `28% is over ${f}%, so Finance approves after the sales manager`, ag: true },
    { s: 1, clk: '+4 s', t: 'Locks the record and routes it to the sales manager', ag: true },
    { s: 2, clk: '+1 h 10 m', t: 'The sales manager approves; Finance is next' },
    { s: 2, clk: '+3 h 40 m', t: 'Finance approves' },
    { s: 3, clk: '+3 h 40 m', t: 'Unlocks the record, and the deal moves on', d: 'Logged as a receipt on this page', ag: true },
  ]
  const steps = [
    { t: 'Rep submits', s: 'deal over $100k', ic: 'user' },
    { t: 'Agent routes', s: 'in about 4 seconds', ic: 'stamp' },
    { t: 'People approve', s: 'about 3 h 40 m', ic: 'user' },
    { t: 'Record unlocks', s: 'the deal moves on', ic: 'lock-open' },
  ]
  const last = frames.length - 1
  const [i, setI] = useState(RM ? last : 0), [play, setPlay] = useState(false), started = useRef(false)

  // Start once, the first time the diagram is mostly on screen.
  useEffect(() => {
    const el = root.current; if (!el || RM || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started.current) { started.current = true; setPlay(true) } }, { threshold: 0.6 })
    io.observe(el); return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!play) return
    if (i >= last) { setPlay(false); return }
    const t = window.setTimeout(() => setI((x) => x + 1), i === 0 ? 1600 : 1900)
    return () => window.clearTimeout(t)
  }, [play, i, last])

  const fr = frames[i]
  const inStep = frames.filter((x) => x.s === fr.s), k = inStep.indexOf(fr)
  const p = Math.min(1, (fr.s + (fr.s < 3 ? (k + 1) / (inStep.length + 1) : 0)) / 3)
  const toggle = () => { started.current = true; if (i >= last) { setI(0); setPlay(true) } else setPlay(!play) }
  const jump = (s: number) => { started.current = true; setPlay(false); setI(frames.findIndex((x) => x.s === s)) }

  return (
    <div className="hwk" ref={root}>
      <dl className="hwk-stats">
        <div><dt className="tk">The agent’s part</dt><dd><b>4 s</b><span>to check and route a deal</span></dd></div>
        <div><dt className="tk">People approving</dt><dd><b>3 h 40 m</b><span>median wait for approvers</span></dd></div>
      </dl>
      <ol className="hwk-track" aria-label="How a discount approval works" style={{ '--p': p } as React.CSSProperties}>
        <span className="hwk-line" aria-hidden="true"><i /></span>
        {steps.map((st, n) => (
          <li key={st.t} className={'hwk-s' + (n < fr.s ? ' done' : n === fr.s ? ' now' : '') + (n === 1 ? ' agent' : '')}>
            <button onClick={() => jump(n)} aria-current={n === fr.s ? 'step' : undefined}>
              <span className="hwk-n" aria-hidden="true"><Icon name={st.ic} size={16} /></span>
              <span className="hwk-t"><b>{st.t}</b><small>{st.s}</small></span>
            </button>
          </li>
        ))}
      </ol>
      <div className="hwk-now">
        <button className="hwk-play" onClick={toggle} aria-label={play ? 'Pause' : i >= last ? 'Replay' : 'Play'}>
          <Icon name={play ? 'pause' : i >= last ? 'rotate-ccw' : 'play'} size={14} />
        </button>
        <div className="hwk-say" key={i} aria-live="polite">
          {fr.ag ? <Ag id="approvals" /> : <span className="hwk-who" aria-hidden="true"><Icon name="user" size={13} /></span>}
          <span className="hwk-txt"><span>{fr.ag && <b className="agw">Approvals agent </b>}{fr.ag ? fr.t.charAt(0).toLowerCase() + fr.t.slice(1) : fr.t}</span>{fr.d && <small>{fr.d}</small>}</span>
        </div>
        <span className="hwk-clk tk">{fr.clk}</span>
      </div>
    </div>
  )
}

/**
 * Try it out (Wikimind 5): one outlined input panel (your deal: discount and size), and a read-only answer: who
 * approves and how long, the threshold strip with your deal marked, and the reason in one sentence. From the live config.
 */
export function Sim() {
  const w = useW(), [deal, setDeal] = useState({ amt: 240000, disc: 28 })
  const small = deal.amt <= 100000, f = w.fin
  const who = small ? 'No approval needed' : deal.disc > 35 ? 'CRO' : deal.disc > f ? 'Sales manager → Finance' : 'Sales manager'
  const time = small ? '' : deal.disc > 35 ? '6 h 05 m' : deal.disc > f ? '3 h 40 m' : '1 h 10 m'
  const why = small ? `${money(deal.amt)} is under $100,000, so no approval is needed.` : deal.disc > 35 ? `${deal.disc}% is over 35%, so the CRO approves directly.` : deal.disc > f ? `${deal.disc}% is over ${f}%, so Finance approves after the sales manager.` : `Up to ${f}% off, the sales manager approves on their own.`
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
