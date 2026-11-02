import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Pile } from './Claim'
import { buildRoute, money } from './route'
import { useW } from './store'

/**
 * Try a deal, reduced to what's needed. One active area (your deal: discount and size) and one read-only answer:
 * who approves and how long it takes, the discount bands with your deal marked, and the reason in one sentence.
 * Everything is generated from the rules on the page and the live Salesforce config.
 */
export function Sim() {
  const w = useW()
  const [deal, setDeal] = useState({ amt: 240000, disc: 28 })
  const route = useMemo(() => buildRoute({ ...deal, emea: false, kind: 'new', qend: false }, w.fin, w.learned), [deal, w.fin, w.learned])
  // A deal handed over from the arrival card or the tour.
  useEffect(() => { if (w.simReq) setDeal({ amt: w.simReq.amt, disc: w.simReq.disc }) }, [w.simReq?.n])

  const small = deal.amt <= 100000, finN = w.fin === 20 ? 13 : 15
  const [why, ns] = small ? [`${money(deal.amt)} is under $100,000, so no approval is needed.`, [2]]
    : deal.disc > 35 ? [`${deal.disc}% is over 35%, so the CRO approves directly.`, [3, 12]]
      : deal.disc > w.fin ? [`${deal.disc}% is over ${w.fin}%, so Finance approves after the sales manager.`, [finN]]
        : [`Up to ${w.fin}% off, the sales manager approves on their own.`, [3, finN]]
  const set = (p: Partial<typeof deal>) => setDeal((d) => ({ ...d, ...p }))

  return (
    <div className="sim" id="sim" aria-label="Try a deal">
      <div className="sim-in" role="group" aria-label="Your deal">
        <span className="tk">Your deal</span>
        <label className="sim-r"><span>Discount</span><b>{deal.disc}%</b>
          <input type="range" min={0} max={50} step={1} value={deal.disc} onChange={(e) => set({ disc: +e.target.value })} aria-label="Discount" style={{ '--p': (deal.disc / 50) * 100 + '%' } as React.CSSProperties} /></label>
        <label className="sim-r"><span>Deal size</span><b>{money(deal.amt)}</b>
          <input type="range" min={50000} max={1000000} step={10000} value={deal.amt} onChange={(e) => set({ amt: +e.target.value })} aria-label="Deal size" style={{ '--p': ((deal.amt - 50000) / 950000) * 100 + '%' } as React.CSSProperties} /></label>
      </div>

      <div className="sim-out" aria-live="polite">
        <span className="tk">Who approves</span>
        <p className="sim-ans"><b>{small ? 'No approval needed' : route.who}</b>{!small && <span>usually {route.time}</span>}</p>
        <p className="sim-reason">{why}</p>
        <button className="sim-why" onClick={() => w.showClaims(ns)}><Pile ns={ns} max={3} /><span>See the rule</span></button>
      </div>
    </div>
  )
}
