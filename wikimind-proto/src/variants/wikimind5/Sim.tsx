import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pile } from './Claim'
import { sentenceFor, tierOf, TIER_LABEL } from './data'
import { Icon, type IconName } from './Icon'
import { RM } from './logic'
import { buildRoute, money, type Deal, type NodeK } from './route'
import { useW } from './store'

const STAGES = ['Qualify', 'Proposal', 'Approval', 'Negotiation']
const NICON: Record<NodeK, IconName> = { rep: 'user', sf: 'cloud', person: 'user', slack: 'hash', done: 'arrow-right' }
const KINDS: [Deal['kind'], string][] = [['new', 'New business'], ['renew', 'Renewal, new price'], ['flat', 'Renewal, same price']]

/**
 * Try a deal: an interactive demo generated from the page's own rules (and the live Salesforce config).
 * Pick a deal and the route, the record and the captions play out step by step, each step citing its rule.
 */
export function Sim() {
  const w = useW()
  const [deal, setDeal] = useState<Deal>({ amt: 240000, disc: 28, emea: false, kind: 'new', qend: false })
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [rule, setRule] = useState(false)
  const route = useMemo(() => buildRoute(deal, w.fin, w.learned), [deal, w.fin, w.learned])
  const N = route.steps.length, at = Math.min(step, N - 1), st = route.steps[at], end = at === N - 1
  // The rule behind the current step, shown in place so the demo keeps its place.
  useEffect(() => setRule(false), [at, route])
  const sents = st.rule ? [st.rule] : [...new Set(st.ns.map((n) => sentenceFor(n, w.fin, w.learned)))], tier = tierOf(st.ns, w.cfg === 'changed')
  const root = useRef<HTMLDivElement>(null), seen = useRef(false)

  // A deal handed over from the arrival card or the tour.
  useEffect(() => {
    if (!w.simReq) return
    setDeal((d) => ({ ...d, amt: w.simReq!.amt, disc: w.simReq!.disc, kind: 'new', emea: false, qend: false }))
    setStep(0); setPlaying(!RM)
  }, [w.simReq?.n])
  // Plays once by itself the first time it scrolls into view.
  useEffect(() => {
    const el = root.current; if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !seen.current) { seen.current = true; if (!RM) setPlaying(true) } }, { threshold: 0.45 })
    io.observe(el); return () => io.disconnect()
  }, [])
  // Playback.
  useEffect(() => {
    if (!playing) return
    if (at >= N - 1) { setPlaying(false); return }
    const t = window.setTimeout(() => setStep((s) => s + 1), (RM ? 2800 : 2300) / speed)
    return () => window.clearTimeout(t)
  }, [playing, at, N, speed])

  /** Sliders reset quietly; choices restart the walkthrough. */
  const slide = (p: Partial<Deal>) => { setDeal((d) => ({ ...d, ...p })); setStep(0); setPlaying(false) }
  const pick = (p: Partial<Deal>) => { setDeal((d) => ({ ...d, ...p })); setStep(0); setPlaying(!RM) }
  const go = (i: number) => { setStep(Math.max(0, Math.min(N - 1, i))); setPlaying(false) }
  const toggle = () => { if (end) { setStep(0); setPlaying(true) } else setPlaying((p) => !p) }
  const onKey = (e: React.KeyboardEvent) => {
    const tg = e.target as HTMLElement
    if (tg.tagName === 'INPUT') return
    if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1) }
    else if (e.key === ' ' && tg === root.current) { e.preventDefault(); toggle() }
  }
  const stateOf = (id: string) => (st.done.includes(id) ? 'done' : st.node === id ? 'cur' : 'todo')

  return (
    <div className="sim" id="sim" ref={root} tabIndex={-1} onKeyDown={onKey} aria-label="Try a deal">
      <div className="sim-in">
        <label className="sim-r"><span className="tk">Deal size</span><b>{money(deal.amt)}</b>
          <input type="range" min={50000} max={1000000} step={10000} value={deal.amt} onChange={(e) => slide({ amt: +e.target.value })} aria-label="Deal size" style={{ '--p': ((deal.amt - 50000) / 950000) * 100 + '%' } as React.CSSProperties} /></label>
        <label className="sim-r"><span className="tk">Discount</span><b>{deal.disc}%</b>
          <input type="range" min={0} max={50} step={1} value={deal.disc} onChange={(e) => slide({ disc: +e.target.value })} aria-label="Discount" style={{ '--p': (deal.disc / 50) * 100 + '%' } as React.CSSProperties} /></label>
        <div className="sim-seg" role="radiogroup" aria-label="Deal type">
          {KINDS.map(([k, l]) => <button key={k} role="radio" aria-checked={deal.kind === k} className={deal.kind === k ? 'on' : ''} onClick={() => pick({ kind: k })}>{l}</button>)}
        </div>
        <div className="sim-tgs">
          <button className={'sim-tg' + (deal.emea ? ' on' : '')} aria-pressed={deal.emea} onClick={() => pick({ emea: !deal.emea })}><i />EMEA</button>
          <button className={'sim-tg' + (deal.qend ? ' on' : '')} aria-pressed={deal.qend} onClick={() => pick({ qend: !deal.qend })}><i />Last 3 days of the quarter</button>
        </div>
      </div>

      <div className="sim-ans" aria-live="polite">
        <div><span className="tk">Who approves</span><b>{route.who}</b></div>
        <div><span className="tk">Usually takes</span><b>{route.time}</b></div>
      </div>

      <div className="sim-stage">
        <ol className="sim-route" aria-label="The route">
          {route.nodes.map((n) => (
            <li key={n.id} className={'sim-n ' + stateOf(n.id) + (n.tone ? ' ' + n.tone : '')}>
              <button onClick={() => go(route.steps.findIndex((s) => s.node === n.id))} aria-label={`${n.label}, ${n.sub}`}>
                <span className="sim-ic"><Icon name={stateOf(n.id) === 'done' && n.k !== 'done' ? 'circle-check' : NICON[n.k]} size={16} /></span>
                <span className="sim-nl"><b>{n.label}</b><small>{n.sub}</small></span>
              </button>
            </li>
          ))}
        </ol>
        <div className="sim-rec" aria-label="The Salesforce record">
          <div className="rec-h"><span className="tk">Opportunity</span><b>Helios expansion</b><span className="rec-amt">{money(deal.amt)} · {deal.disc}% off</span></div>
          <div className="rec-path">{STAGES.map((s, i) => <span key={s} className={i < st.stage ? 'done' : i === st.stage ? 'cur' : ''}>{s}</span>)}</div>
          <div className={'rec-lock' + (st.lock ? ' on' : '')}><Icon name={st.lock ? 'lock' : 'lock-open'} size={14} />{st.banner || (st.lock ? 'Locked for approval' : 'Editable')}</div>
        </div>
      </div>

      <div className="sim-cap" aria-live="polite" key={at + route.who}>
        <div className="sim-ch"><span className="tk">Step {at + 1} of {N}</span>{st.dur && <span className="tk sim-dur">{st.dur}</span>}</div>
        <p className="sim-t">{st.title}</p>
        <p className="sim-b">{st.body}</p>
        <button className="sim-why" onClick={() => { setRule((v) => !v); setPlaying(false) }} aria-expanded={rule}><Pile ns={st.ns} max={3} /><span>{rule ? 'Hide the rule' : 'See the rule'}</span></button>
        {rule && (
          <div className="sim-rule">
            {sents.map((t) => <p key={t}>{t}</p>)}
            <div className="sim-rf"><span className={'tdone cp-t-' + (tier === 'pend' ? 'warn' : tier)}>{TIER_LABEL[tier]}</span><button className="wl" onClick={() => w.showClaims(st.ns)}>Show on page</button></div>
          </div>
        )}
      </div>

      <div className="sim-ctl" role="group" aria-label="Playback">
        <button className="ibtn" onClick={() => { setStep(0); setPlaying(false) }} aria-label="Restart" title="Restart"><Icon name="rotate-ccw" size={16} /></button>
        <button className="ibtn" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Previous step" title="Previous step"><Icon name="skip-back" size={16} /></button>
        <button className="sim-play" onClick={toggle} aria-label={playing ? 'Pause' : end ? 'Play again' : 'Play'}><Icon name={playing ? 'pause' : end ? 'rotate-ccw' : 'play'} size={16} /></button>
        <button className="ibtn" onClick={() => go(at + 1)} disabled={end} aria-label="Next step" title="Next step"><Icon name="skip-forward" size={16} /></button>
        <div className="sim-dots">{route.steps.map((_, i) => <button key={i} className={i === at ? 'cur' : i < at ? 'done' : ''} onClick={() => go(i)} aria-label={`Step ${i + 1}`} aria-current={i === at ? 'step' : undefined}><i /></button>)}</div>
        <button className="sim-spd" onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))} aria-pressed={speed === 2} aria-label="Playback speed">{speed}×</button>
      </div>
      {route.note && <button className="sim-note" onClick={() => w.showClaims(route.note![1])}>{route.note[0]}</button>}
    </div>
  )
}
