/**
 * The approval route for any deal, built from the rules on the page (and the live Finance threshold).
 * It powers the "Try a deal" simulator: the route diagram, the record and the step captions all read from it.
 */
export type Deal = { amt: number; disc: number; emea: boolean; kind: 'new' | 'renew' | 'flat'; qend: boolean }
export type NodeK = 'rep' | 'sf' | 'person' | 'slack' | 'done'
export type RNode = { id: string; label: string; sub: string; k: NodeK; tone?: 'warn' | 'dash' }
export type Appr = { id: string; n: string }
export type RStep = { node: string; title: string; body: string; ns: number[]; dur?: string; stage: number; lock: boolean; done: string[]; cur?: string; banner?: string }
export type Route = { nodes: RNode[]; steps: RStep[]; who: string; time: string; appr: Appr[]; note?: [string, number[]] }

export const money = (n: number) => '$' + (n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : Math.round(n / 1000) + 'k')

export function buildRoute(d: Deal, fin: number, learned: boolean): Route {
  const rep: RNode = { id: 'rep', label: 'Rep', sub: 'moves it to Negotiation', k: 'rep' }
  const sf: RNode = { id: 'sf', label: 'Salesforce', sub: 'checks amount and discount', k: 'sf' }
  const neg: RNode = { id: 'neg', label: 'Negotiation', sub: 'record unlocks', k: 'done' }
  const s0: RStep = { node: 'rep', title: `The rep moves the deal to Negotiation`, body: `${money(d.amt)} at ${d.disc}% off. Salesforce checks it before it can move.`, ns: [1], stage: 1, lock: false, done: [] }

  // Flat renewals: skipped in practice, and confirmed on purpose once Maria answers.
  if (d.kind === 'flat') {
    return {
      nodes: [rep, sf, { ...neg, sub: learned ? 'no approval, on purpose' : 'no approval, reason unknown', tone: learned ? undefined : 'warn' }],
      who: 'No one', time: 'Instant', appr: [],
      note: [learned ? 'Confirmed by Maria Okafor: flat renewals skip approval on purpose.' : 'The Approvals agent is still asking Maria Okafor why flat renewals skip approval.', learned ? [11, 14] : [11]],
      steps: [s0,
        { node: 'sf', title: 'A renewal at the same price skips approval', body: learned ? 'On purpose since 2023: a flat renewal doesn’t change revenue risk.' : '14 of 14 flat renewals skipped it last quarter. No rule explains why yet.', ns: learned ? [11, 14] : [11], stage: 2, lock: false, done: ['rep'] },
        { node: 'neg', title: 'The deal moves straight to Negotiation', body: 'Nobody had to approve it.', ns: [11], stage: 3, lock: false, done: ['rep', 'sf'] }],
    }
  }
  if (d.amt <= 100000) {
    return {
      nodes: [rep, sf, { ...neg, sub: 'no approval needed' }], who: 'No one', time: 'Instant', appr: [],
      steps: [s0,
        { node: 'sf', title: 'Under $100,000, so no approval is needed', body: 'Only deals over $100,000 go through approval.', ns: [1, 2], stage: 2, lock: false, done: ['rep'] },
        { node: 'neg', title: 'The deal moves straight to Negotiation', body: d.disc > 10 ? 'The rep still has to give a reason for a discount over 10%.' : 'Nothing else to do.', ns: d.disc > 10 ? [16] : [2], stage: 3, lock: false, done: ['rep', 'sf'] }],
    }
  }

  const appr: Appr[] = d.disc > 35 ? [{ id: 'cro', n: 'CRO' }] : d.disc > fin ? [{ id: 'mgr', n: 'Sales manager' }, { id: 'fin', n: 'Finance' }] : [{ id: 'mgr', n: 'Sales manager' }]
  const nodes: RNode[] = [rep, sf]
  if (d.qend) nodes.push({ id: 'slack', label: 'Deal Desk', sub: 'approves in #deal-desk first', k: 'slack', tone: 'warn' })
  if (d.emea) nodes.push({ id: 'sofia', label: 'Sofia', sub: 'EMEA director, seen once', k: 'person', tone: 'dash' })
  appr.forEach((a) => nodes.push({ id: a.id, label: a.n, sub: a.id === 'cro' ? 'over 35%' : a.id === 'fin' ? `over ${fin}%` : 'up to ' + (d.disc > fin ? `${fin}%, then Finance` : `${fin}%`), k: 'person' }))
  nodes.push(neg)

  const steps: RStep[] = [s0,
    { node: 'sf', title: 'Over $100,000, so Salesforce locks the record', body: 'The request routes to its approvers. Nobody can edit the deal while it waits.', ns: [1, 2], stage: 2, lock: true, done: ['rep'], banner: 'Locked for approval' }]
  const done = ['rep', 'sf']
  if (d.qend) {
    steps.push({ node: 'slack', title: 'In practice, Deal Desk approves it in Slack first', body: 'At quarter end, Deal Desk clears big deals in #deal-desk and logs them in Salesforce afterward. The written policy doesn’t say this.', ns: [9, 10], dur: 'minutes', stage: 2, lock: true, done: [...done], banner: 'Unofficial path' })
    done.push('slack')
  }
  if (d.emea) {
    steps.push({ node: 'sofia', title: 'Sofia may review it first', body: 'One Slack message says EMEA deals go to the regional director first. The agent has seen it only once and is watching to confirm.', ns: [4], dur: '?', stage: 2, lock: true, done: [...done] })
    done.push('sofia')
  }
  appr.forEach((a, i) => {
    const why = a.id === 'cro' ? { t: 'Over 35%, the CRO approves directly', b: 'No manager step: the request goes straight to Marcus, the CRO.', ns: [3, 12], dur: '~3 h' }
      : a.id === 'fin' ? { t: `${d.disc}% is over ${fin}%, so Finance approves next`, b: 'Finance is the second approver for bigger discounts.', ns: [fin === 20 ? 13 : 15], dur: '~2 h' }
        : { t: 'The sales manager approves', b: i === 0 && appr.length > 1 ? 'First of two approvals.' : `Up to ${fin}% off, the manager is the only approver.`, ns: [3], dur: '~2 h' }
    steps.push({ node: a.id, title: why.t, body: why.b, ns: why.ns, dur: why.dur, stage: 2, lock: true, done: [...done], cur: a.id })
    done.push(a.id)
  })
  steps.push({ node: 'neg', title: 'Approved. The record unlocks', body: d.amt > 500000 ? 'The deal moves to Negotiation, and a flow posts it to #deal-desk. Only Deal Desk can change the amount now.' : 'The deal moves to Negotiation. Only Deal Desk can change the amount now.', ns: d.amt > 500000 ? [8, 17] : [8], stage: 3, lock: false, done: [...done] })

  const who = (d.qend ? 'Deal Desk in Slack, then ' : '') + (d.emea ? 'maybe Sofia, then ' : '') + appr.map((a) => a.n).join(' → ')
  const time = d.qend ? 'Minutes' : appr.length > 1 ? '~3 h 40 m' : '~2 h'
  return { nodes, steps, who, time, appr, note: [`If nobody approves within 14 days, the request expires and the rep resubmits.`, [6]] }
}
