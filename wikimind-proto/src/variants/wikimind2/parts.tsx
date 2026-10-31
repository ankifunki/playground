import type React from 'react'
import { DOMAINS, type Claim } from './data'
import { useW } from './store'

export const Arrow = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
export const Chev = ({ inherit }: { inherit?: boolean }) => <svg className="chev" style={inherit ? { color: 'inherit' } : undefined} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
export const Back = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: -2 }}><path d="M15 18l-6-6 6-6" /></svg>

/** A tiny copy of the map, used as an icon and on the map card. */
export function MiniMap({ size, hi }: { size: number; hi?: string | null }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} aria-hidden="true">
      {DOMAINS.map((d) => {
        const on = d.id === hi
        return <circle key={d.id} cx={d.x} cy={d.y} r={d.r} fill={on ? 'var(--accent)' : 'var(--accb)'} stroke={on ? 'var(--accent)' : 'var(--ink2)'} strokeOpacity={0.5} strokeWidth={size < 60 ? 14 : 5} strokeDasharray={d.cov < 0.55 && !on ? '14 10' : undefined} />
      })}
    </svg>
  )
}

/** Only claims that need attention carry a mark: changed, or worth checking. */
export function StLine({ c }: { c: Claim }) {
  if (c.st === 'chk') return <span className="st chk">Check this: {c.reason.toLowerCase()}</span>
  if (c.st === 'chg') return <span className="st chg">{c.reason}</span>
  return null
}

export function ClaimRow({ c }: { c: Claim }) {
  const w = useW()
  return <button className="crow press" onClick={() => w.openClaim(c.id)}><span className="x1"><p>{c.t}</p><StLine c={c} /></span><Chev /></button>
}

/** Policy vs. practice: what's written down next to what people actually do. */
export function Drift({ c, asButton }: { c: Claim; asButton?: boolean }) {
  const w = useW(), d = c.drift!
  const inner: React.ReactNode = <>
    <span className="dt"><span>{c.s}</span>{asButton && <Chev />}</span>
    <span className="dgrid"><span className="dl">Policy says</span><span>{d.policy}</span><span className="dl">In practice</span><span className="pr2">{d.practice}</span></span>
    <span className="dots" aria-hidden="true">{Array.from({ length: d.y }, (_, i) => <i key={'y' + i} className="y" />)}{Array.from({ length: d.n }, (_, i) => <i key={'n' + i} className="n" />)}</span>
    <span className="dleg" style={{ display: 'block' }}>{d.n ? `Filled: ${d.yl.toLowerCase()}. Outlined: ${d.nl.toLowerCase()}.` : `Every one: ${d.yl.toLowerCase()}.`}</span>
  </>
  return asButton ? <button className="drift press" onClick={() => w.openClaim(c.id)}>{inner}</button> : <div className="drift">{inner}</div>
}

export function FindOut({ k, asking }: { k: string; asking?: boolean }) {
  const w = useW()
  if (asking) return <span className="tag chk">Asking</span>
  return w.unk[k] ? <span className="mini ok">Asking now</span> : <button className="mini press" onClick={() => w.findOut(k)}>Find out</button>
}
