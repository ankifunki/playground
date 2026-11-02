import { RM } from './logic'
import { useW } from './store'

function Box({ x, y, w, h, a, b, agent }: { x: number; y: number; w: number; h: number; a: string; b?: string; agent?: boolean }) {
  return (
    <>
      <rect className={'fb' + (agent ? ' ag' : '')} x={x} y={y} width={w} height={h} rx={6} />
      <text className="ft" x={x + w / 2} y={y + (b ? 22 : h / 2 + 5)} textAnchor="middle">{a}</text>
      {b && <text className="fs" x={x + w / 2} y={y + 40} textAnchor="middle">{b}</text>}
    </>
  )
}

/**
 * How it works, at a glance (Wikimind 4's flowchart): the deal comes in, the Approvals agent routes it by discount to one
 * of three approvers, and the record unlocks. The thresholds come from the live Salesforce config, so a change redraws it.
 * Dots travel the paths unless the reader prefers less motion. One caption says where the time goes.
 */
export function HowFlow() {
  const w = useW(), f = w.fin
  return (
    <figure className="hfx">
      <svg viewBox="0 0 400 356" role="img" aria-label={`Approval flow: the Approvals agent routes a deal over $100k by discount to the sales manager (up to ${f}%), then Finance (${f} to 35%), or the CRO (over 35%); the record unlocks when approved`}>
        <defs>
          <path id="hx1" d="M200 56 L200 140 C200 166 70 160 70 188 L70 244 C70 270 200 266 200 294" />
          <path id="hx2" d="M200 56 L200 294" />
          <path id="hx3" d="M200 56 L200 140 C200 166 330 160 330 188 L330 244 C330 270 200 266 200 294" />
        </defs>
        {['M200 56 L200 88', 'M200 140 C200 166 70 160 70 188', 'M200 140 L200 188', 'M200 140 C200 166 330 160 330 188', 'M70 244 C70 270 200 266 200 294', 'M200 244 L200 294', 'M330 244 C330 270 200 266 200 294'].map((d) => <path key={d} className="fe" d={d} />)}
        {!RM && ([[1, 0], [1, 2.6], [2, 1.2], [2, 3.9], [3, 2]] as const).map(([p, t], i) => (
          <circle key={i} r={2.5} className="fd">
            <animateMotion dur="5.2s" begin={`-${t}s`} repeatCount="indefinite"><mpath href={`#hx${p}`} /></animateMotion>
          </circle>
        ))}
        <Box x={40} y={10} w={320} h={46} a="Rep moves a deal over $100k to Negotiation" />
        <Box x={40} y={88} w={320} h={52} a="Approvals agent checks and routes it" b="in about 4 seconds" agent />
        <Box x={8} y={188} w={124} h={56} a={`Up to ${f}%`} b="Sales manager" />
        <Box x={138} y={188} w={124} h={56} a={`${f} to 35%`} b="Manager + Finance" />
        <Box x={268} y={188} w={124} h={56} a="Over 35%" b="CRO" />
        <Box x={40} y={294} w={320} h={52} a="Approved: the record unlocks" b="people take about 3 h 40 m" />
      </svg>
    </figure>
  )
}
