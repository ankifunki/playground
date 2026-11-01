import { DOCS, ROUTE } from './data'

export const RM = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export type Answer = { t: string; n: number[]; note?: string }
export type Cand = { q: string; who: string; team: string; page: boolean }
export type FileKind = 'img' | 'sheet' | 'doc' | 'file'
export type Att = { name: string; size: number; type: string; kind: FileKind; url: string }

/** Local answers. Each leads with the single answer, then the reason; exceptions only when they change the answer. */
export function localAns(q: string, learned: boolean): Answer | null {
  const l = q.toLowerCase()
  const pm = l.match(/(\d{1,3})\s*(%|percent)/), pct = pm ? +pm[1] : null
  const am = l.match(/\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k|m|thousand|million)?\b/)
  let amt: number | null = null
  if (am) { amt = parseFloat(am[1].replace(/,/g, '')); const u = am[2] || ''; amt *= /^k|thousand/.test(u) ? 1e3 : /^m/.test(u) ? 1e6 : 1 }
  const emea = /emea|europe|sofia/.test(l), renew = /renewal/.test(l)
  if (/who approves|approv|discount|% off|percent/.test(l) && (pct !== null || /discount/.test(l)) && !/expire/.test(l)) {
    let a: Answer
    if (amt !== null && amt <= 100000) a = { t: 'No one. Only deals over $100,000 need approval.', n: [2] }
    else if (pct === null) a = { t: 'It depends on the discount: up to 20%, the sales manager. Over 20%, the manager and then Finance. Over 35%, the CRO directly.', n: [3, 13] }
    else if (pct <= 20) a = { t: 'The sales manager. Discounts up to 20% need only the manager.', n: [3] }
    else if (pct <= 35) a = { t: 'The sales manager, then Finance. Discounts over 20% add Finance as a second approver.', n: [3, 13] }
    else a = { t: 'The CRO. Discounts over 35% go straight to the CRO.', n: [3, 12] }
    if (renew && a.n[0] !== 2) {
      a.t += ' Renewals follow the same rules when the price changes.'
      a.note = learned ? 'Renewals with no price change skip approval on purpose.' : 'Renewals with no price change skip approval. Asoka is still asking RevOps why.'
      a.n = a.n.concat([11])
    } else if (emea) a.note = 'For EMEA deals, Sofia may approve first, but Asoka has seen that only once.'
    return a
  }
  if (/expire|14|how long/.test(l)) return { t: 'An approval request expires after 14 days, because two deals once closed on six-week-old prices.', n: [6, 7] }
  if (/quarter|slack|bypass|work around|in practice/.test(l)) return { t: 'At quarter end, Deal Desk approves large deals in Slack first and logs them in Salesforce afterward.', n: [9, 10], note: 'This is unofficial and differs from the written policy.' }
  if (/renewal/.test(l)) return learned ? { t: 'Flat renewals skip approval on purpose. That has been the policy since 2023.', n: [11, 14] } : { t: 'Flat renewals skip approval in practice, but no rule explains it yet. Asoka asked RevOps.', n: [11], note: 'Treat this as unconfirmed.' }
  if (/amount|change.*approved/.test(l)) return { t: 'Once a deal is approved, only Deal Desk can change its amount.', n: [8] }
  if (/learn|this week|changed|new/.test(l)) return { t: 'This week Asoka lowered the CRO threshold to 35%, wrote down how quarter-end approvals really happen, and flagged CPQ sync failing for multi-currency deals.', n: [3, 9] }
  if (/unsure|not sure|uncertain|check/.test(l)) return { t: 'Two things on approvals: whether EMEA deals go to Sofia first, which it has seen only once, and why flat renewals skip approval, which it has asked RevOps about.', n: [4, 11] }
  if (/how fast|time|hours/.test(l)) return { t: 'Most approvals finish in under four hours. The median is 3 hours 40 minutes.', n: [5] }
  return null
}

export function fileAnswer(files: Att[], q: string): Answer {
  const k = files.map((f) => f.kind)
  if (k.includes('img')) return { t: 'That screenshot shows a deal locked in approval. It stays locked until every approver signs off, which usually takes under four hours.', n: [2, 5], note: q ? '' : 'Ask a follow-up if it’s been locked longer than a day.' }
  if (k.includes('sheet')) return { t: 'I checked the deals in that file against the approval rules. Three are over 35% off, so they’ll go straight to the CRO. The rest need the sales manager, plus Finance above 20%.', n: [3, 13] }
  if (k.includes('doc')) return { t: 'That document offers a 30% discount, so it needs the sales manager and Finance. It doesn’t need the CRO.', n: [3, 13] }
  return { t: 'I looked at that file. Tell me what you want to know about it, and I’ll answer from what I know about approvals.', n: [] }
}

/** Who Asoka would ask about an unknown question. Off-topic questions belong on Home, not this page. */
export function route(q: string, onPage: boolean): Cand {
  const l = q.toLowerCase(), r = ROUTE.find((x) => x[0].test(l))
  return { q: q.replace(/\s+/g, ' ').trim(), who: r ? r[1] : 'Dana Ruiz', team: r ? r[2] : 'Asoka’s sysadmin', page: onPage && (!r || r[2] === 'RevOps') }
}

export function answerFor(c: Cand) {
  const l = c.q.toLowerCase()
  if (/park/.test(l)) return 'Parking is first come, first served in the garage on level B2. Visitors get a pass at reception.'
  if (/vpn|password/.test(l)) return 'Reset it at id.northwind.com, then reconnect to the VPN. If MFA fails, file an IT ticket and Security resets it within the hour.'
  if (/vacation|pto|leave|holiday/.test(l)) return 'Request time off in Workday. Your manager approves it, usually within a day.'
  if (/sla/.test(l)) return 'Deal Desk does. Priya Shah reviews any approval that has waited more than 24 hours.'
  return DOCS[c.team] ? `It’s covered in the ${DOCS[c.team]}. I’ve sent Asoka the current version.` : 'I’ve pointed Asoka to the team that owns this. It will have a page on it shortly.'
}

export const whoStr = (c: Cand) => c.who + (/^Asoka/.test(c.team) ? ', ' + c.team : ' in ' + c.team)
export const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2)
export const firstName = (n: string) => n.split(' ')[0]
export function fileKind(f: File): FileKind {
  const n = f.name.toLowerCase()
  return /^image\//.test(f.type) ? 'img' : /\.(csv|xlsx?|tsv)$/.test(n) ? 'sheet' : /\.(pdf|docx?)$/.test(n) ? 'doc' : 'file'
}
export const fsize = (b: number) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB')

/** Is an element fully visible above the ask bar? */
export function inView(el: Element | null) {
  if (!el) return false
  const r = el.getBoundingClientRect(), dock = document.getElementById('dock'), d = dock ? dock.getBoundingClientRect().top : innerHeight
  return r.width > 0 && r.top >= 0 && r.bottom <= d
}
export function bump(el: Element | null) { if (!el) return; el.classList.remove('bump'); void (el as HTMLElement).offsetWidth; el.classList.add('bump') }
