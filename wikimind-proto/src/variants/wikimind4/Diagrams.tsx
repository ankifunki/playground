import { RM } from './logic'

function Box({ x, y, w, h, a, b }: { x: number; y: number; w: number; h: number; a: string; b?: string }) {
  return (
    <>
      <rect className="nb" x={x} y={y} width={w} height={h} rx={4} />
      <text className="nt" x={x + w / 2} y={y + (b ? 20 : h / 2 + 4)} textAnchor="middle">{a}</text>
      {b && <text className="ns" x={x + w / 2} y={y + 37} textAnchor="middle">{b}</text>}
    </>
  )
}

/** The approval flow, drawn by Asoka. Dots travel the paths unless the reader prefers less motion. */
export function FlowSvg({ small }: { small?: boolean }) {
  const id = small ? 'fs' : 'fl'
  return (
    <svg viewBox="0 0 360 342" role="img" aria-label="Approval flow: deals route by discount to the sales manager, Finance, or the CRO, then unlock when approved">
      <defs>
        <path id={`${id}1`} d="M180 56 L180 132 C180 158 62 152 62 180 L62 236 C62 262 180 258 180 286" />
        <path id={`${id}2`} d="M180 56 L180 286" />
        <path id={`${id}3`} d="M180 56 L180 132 C180 158 298 152 298 180 L298 236 C298 262 180 258 180 286" />
      </defs>
      {['M180 56 L180 86', 'M180 132 C180 158 62 152 62 180', 'M180 132 L180 180', 'M180 132 C180 158 298 152 298 180', 'M62 236 C62 262 180 258 180 286', 'M180 236 L180 286', 'M298 236 C298 262 180 258 180 286'].map((d) => <path key={d} className="eg" d={d} />)}
      <Box x={30} y={10} w={300} h={46} a="Rep moves a deal over $100k to Negotiation" />
      <Box x={30} y={86} w={300} h={46} a="Record locks and the request routes" />
      <Box x={8} y={180} w={108} h={56} a="Up to 20%" b="Sales manager" />
      <Box x={126} y={180} w={108} h={56} a="20 to 35%" b="Manager, then Finance" />
      <Box x={244} y={180} w={108} h={56} a="Over 35%" b="CRO" />
      <Box x={30} y={286} w={300} h={46} a="Approved: unlocks and moves on" />
      {!RM && !small && ([[1, 0], [1, 2.6], [2, 1.2], [2, 3.9], [3, 2]] as const).map(([p, t], i) => (
        <circle key={i} r={2.5} fill="var(--link)">
          <animateMotion dur="5.2s" begin={`-${t}s`} repeatCount="indefinite"><mpath href={`#${id}${p}`} /></animateMotion>
        </circle>
      ))}
    </svg>
  )
}

export function SparkSvg() {
  const v = [14, 16, 13, 18, 17, 15, 19, 16, 18, 21, 17, 12]
  return (
    <svg className="spark" viewBox="0 0 286 84" role="img" aria-label="About 16 approvals a week for 12 weeks. This week is still counting.">
      <line className="base" x1={4} x2={282} y1={72.5} y2={72.5} />
      {v.map((x, i) => <line key={i} className={i === v.length - 1 ? 'now' : ''} x1={15 + i * 23} x2={15 + i * 23} y1={72} y2={72 - x * 3} />)}
      <text x={278} y={82} textAnchor="end" fontSize={10} fill="var(--ink2)">this week, counting</text>
    </svg>
  )
}
