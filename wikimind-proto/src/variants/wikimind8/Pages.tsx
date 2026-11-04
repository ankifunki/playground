import { useEffect, useRef, useState } from 'react'
import { AG, ago, PAGES, SPACES } from './data'
import { Icon } from './Icon'
import { Ag } from './Live'
import { useW } from './store'

/*
 * All pages: the flat corpus, A to Z, with one search across page titles, summaries and the sentences on the pages.
 * Architects arrive with a specific question, so a search that finds nothing hands it to the ask bar instead of
 * ending there. Demo: one page is written out in full, so sentence hits come from Discount approvals.
 */

/** The sentences a search can land on, each with the block it opens. They follow the live config. */
function sentences(fin: number, qe: [number, number], renewal: string, cpq: string) {
  return [
    { block: 'sum', t: 'Deals over $100,000 need approval before they move to Negotiation. The discount decides who approves.' },
    { block: 'who-mgr', t: `Up to ${fin}% off: the sales manager approves alone.` },
    { block: 'who-fin', t: `From ${fin}% to 35%: the sales manager, then Finance.` },
    { block: 'who-cro', t: 'Over 35%: the CRO approves directly.' },
    { block: 'r-exp', t: 'Requests expire after 14 days, and the rep resubmits.' },
    { block: 'r-after', t: 'Once a deal is approved, only Deal Desk can change its amount. Discounts over 10% need a written reason.' },
    { block: 'qe', t: `At quarter end, Deal Desk approves large deals in #deal-desk, then logs them in Salesforce (${qe[0]} of the last ${qe[1]} quarter ends).` },
    { block: 'renew', t: renewal === 'asking' ? 'Renewals with no price change skip approval, even over $100,000, but no rule explains it.' : 'Flat renewals skip approval on purpose: policy since 2023.' },
    { block: 'cfg-cpq', t: cpq === 'failing' ? 'CPQ quote sync sends approved discounts to CPQ quotes. Failing for multi-currency deals.' : 'CPQ quote sync sends approved discounts to CPQ quotes. Fixed: 40 of 40 synced.' },
  ]
}

/** Wraps each match of the search term in a mark. */
function Hit({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>
}

export function AllPages() {
  const w = useW(), [q, setQ] = useState(w.search), inp = useRef<HTMLInputElement>(null)
  useEffect(() => { setQ(w.search); if (w.search) inp.current?.focus() }, [w.search])
  const term = q.trim().toLowerCase()
  const pages = Object.values(PAGES).sort((a, b) => a.title.localeCompare(b.title))
  const lede = (id: string) => PAGES[id].lede || 'Deals over $100,000 need approval before Negotiation. The discount decides who approves.'
  const pageHits = term ? pages.filter((p) => (p.title + ' ' + lede(p.id) + ' ' + AG[p.ag].name).toLowerCase().includes(term)) : pages
  const textHits = term ? sentences(w.fin, w.qe, w.renewal, w.cpq).filter((s) => s.t.toLowerCase().includes(term)) : []
  const total = SPACES.reduce((n, s) => n + s.total, 0)
  const ask = () => window.dispatchEvent(new CustomEvent('wm-ask', { detail: q.trim() }))
  // Group by first letter, A to Z, when not searching.
  const groups = term ? [] : [...new Set(pages.map((p) => p.title[0]))].map((l) => ({ l, ps: pages.filter((p) => p.title[0] === l) }))
  const row = (p: (typeof pages)[number]) => (
    <li key={p.id}><button onClick={() => w.go(p.id)}>
      <b><Hit text={p.title} q={term} /></b>
      <span className="ix-l"><Hit text={lede(p.id)} q={term} /></span>
      <small><Ag id={p.ag} size={16} />{AG[p.ag].name} grove · re-read {ago(p.re)}</small>
    </button></li>
  )
  return (
    <article className="doc ix">
      <h1>All pages</h1>
      <p className="ix-n num">{total.toLocaleString('en-US')} pages, one flat corpus · {pages.length} in this demo</p>
      <label className="ix-q"><Icon name="search" size={16} /><input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && term && !pageHits.length && !textHits.length) ask() }} placeholder="Search pages and what they say" aria-label="Search pages and what they say" />{q && <button className="ib" onClick={() => { setQ(''); inp.current?.focus() }} aria-label="Clear search"><Icon name="x" size={14} /></button>}</label>

      {term && !pageHits.length && !textHits.length && (
        <div className="ix-none">
          <p><b>No page says that yet.</b> Ask, and Asoka answers from what it knows or asks a person.</p>
          <button className="btn soft" onClick={ask}>Ask instead<Icon name="arrow-right" size={16} /></button>
        </div>
      )}
      {textHits.length > 0 && (
        <section className="ix-s">
          <h2 className="tk">On the pages · {textHits.length}</h2>
          <ul className="ix-t">{textHits.map((s) => (
            <li key={s.block}><button onClick={() => w.jump(s.block)}><span><Hit text={s.t} q={term} /></span><small>Discount approvals</small></button></li>
          ))}</ul>
        </section>
      )}
      {term && pageHits.length > 0 && (
        <section className="ix-s">
          <h2 className="tk">Pages · {pageHits.length}</h2>
          <ul className="ix-p">{pageHits.map(row)}</ul>
        </section>
      )}
      {!term && groups.map((g) => (
        <section key={g.l} className="ix-g">
          <h2 className="tk">{g.l}</h2>
          <ul className="ix-p">{g.ps.map(row)}</ul>
        </section>
      ))}
    </article>
  )
}
