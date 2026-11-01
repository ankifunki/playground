import { useEffect, useRef, useState } from 'react'
import { RSTEPS } from './data'
import { Icon } from './Icon'
import { RM } from './logic'

/** A real approval replayed step by step. Starts on its own once, unless the reader prefers less motion. */
export function Replay() {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { if (RM) return; const t = window.setTimeout(() => setPlaying(true), 1200); return () => window.clearTimeout(t) }, [])
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setI((x) => (x + 1) % RSTEPS.length), RM ? 2600 : 1500)
    return () => window.clearInterval(t)
  }, [playing])
  const toggle = () => { if (playing) setPlaying(false); else { setI(0); setPlaying(true) } }
  const st = RSTEPS[i]
  const w = box.current ? box.current.clientWidth : 600
  const cursor = RM ? undefined : { opacity: st.btn ? 1 : 0, left: (st.btn ? 110 : w * 0.7) + 'px', top: (st.btn ? st.c[1] : st.c[0]) + 'px' }
  return (
    <div className="rp" id="rp" ref={box}>
      <div className="cursor" style={cursor} />
      <div className="rh"><b>Helios expansion</b><span>$240,000, 28% off</span></div>
      <div className="path">{['Qualify', 'Proposal', 'Approval', 'Negotiation'].map((s, k) => <span key={s} className={k < st.path ? 'done' : k === st.path ? 'cur' : ''}>{s}</span>)}</div>
      <div className="rprow"><span className={'rpbtn' + (st.btn ? ' hit' : '')}>Submit for approval</span><span className={'lock' + (st.lock ? ' on' : '')}>🔒 Locked while in approval</span></div>
      <div className="apprs">{['Sales manager', 'Finance', 'CRO, not needed'].map((s, k) => <span key={s} className={st.ap[k] === 1 ? 'ok' : st.ap[k] === 2 ? 'wait' : ''}>{s}</span>)}</div>
      <div className="rpfoot">
        <span>{st.cap}</span>
        <button className="ibtn sm" onClick={toggle} aria-label={playing ? 'Pause' : 'Replay'} title={playing ? 'Pause' : 'Replay'}><Icon name={playing ? 'pause' : 'rotate-ccw'} size={16} /></button>
      </div>
    </div>
  )
}
