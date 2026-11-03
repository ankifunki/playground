import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { money } from './data'
import { Icon } from './Icon'
import { Ag } from './Live'
import { RM, useW } from './store'

export type Deal = { name: string; amt: number; disc: number }
export const HELIOS: Deal = { name: 'Helios expansion', amt: 240000, disc: 28 }

type Approver = { label: string; who: string; at: string; say: string }
type Frame = { at: number; s: number; clk: string; t: string; d?: string; ag?: boolean }

/** The route a deal takes under the live config: who approves, how long, and why. */
export function route(deal: Deal, f: number) {
  const small = deal.amt <= 100000
  const kind = small ? 'none' : deal.disc > 35 ? 'cro' : deal.disc > f ? 'fin' : 'mgr'
  const approvers: Approver[] = kind === 'cro' ? [{ label: 'CRO', who: 'CRO · over 35%', at: '+6 h 05 m', say: 'The CRO approves' }]
    : kind === 'fin' ? [{ label: 'Sales manager', who: 'Priya Shah · Sales manager', at: '+1 h 10 m', say: 'The sales manager approves; Finance is next' }, { label: 'Finance', who: `Finance · over ${f}%`, at: '+3 h 40 m', say: 'Finance approves' }]
      : kind === 'mgr' ? [{ label: 'Sales manager', who: 'Priya Shah · Sales manager', at: '+1 h 10 m', say: 'The sales manager approves' }] : []
  const reason = small ? `${money(deal.amt)} is under $100,000: no approval needed`
    : kind === 'cro' ? `${deal.disc}% is over 35%: the CRO approves directly`
      : kind === 'fin' ? `${deal.disc}% is over ${f}%: the sales manager, then Finance`
        : `${deal.disc}% is ${f}% or less: the sales manager approves alone`
  const people = kind === 'cro' ? '6 h 05 m' : kind === 'fin' ? '3 h 40 m' : kind === 'mgr' ? '1 h 10 m' : ''
  const first = kind === 'cro' ? 'the CRO' : 'the sales manager'
  return { small, kind, approvers, reason, people, first }
}

/** The timeline for one deal: when each thing happens in the recording, and what the narration says. */
function timeline(deal: Deal, f: number) {
  const r = route(deal, f)
  const frames: Frame[] = [
    { at: 0, s: 0, clk: '0 s', t: `A rep moves ${deal.name} to Negotiation`, d: `${money(deal.amt)} at ${deal.disc}% off` },
    { at: 2400, s: 1, clk: '+1 s', t: 'Reads the policy and the live Salesforce config', ag: true },
    { at: 4200, s: 1, clk: '+2 s', t: r.reason, ag: true },
    { at: 7600, s: 1, clk: '+4 s', t: r.small ? 'Lets the deal move on; there is nothing to approve' : `Locks the record and routes it to ${r.first}`, ag: true },
  ]
  let at = 9800
  r.approvers.forEach((a) => { frames.push({ at, s: 2, clk: a.at, t: a.say }); at += 2200 })
  const end = r.small ? 9800 : at + 600
  frames.push({ at: end, s: 3, clk: r.small ? '+4 s' : r.approvers[r.approvers.length - 1].at, t: r.small ? 'The deal moves on' : 'Unlocks the record; the deal moves on', d: 'Receipt logged on this page', ag: true })
  return { r, frames, len: end + 2200, okAt: r.approvers.map((_, i) => 9800 + i * 2200 + 600) }
}
const fmt = (ms: number) => `0:${String(Math.floor(ms / 1000)).padStart(2, '0')}`

/**
 * How it works: one player. The agent working a real deal in Salesforce, re-enacted in the page so it follows the live
 * config, with the four steps as chapters above it (tap one to jump there), play / pause / scrub like a video, and one
 * narration line with the clock. Plays once when it first comes into view; reduced motion starts at the end.
 * Try it out can hand it the visitor's own deal ("Watch this deal"), and it replays that route instead of Helios.
 */
export function How({ deal = HELIOS, run = 0, onReset }: { deal?: Deal; run?: number; onReset?: () => void }) {
  const w = useW(), f = w.fin
  const { r, frames, len, okAt } = timeline(deal, f)
  const [t, setT] = useState(RM ? len - 1 : 0), [play, setPlay] = useState(false)
  const root = useRef<HTMLDivElement>(null), started = useRef(false)

  useEffect(() => {
    const el = root.current; if (!el || RM || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started.current) { started.current = true; setPlay(true) } }, { threshold: 0.4 })
    io.observe(el); return () => io.disconnect()
  }, [])
  // A new deal from Try it out restarts the recording.
  useEffect(() => { if (!run) return; started.current = true; setT(RM ? len - 1 : 0); setPlay(!RM) }, [run]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!play) return
    let raf = 0, prev = performance.now()
    // rAF's timestamp can be a little earlier than performance.now() above, so never step backwards.
    const step = (now: number) => { const dt = Math.max(0, now - prev); prev = now; setT((x) => { const n = x + dt; if (n >= len) { setPlay(false); return len - 1 } return n }); raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf)
  }, [play, len])

  const fr = [...frames].reverse().find((x) => t >= x.at) ?? frames[0]
  const end = frames[frames.length - 1].at
  const neg = t > 1800, locked = !r.small && t > 2400 && t < end, checking = t > 4200 && t < 7600, routed = !r.small && t > 7600
  const receipt = t > end + 400
  const toggle = () => { started.current = true; if (t >= len - 1) { setT(0); setPlay(true) } else setPlay(!play) }
  const jump = (s: number) => { started.current = true; setPlay(false); const x = frames.find((y) => y.s === s); if (x) setT(x.at + 1) }
  // Chapter track: how far along the four steps the recording is.
  const inStep = frames.filter((x) => x.s === fr.s), k = inStep.indexOf(fr)
  const p = Math.min(1, (fr.s + (fr.s < 3 ? (k + 1) / (inStep.length + 1) : 0)) / 3)
  const steps = [
    { t: 'Rep submits', s: r.small ? 'deal under $100k' : 'deal over $100k', ic: 'user' as const },
    { t: 'Agent routes', s: 'in 4 seconds', ic: 'stamp' as const },
    { t: 'People approve', s: r.small ? 'not needed' : r.people, ic: 'user' as const },
    { t: 'Record unlocks', s: 'the deal moves on', ic: 'lock-open' as const },
  ]
  const custom = deal !== HELIOS

  return (
    <div className="hwk" ref={root}>
      <dl className="hwk-stats">
        <div><dt className="tk">The agent’s part</dt><dd><b>4 s</b><span>to check and route a deal</span></dd></div>
        <div><dt className="tk">People approving</dt><dd><b>{r.small ? 'None' : r.people}</b><span>{r.small ? 'under $100,000, nothing to approve' : 'median wait for approvers'}</span></dd></div>
      </dl>
      <ol className="hwk-track" aria-label="How a discount approval works" style={{ '--p': p } as React.CSSProperties}>
        <span className="hwk-line" aria-hidden="true"><i /></span>
        {steps.map((st, n) => (
          <li key={st.t} className={'hwk-s' + (n < fr.s ? ' done' : n === fr.s ? ' now' : '') + (n === 1 ? ' agent' : '') + (n === 2 && r.small ? ' skip' : '')}>
            <button onClick={() => jump(n)} aria-current={n === fr.s ? 'step' : undefined}>
              <span className="hwk-n" aria-hidden="true"><Icon name={st.ic} size={16} /></span>
              <span className="hwk-t"><b>{st.t}</b><small>{st.s}</small></span>
            </button>
          </li>
        ))}
      </ol>
      <div className="rec" aria-hidden="true">
        <div className="rec-h">
          <div><span className="tk">Opportunity</span><b className="rec-name">{deal.name}</b></div>
          <span className={'rec-lock' + (locked ? ' on' : receipt ? ' done' : '')}>
            <Icon name={locked ? 'lock' : 'lock-open'} size={14} />
            {locked ? 'Locked for approval' : receipt ? (r.small ? 'Moved on · receipt logged' : 'Unlocked · receipt logged') : 'Open'}
          </span>
        </div>
        <ol className="rec-stage" style={{ '--p': ((neg ? 2 : 1) + 1) / 4 } as React.CSSProperties}>
          <span className="rec-fill" />
          {['Qualify', 'Proposal', 'Negotiation', 'Closed'].map((s, i) => <li key={s} className={i < (neg ? 2 : 1) ? 'done' : i === (neg ? 2 : 1) ? 'cur' : ''}>{s}</li>)}
        </ol>
        <dl className="rec-f"><div><dt className="tk">Amount</dt><dd>{money(deal.amt)}</dd></div><div><dt className="tk">Discount</dt><dd>{deal.disc}%</dd></div><div><dt className="tk">Owner</dt><dd>Sam Ortiz</dd></div></dl>
        <div className="rec-log">
          <span className="tk">Approval history</span>
          {t <= 4200 ? <p className="rec-empty">No approvals yet</p> : (
            <ul className="rec-ah">
              <li className="agent"><i className="rec-dot" /><span className="rec-what"><b>Approvals agent checked the rules</b><small>{r.reason}</small></span><em>+2 s</em></li>
              {t > 7600 && (r.small
                ? <li className="ok"><i className="rec-dot" /><span className="rec-what"><b>No approval needed</b><small>The deal moves on</small></span><em>+4 s</em></li>
                : <li><i className="rec-dot" /><span className="rec-what"><b>Submitted</b><small>To {r.first}</small></span><em>+4 s</em></li>)}
              {routed && r.approvers.map((a, i) => { const ok = t > okAt[i], wait = !ok && (i === 0 || t > okAt[i - 1]); return (
                <li key={a.label} className={ok ? 'ok' : wait ? 'wait' : ''}><i className="rec-dot" /><span className="rec-what"><b>{ok ? 'Approved' : wait ? 'Waiting' : 'Next'}</b><small>{a.who}</small></span>{ok && <em>{a.at}</em>}</li>
              ) })}
            </ul>
          )}
        </div>
      </div>
      <div className="wt-ctl">
        <button className="ib wt-play" onClick={toggle} aria-label={play ? 'Pause' : t >= len - 1 ? 'Replay' : 'Play'}><Icon name={play ? 'pause' : t >= len - 1 ? 'rotate-ccw' : 'play'} size={14} /></button>
        <input className="wt-scrub" type="range" min={0} max={len - 1} value={t} onChange={(e) => { started.current = true; setT(+e.target.value); setPlay(false) }} aria-label="Scrub the recording" style={{ ['--p' as string]: (t / len) * 100 + '%' }} />
        <span className="wt-time">{fmt(t)} / {fmt(len)}</span>
      </div>
      <div className="hwk-now">
        <div className="hwk-say" key={fr.at} aria-live="polite">
          {fr.ag ? <Ag id="approvals" /> : <span className="hwk-who" aria-hidden="true"><Icon name="user" size={12} /></span>}
          <span className="hwk-txt"><span>{fr.ag && <b className="agw">Approvals agent </b>}{fr.ag ? fr.t.charAt(0).toLowerCase() + fr.t.slice(1) : fr.t}</span>{fr.d && <small>{fr.d}</small>}</span>
        </div>
        <span className="hwk-clk tk">{fr.clk}</span>
      </div>
      {custom && onReset && <p className="hwk-deal"><span>Playing your deal</span><button className="wl" onClick={onReset}>Back to Helios expansion</button></p>}
    </div>
  )
}
