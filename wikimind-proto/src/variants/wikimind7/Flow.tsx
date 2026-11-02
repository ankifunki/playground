import { useEffect, useState, type ReactNode } from 'react'
import { DEALS, money } from './data'
import { Icon, type IconName } from './Icon'
import { Ag, Chip } from './Live'
import { RM, useW } from './store'

type Deal = (typeof DEALS)[number]
type Route = 'none' | 'mgr' | 'fin' | 'cro'
const routeOf = (d: Deal, fin: number): Route => (d.amt <= 100000 ? 'none' : d.disc <= fin ? 'mgr' : d.disc <= 35 ? 'fin' : 'cro')
const STOPS: { k: string; t: string; ic: IconName }[] = [
  { k: 'in', t: 'Negotiation', ic: 'cloud' },
  { k: 'agent', t: 'Agent checks', ic: 'stamp' },
  { k: 'amt', t: 'Over $100k?', ic: 'git-branch' },
  { k: 'disc', t: 'Discount', ic: 'git-branch' },
  { k: 'who', t: 'Approval', ic: 'user' },
  { k: 'end', t: 'Unlocked', ic: 'lock-open' },
]
const HOLD = [2200, 2800, 2800, 3000, 3000, 2400]

/** Animate a value from 0 to `to` after mount (a marker sliding into place). */
function useArrive(to: number, delay = 250) {
  const [v, setV] = useState(RM ? to : 0)
  useEffect(() => { if (RM) return; const t = window.setTimeout(() => setV(to), delay); return () => window.clearTimeout(t) }, [to, delay])
  return v
}
function Reveal({ at, children }: { at: number; children: ReactNode }) {
  const [on, setOn] = useState(RM)
  useEffect(() => { if (RM) return; const t = window.setTimeout(() => setOn(true), at); return () => window.clearTimeout(t) }, [at])
  return <span className={'fo-rv' + (on ? ' on' : '')}>{children}</span>
}

/* ---------- The six scenes. Each says one thing, with one visual that animates its answer. ---------- */
function SceneIn({ d }: { d: Deal }) {
  return (
    <div className="fo-sc">
      <p className="fo-k">A deal reaches Negotiation</p>
      <div className="fo-deal"><b>{d.name}</b><span>{money(d.amt)}</span><span>{d.disc}% off</span></div>
      <p className="fo-note">Salesforce locks the record until it is approved.</p>
    </div>
  )
}
function SceneAgent() {
  return (
    <div className="fo-sc">
      <p className="fo-k">The Approvals agent checks it</p>
      <div className="fo-agent"><Ag id="approvals" size={44} />
        <span className="fo-reads">
          <Reveal at={300}><Icon name="file-text" size={14} />Discount policy</Reveal>
          <Reveal at={800}><Icon name="workflow" size={14} />Large Deal Approval</Reveal>
          <Reveal at={1300}><Icon name="layers" size={14} />Deal history</Reveal>
        </span>
      </div>
      <p className="fo-note">Reads the rules and the live config. About 4 seconds.</p>
    </div>
  )
}
function SceneAmount({ d }: { d: Deal }) {
  const max = 1000000, x = useArrive(Math.min(1, d.amt / max)), yes = d.amt > 100000
  return (
    <div className="fo-sc">
      <p className="fo-k">Is it over $100,000?</p>
      <div className="fo-line">
        <span className="fo-track" />
        <span className="fo-th" style={{ left: '10%' }}><i /><em>$100k</em></span>
        <span className="fo-mk" style={{ left: `${x * 100}%` }}><b>{money(d.amt)}</b></span>
        <span className="fo-ax"><em>$0</em><em>$1m</em></span>
      </div>
      <Reveal at={1300}><span className={'fo-ans' + (yes ? '' : ' no')}>{yes ? 'Yes, so the discount decides who approves' : 'No, so no approval is needed'}</span></Reveal>
    </div>
  )
}
function SceneDiscount({ d, fin, r }: { d: Deal; fin: number; r: Route }) {
  const x = useArrive(Math.min(1, d.disc / 50)), [lit, setLit] = useState(RM)
  useEffect(() => { if (RM) return; const t = window.setTimeout(() => setLit(true), 1250); return () => window.clearTimeout(t) }, [])
  const bands: { r: Route; from: number; to: number; t: string }[] = [
    { r: 'mgr', from: 0, to: fin, t: 'Sales manager' }, { r: 'fin', from: fin, to: 35, t: 'Manager, then Finance' }, { r: 'cro', from: 35, to: 50, t: 'CRO' },
  ]
  return (
    <div className="fo-sc">
      <p className="fo-k">How big is the discount?</p>
      <div className="fo-bands">
        {bands.map((b) => (
          <span key={b.r} className={'fo-band' + (lit ? (b.r === r ? ' on' : ' off') : '')} style={{ left: `${(b.from / 50) * 100}%`, width: `${((b.to - b.from) / 50) * 100}%` }}>
            <em>{b.t}</em><small>{b.r === 'cro' ? 'over 35%' : `${b.from}–${b.to}%`}</small>
          </span>
        ))}
        <span className="fo-mk" style={{ left: `${x * 100}%` }}><b>{d.disc}%</b></span>
      </div>
      <Reveal at={1500}><span className="fo-ans">{r === 'mgr' ? `${d.disc}% is within the sales manager’s ${fin}%` : r === 'fin' ? `${d.disc}% is over ${fin}%, so Finance joins` : `${d.disc}% is over 35%, so it goes to the CRO`}</span></Reveal>
    </div>
  )
}
function SceneWho({ r }: { r: Route }) {
  const who = r === 'mgr' ? ['Sales manager'] : r === 'fin' ? ['Sales manager', 'Finance'] : r === 'cro' ? ['CRO'] : []
  const time = r === 'mgr' ? '1 h 10 m' : r === 'fin' ? '3 h 40 m' : '6 h 05 m'
  return (
    <div className="fo-sc">
      <p className="fo-k">{who.length > 1 ? 'Two people approve, in order' : 'One person approves'}</p>
      <div className="fo-who">
        {who.map((p, i) => (
          <span key={p} className="fo-p-w">
            {i > 0 && <Reveal at={900}><Icon name="arrow-right" size={16} /></Reveal>}
            <Reveal at={300 + i * 900}><span className="fo-p"><Icon name="user" size={16} /><b>{p}</b><Icon name="check" size={14} /></span></Reveal>
          </span>
        ))}
      </div>
      <p className="fo-note">Usually takes {time}. The agent’s part was 4 seconds.</p>
    </div>
  )
}
function SceneEnd({ d, r }: { d: Deal; r: Route }) {
  return (
    <div className="fo-sc">
      <p className="fo-k">The record unlocks</p>
      <div className="fo-end"><span className="fo-lock"><Icon name="lock-open" size={22} /></span><b>{d.name}</b><span>{r === 'none' ? 'went straight through' : 'is approved'} and moves on</span></div>
      <p className="fo-note">Logged as a receipt on this page.</p>
    </div>
  )
}

/**
 * How it works, one step at a time. Instead of showing the whole flow at once, a real deal walks through it and the
 * stage shows only the step it is on: the agent reading, the $100k question with the deal's amount sliding against
 * the threshold, the discount bands with its marker landing in one, the people who approve, the unlock. A thin rail
 * above is the whole flow in miniature (done, now, skipped). Play / pause, step back and forward, or jump to a stop.
 * The bands come from the live Salesforce config, so a change redraws them.
 */
export function Flow() {
  const w = useW(), fin = w.fin
  const [di, setDi] = useState(0), [s, setS] = useState(0)
  const d = DEALS[di % DEALS.length], r = routeOf(d, fin), skip = r === 'none' ? new Set([3, 4]) : new Set<number>()
  const next = () => { let n = s + 1; while (skip.has(n)) n++; if (n > 5) { setDi((x) => x + 1); setS(0) } else setS(n) }
  const prev = () => { let n = s - 1; while (skip.has(n)) n--; if (n >= 0) setS(n) }
  useEffect(() => {
    if (!w.playing || RM) return
    const t = window.setTimeout(next, HOLD[s]); return () => window.clearTimeout(t)
  }, [s, di, w.playing]) // eslint-disable-line react-hooks/exhaustive-deps
  const go = (i: number) => { if (!skip.has(i)) { setS(i); w.setPlaying(false) } }

  return (
    <div className="fo" id="b-flow">
      <div className="fo-h">
        <ol className="fo-rail" aria-label="The flow">
          {STOPS.map((st, i) => (
            <li key={st.k} className={(i === s ? 'now' : i < s && !skip.has(i) ? 'done' : '') + (skip.has(i) ? ' skip' : '')}>
              <button onClick={() => go(i)} disabled={skip.has(i)} aria-current={i === s ? 'step' : undefined}><span className="fo-st"><Icon name={i < s && !skip.has(i) ? 'check' : st.ic} size={12} /></span><span className="fo-sl">{st.t}</span></button>
            </li>
          ))}
        </ol>
        {w.why['flow'] && <Chip id="flow" />}
      </div>
      <div className="fo-stage" aria-live="polite">
        <div key={di + '-' + s + '-' + fin} className="fo-in">
          {s === 0 && <SceneIn d={d} />}
          {s === 1 && <SceneAgent />}
          {s === 2 && <SceneAmount d={d} />}
          {s === 3 && <SceneDiscount d={d} fin={fin} r={r} />}
          {s === 4 && <SceneWho r={r} />}
          {s === 5 && <SceneEnd d={d} r={r} />}
        </div>
      </div>
      <div className="fo-f">
        <span className="fo-ctl">
          <button className="fo-b" onClick={() => { prev(); w.setPlaying(false) }} aria-label="Previous step" disabled={s === 0}><Icon name="skip-back" size={14} /></button>
          <button className="fo-b fo-pl" onClick={() => w.setPlaying(!w.playing)} aria-label={w.playing ? 'Pause' : 'Play'}><Icon name={w.playing ? 'pause' : 'play'} size={14} /></button>
          <button className="fo-b" onClick={() => { next(); w.setPlaying(false) }} aria-label="Next step"><Icon name="skip-forward" size={14} /></button>
        </span>
        <span className="fo-cur"><span className="tk">Following</span><b>{d.name}</b></span>
        <button className="wl fo-nd" onClick={() => { setDi((x) => x + 1); setS(0) }}>Next deal</button>
      </div>
    </div>
  )
}
