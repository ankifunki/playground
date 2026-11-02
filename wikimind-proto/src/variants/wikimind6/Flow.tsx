import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Ag } from './agents'
import { Icon } from './Icon'
import { RM } from './logic'
import { useW } from './store'

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
