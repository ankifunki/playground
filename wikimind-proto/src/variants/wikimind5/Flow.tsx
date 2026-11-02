import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { RM } from './logic'
import { useW } from './store'

/**
 * How it works, as a simple animated diagram: the four steps a discount approval takes, with where the time goes.
 * Steps light up in turn and the connector between them fills; it loops while on screen. Reduced motion shows it all lit.
 */
export function HowFlow() {
  const w = useW(), root = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(RM ? 4 : 0), [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = root.current; if (!el || !('IntersectionObserver' in window)) { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 })
    io.observe(el); return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (RM || !seen) return
    const t = window.setInterval(() => setAt((a) => (a >= 5 ? 0 : a + 1)), 1100)
    return () => window.clearInterval(t)
  }, [seen])
  const steps = [
    { t: 'Rep submits', s: 'moves the deal to Negotiation', ic: 'user' },
    { t: 'Agent routes it', s: 'checks it against the rules', ic: 'stamp' },
    { t: 'People approve', s: `Finance joins over ${w.fin}%`, ic: 'user' },
    { t: 'Record unlocks', s: 'the deal moves on', ic: 'lock-open' },
  ]
  const legs = ['', '4 s', '~3 h 40 m']
  return (
    <div className="hf" ref={root}>
      <dl className="hf-stats">
        <div><dt className="tk">The agent’s part</dt><dd><b>4 s</b><span>to check and route a deal</span></dd></div>
        <div><dt className="tk">People approving</dt><dd><b>3 h 40 m</b><span>median wait for approvers</span></dd></div>
      </dl>
      <ol className="hf-flow" aria-label="How a discount approval works">
        {steps.map((st, i) => (
          <li key={st.t} className={'hf-s' + (at > i ? ' on' : '') + (i === 1 ? ' agent' : '')}>
            <span className="hf-dot" aria-hidden="true"><Icon name={st.ic} size={14} /></span>
            {i < legs.length && <span className={'hf-leg' + (at > i + 1 ? ' on' : '')} aria-hidden="true"><i />{legs[i] && <em className="tk">{legs[i]}</em>}</span>}
            <span className="hf-t"><b>{st.t}</b><small>{st.s}</small></span>
          </li>
        ))}
      </ol>
    </div>
  )
}
