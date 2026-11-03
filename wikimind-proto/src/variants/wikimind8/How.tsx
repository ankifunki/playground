import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { money } from './data'
import { Icon } from './Icon'
import { RM, useW } from './store'

export type Deal = { name: string; amt: number; disc: number }
export const HELIOS: Deal = { name: 'Helios expansion', amt: 240000, disc: 28 }

type Approver = { label: string; who: string; at: string; say: string }

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

/** When things happen in the recording (ms): approvals land 2.2 s apart, the record unlocks just after the last one. */
function timeline(deal: Deal, f: number) {
  const r = route(deal, f)
  const okAt = r.approvers.map((_, i) => 9800 + i * 2200 + 600)
  const end = r.small ? 9800 : 9800 + r.approvers.length * 2200 + 600
  return { r, len: end + 2200, okAt, end }
}
const fmt = (ms: number) => `0:${String(Math.floor(ms / 1000)).padStart(2, '0')}`

/**
 * How it works: one player. The agent working a real deal in Salesforce, re-enacted in the page so it follows the live
 * config. One timeline only: the record's activity, top to bottom, filling in as things happen (tap an item to jump
 * back to it), with play / pause / scrub like a video. Plays once when it first comes into view; reduced motion starts
 * at the end. Try it out can hand it the visitor's own deal ("Watch this deal"), and it replays that route instead.
 */
export function How({ deal = HELIOS, run = 0, onReset }: { deal?: Deal; run?: number; onReset?: () => void }) {
  const w = useW(), f = w.fin
  const { r, len, okAt, end } = timeline(deal, f)
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

  const neg = t > 1800, locked = !r.small && t > 2400 && t < end, receipt = t > end + 400
  const toggle = () => { started.current = true; if (t >= len - 1) { setT(0); setPlay(true) } else setPlay(!play) }
  const jump = (at: number) => { started.current = true; setPlay(false); setT(at + 1) }
  const custom = deal !== HELIOS
  // The record's activity, oldest first; each item shows once the recording reaches it.
  type Ev = { at: number; cls: string; b: string; small: string; em?: string }
  const evs: Ev[] = [
    { at: 1800, cls: '', b: 'Moved to Negotiation', small: `Sam Ortiz · ${money(deal.amt)} at ${deal.disc}% off`, em: '0 s' },
    { at: 4200, cls: 'agent', b: 'Approvals agent checked the rules', small: r.reason, em: '+2 s' },
    r.small ? { at: 7600, cls: 'ok', b: 'No approval needed', small: 'Receipt logged on this page', em: '+4 s' }
      : { at: 7600, cls: '', b: 'Locked and submitted', small: `To ${r.first}`, em: '+4 s' },
    ...r.approvers.map((a, i) => { const ok = t > okAt[i]; return { at: i === 0 ? 7600 : okAt[i - 1], cls: ok ? 'ok' : 'wait', b: ok ? `${a.label} approved` : `Waiting for ${a.label.toLowerCase() === 'cro' ? 'the CRO' : a.label === 'Finance' ? 'Finance' : 'the sales manager'}`, small: a.who, em: ok ? a.at : undefined } }),
    ...(r.small ? [] : [{ at: end + 400, cls: 'ok', b: 'Unlocked', small: 'The deal moves on · receipt logged on this page', em: r.approvers[r.approvers.length - 1].at }]),
  ]
  const shown = evs.filter((e) => t > e.at)

  return (
    <div className="hwk" ref={root}>
      <dl className="hwk-stats">
        <div><dt className="tk">The agent’s part</dt><dd><b>4 s</b><span>to check and route a deal</span></dd></div>
        <div><dt className="tk">People approving</dt><dd><b>{r.small ? 'None' : r.people}</b><span>{r.small ? 'under $100,000, nothing to approve' : 'median wait for approvers'}</span></dd></div>
      </dl>
      <div className="rec">
        <div className="rec-h">
          <div><span className="tk">Opportunity</span><b className="rec-name">{deal.name}</b></div>
          <span className={'rec-lock' + (locked ? ' on' : receipt ? ' done' : '')}>
            <Icon name={locked ? 'lock' : 'lock-open'} size={14} />
            {locked ? 'Locked for approval' : receipt ? (r.small ? 'Moved on' : 'Unlocked') : 'Open'}
          </span>
        </div>
        <dl className="rec-f">
          <div><dt className="tk">Stage</dt><dd key={neg ? 'n' : 'p'} className={neg ? 'rec-new' : ''}>{neg ? 'Negotiation' : 'Proposal'}</dd></div>
          <div><dt className="tk">Amount</dt><dd>{money(deal.amt)}</dd></div>
          <div><dt className="tk">Discount</dt><dd>{deal.disc}%</dd></div>
          <div><dt className="tk">Owner</dt><dd>Sam Ortiz</dd></div>
        </dl>
        <div className="rec-log">
          <span className="tk">Activity</span>
          {!shown.length ? <p className="rec-empty">Nothing yet</p> : (
            <ol className="rec-ah" aria-live="polite">
              {shown.map((e) => (
                <li key={e.at + e.b} className={e.cls}>
                  <button onClick={() => jump(e.at)}><i className="rec-dot" aria-hidden="true" /><span className="rec-what"><b>{e.b}</b><small>{e.small}</small></span>{e.em && <em>{e.em}</em>}</button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      <div className="wt-ctl">
        <button className="ib wt-play" onClick={toggle} aria-label={play ? 'Pause' : t >= len - 1 ? 'Replay' : 'Play'}><Icon name={play ? 'pause' : t >= len - 1 ? 'rotate-ccw' : 'play'} size={14} /></button>
        <input className="wt-scrub" type="range" min={0} max={len - 1} value={t} onChange={(e) => { started.current = true; setT(+e.target.value); setPlay(false) }} aria-label="Scrub the recording" style={{ ['--p' as string]: (t / len) * 100 + '%' }} />
        <span className="wt-time">{fmt(t)} / {fmt(len)}</span>
      </div>
      {custom && onReset && <p className="hwk-deal"><span>Playing your deal</span><button className="wl" onClick={onReset}>Back to Helios expansion</button></p>}
    </div>
  )
}
