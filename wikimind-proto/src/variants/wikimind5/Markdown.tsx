import type React from 'react'
import { refFor } from './data'
import { useW } from './store'

/**
 * The page as the agents store it: one Markdown file in a flat corpus. Links are [[wiki links]] exactly where they appear
 * in the text (clickable here too), every sentence carries footnotes to its sources, and the front matter says who keeps it
 * and who checked it. It is generated from the same state as the page, so a live change rewrites both.
 */
export function MarkdownView() {
  const w = useW(), fin = w.fin, finN = fin === 20 ? 13 : 15
  const used: number[] = []
  const f = (...ns: number[]) => ns.map((n) => { if (!used.includes(n)) used.push(n); return `[^${n}]` }).join('')
  const lines: string[] = [
    '---',
    'title: Discount approvals',
    'kept_by: Approvals agent',
    w.cfg === 'changed' ? 'verified_by: re-checking (Dana Ruiz)' : 'verified_by: Dana Ruiz',
    'links: [[Discount policy]], [[Deal Desk]], [[Quarter-end close]], [[Renewals]]',
    '---',
    '',
    '# Discount approvals',
    '',
    `**Discount approval** is how Northwind reviews big deals before they move to Negotiation.${f(1)} Any deal over $100,000 needs approval,${f(2)} and who approves depends on the discount, under the [[Discount policy]].${f(3)} EMEA deals reportedly go to the regional director first.${f(4)} <!-- seen once --> Most approvals finish in under four hours.${f(5)}`,
    '',
    '## How it works',
    '',
    '<!-- Try a deal: generated from the rules below and the live Salesforce config -->',
    '',
    '## The rules',
    '',
    '### Who approves',
    `Discounts over ${fin}% add Finance as a second approver.${f(finN)} Over 35%, the CRO approves directly.${f(3, 12)}`,
    '',
    '### When a request expires',
    `An approval request expires after 14 days, and the rep has to submit it again.${f(6)} The rule exists because two deals closed on six-week-old prices in 2024.${f(7)}`,
    '',
    '### After approval',
    `Once a deal is approved, only [[Deal Desk]] can change its amount.${f(8)} Discounts over 10% need a written reason.${f(16)}`,
    '',
    '## In practice',
    '',
    '### Quarter-end approvals in Slack',
    '<!-- unofficial: 9 of the last 12 quarter ends -->',
    `At [[Quarter-end close|quarter end]], Deal Desk approves large deals in #deal-desk first and logs them in Salesforce afterward.${f(9, 10)}`,
    '',
    '### Flat renewals',
    ...(w.learned
      ? [`Flat [[Renewals|renewals]] skip approval on purpose. It has been the policy since 2023, because flat renewals don’t change revenue risk.${f(11, 14)}`]
      : ['<!-- open question: asking Maria Okafor -->', `Renewals with no price change skip approval, even over $100,000, but no rule explains it.${f(11)}`]),
    '',
    '## How it’s configured',
    '',
    `- \`Large Deal Approval\` (approval process): locks deals over $100,000 and routes them to the manager, Finance over ${fin}%, the CRO over 35%.${f(2, finN)}`,
    `- \`Discount_Requires_Reason\` (validation rule): blocks a discount over 10% without a written reason.${f(16)}`,
    `- \`Amount_Locked_After_Approval\` (validation rule): only Deal Desk can change the amount once a deal is approved.${f(8)}`,
    `- \`Notify_Deal_Desk\` (flow): posts approved deals over $500,000 to #deal-desk. <!-- stale: not seen since Aug 14 -->${f(17)}`,
    `- \`CPQ quote sync\` (integration): sends approved discounts to CPQ quotes. <!-- failing for multi-currency -->${f(18)}`,
    '',
  ]
  const notes = used.map((n) => { const r = refFor(n); return `[^${n}]: ${r.src}, ${r.d}${r.v ? ` · checked by ${r.v}` : ''}` })

  return (
    <div className="md" aria-label="This page as Markdown">
      <div className="md-h"><span className="tk">discount-approvals.md</span><span className="tk">1 of 1,284 files · no folders</span></div>
      <pre className="md-b">{[...lines, ...notes].map((l, i) => <Line key={i} l={l} />)}</pre>
    </div>
  )
}

/** One line, tinted: front matter, headings, comments, [[links]] (they open the linked page) and [^n] footnotes. */
function Line({ l }: { l: string }) {
  const w = useW()
  const cls = l === '---' || /^[a-z_]+: /.test(l) ? 'fm' : /^#{1,3} /.test(l) ? 'hd' : /^<!--.*-->$/.test(l) ? 'cm' : /^\[\^\d+\]:/.test(l) ? 'fn' : ''
  const parts: React.ReactNode[] = []
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[\^(\d+)\]|<!--[^>]*-->/g
  let at = 0, m: RegExpExecArray | null
  while ((m = re.exec(l))) {
    if (m.index > at) parts.push(l.slice(at, m.index))
    if (m[1]) { const to = m[1]; parts.push(<button key={m.index} className="md-l" onClick={(e) => w.openPrev(to, e.currentTarget)}>{m[0]}</button>) }
    else if (m[3]) { const n = +m[3]; parts.push(<button key={m.index} className="md-f" onClick={(e) => w.openBlame([n], e.currentTarget)} aria-label={`Source ${n}`}>{m[0]}</button>) }
    else parts.push(<span key={m.index} className="md-c">{m[0]}</span>)
    at = m.index + m[0].length
  }
  if (at < l.length) parts.push(l.slice(at))
  return <span className={'md-ln ' + cls}>{parts.length ? parts : ' '}{'\n'}</span>
}
