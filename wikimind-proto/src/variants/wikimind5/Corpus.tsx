import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Ag } from './agents'
import { AREAS, CORPUS_TOTAL, CT_LABEL, DAYS, GROWTH, PAGES, TOPICS, TOTALS, VERBS } from './data'
import { Icon } from './Icon'
import { RM } from './logic'
import { useW } from './store'

const START = Date.now() - DAYS * 864e5
const dateOf = (d: number) => (d >= DAYS ? 'Today' : new Date(START + d * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
const pct = (n: number, t: number) => Math.round((n / t) * 100)
const D900 = GROWTH.findIndex((n) => n >= 900)
/** Pages each topic had by the end of each day. */
const AREA_GROWTH = AREAS.map((_, ai) => GROWTH.map((_, d) => PAGES.filter((p) => p.area === ai && p.day <= d).length))

/**
 * How the corpus grew, day by day, since the sources were connected. Labelled at the moments that matter;
 * hover (or drag) to read any day. During a replay it draws itself up to the current day.
 */
function Growth({ upto, onDay }: { upto: number; onDay: (d: number | null) => void }) {
  const [hov, setHov] = useState<number | null>(null)
  const xs = (d: number) => ((d + 1) / (DAYS + 1)) * 100, ys = (n: number) => 100 - (n / CORPUS_TOTAL) * 92
  const pts = ['0,100', ...GROWTH.slice(0, upto + 1).map((n, d) => `${xs(d).toFixed(2)},${ys(n).toFixed(2)}`)]
  const line = pts.join(' '), area = `${line} ${xs(upto).toFixed(2)},100`
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), d = Math.round(((e.clientX - r.left) / r.width) * (DAYS + 1)) - 1
    const v = Math.max(0, Math.min(upto, d)); setHov(v); onDay(v)
  }
  const show = hov ?? null
  return (
    <div className="gr" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => { setHov(null); onDay(null) }} role="img"
      aria-label={`Pages written since the sources were connected: none on ${dateOf(0)}, ${GROWTH[D900]} by ${dateOf(D900)}, ${CORPUS_TOTAL} today.`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon className="gr-a" points={area} />
        <polyline className="gr-l" points={line} />
      </svg>
      <span className="gr-m start" style={{ left: '0%', bottom: '0%' }}><i /><small>{dateOf(0)}<br />sources connected</small></span>
      {upto >= D900 && <span className="gr-m" style={{ left: xs(D900) + '%', bottom: (100 - ys(GROWTH[D900])) + '%' }}><i /><small>{GROWTH[D900].toLocaleString()} pages<br />by {dateOf(D900)}</small></span>}
      {upto >= DAYS && <span className="gr-m end" style={{ left: '100%', bottom: (100 - ys(CORPUS_TOTAL)) + '%' }}><i /><small>{CORPUS_TOTAL.toLocaleString()} today</small></span>}
      {show !== null && <span className="gr-h" style={{ left: xs(show) + '%' }}><small>{dateOf(show)} · {GROWTH[show].toLocaleString()} pages</small></span>}
    </div>
  )
}

type Live = { i: number; v: string; at: number }

/**
 * Everything the agents know, in words: how much there is, how far a person has checked it, how it grew,
 * and what is changing in each topic right now. Tap a topic to see its most recently updated pages.
 */
export function Corpus() {
  const w = useW(), wr = useRef(w); wr.current = w
  const [rep, setRep] = useState<{ day: number; playing: boolean } | null>(null)
  const [hovDay, setHovDay] = useState<number | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [lives, setLives] = useState<(Live | null)[]>(() => AREAS.map((_, ai) => ({ i: TOPICS[ai].recent[0], v: VERBS[ai % VERBS.length], at: Date.now() - (ai + 1) * 41000 })))
  const on = useRef(true); on.current = w.wireOn && !rep

  // Live: every few seconds an agent changes a page in one of the topics.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (!on.current) return
      const ai = Math.floor(Math.random() * AREAS.length), pool = PAGES.map((p, i) => [p, i] as const).filter(([p]) => p.area === ai)
      const i = pool[Math.floor(Math.random() * pool.length)][1]
      setLives((ls) => ls.map((l, k) => (k === ai ? { i, v: VERBS[Math.floor(Math.random() * VERBS.length)], at: Date.now() } : l)))
    }, 2800)
    return () => window.clearInterval(t)
  }, [])
  // Replay: day by day from the day the sources were connected.
  useEffect(() => {
    if (!rep?.playing) return
    if (rep.day >= DAYS) { setRep({ day: DAYS, playing: false }); return }
    const t = window.setTimeout(() => setRep((r) => (r ? { ...r, day: r.day + 1 } : r)), RM ? 90 : 150)
    return () => window.clearTimeout(t)
  }, [rep])
  useEffect(() => { if (w.replayN) setRep({ day: 0, playing: true }) }, [w.replayN])

  const day = rep ? rep.day : DAYS, shown = hovDay ?? day
  const ago = (t: number) => { const s = Math.round((Date.now() - t) / 1000); return s < 5 ? 'just now' : s < 60 ? s + 's ago' : Math.round(s / 60) + 'm ago' }
  const order = useMemo(() => AREAS.map((_, i) => i), [])

  return (
    <section className="cp" id="corpus" aria-label="Everything the agents know">
      <div className="cp-h">
        <h2>Everything the agents know</h2>
        {rep ? (
          <div className="cp-rep" role="group" aria-label="Replay how it was built">
            <span className="cp-day"><b>{dateOf(day)}</b> · {GROWTH[day].toLocaleString()} pages</span>
            <button className="ibtn sm" onClick={() => setRep((r) => (r ? (r.day >= DAYS ? { day: 0, playing: true } : { ...r, playing: !r.playing }) : r))} aria-label={rep.playing ? 'Pause' : rep.day >= DAYS ? 'Replay again' : 'Play'} title={rep.playing ? 'Pause' : 'Play'}><Icon name={rep.playing ? 'pause' : rep.day >= DAYS ? 'rotate-ccw' : 'play'} size={14} /></button>
            <button className="ibtn sm" onClick={() => setRep(null)} aria-label="Back to today" title="Back to today"><Icon name="x" size={14} /></button>
          </div>
        ) : (
          <button className="cp-play" onClick={() => setRep({ day: 0, playing: true })}><Icon name="play" size={12} />Watch it being built</button>
        )}
      </div>
      <p className="cp-sum">
        <b>{GROWTH[day].toLocaleString()} pages</b>, written by six agents from Northwind’s Slack, Salesforce, Jira and meetings.{' '}
        <span className="cp-k ok">{pct(TOTALS.ok, CORPUS_TOTAL)}% checked by a person</span> · <span className="cp-k stale">{TOTALS.stale} stale</span> · <span className="cp-k warn">{TOTALS.warn} unconfirmed</span>
      </p>
      <Growth upto={day} onDay={setHovDay} />

      <ol className="tp">
        {order.map((ai) => {
          const a = AREAS[ai], t = TOPICS[ai], n = AREA_GROWTH[ai][shown], l = lives[ai], isOpen = open === ai
          const seg = [['ok', t.ok], ['obs', t.obs], ['stale', t.stale], ['warn', t.warn + t.open]] as const
          return (
            <li key={a.name} className={'tp-i' + (isOpen ? ' open' : '')}>
              <button className="tp-r" onClick={() => setOpen(isOpen ? null : ai)} aria-expanded={isOpen}>
                <span className="tp-n"><b>{a.name}</b><small>{n.toLocaleString()} pages</small></span>
                <span className="tp-bar" role="img" aria-label={`${pct(t.ok, t.n)}% checked by a person, ${t.stale} stale, ${t.warn + t.open} unconfirmed`} style={{ '--g': n / t.n } as React.CSSProperties}>
                  {seg.map(([k, v]) => v > 0 && <i key={k} className={'tp-' + k} style={{ flexGrow: v }} />)}
                </span>
                <span className="tp-pc"><b>{pct(t.ok, t.n)}%</b><small>checked</small></span>
                {l && !rep && <span className="tp-live" key={l.at}><Ag id={a.ag} /><span><span className="tp-v">{AREAS[ai].ag === 'approvals' && l.i === PAGES.findIndex((p) => p.main) ? 'rewrote' : l.v}</span> {PAGES[l.i].title} <small>· {ago(l.at)}</small></span></span>}
                <span className="tp-chev" aria-hidden="true"><Icon name="chevron-down" size={16} /></span>
              </button>
              {isOpen && (
                <ul className="tp-pages">
                  {(ai === 0 ? [PAGES.findIndex((p) => p.main), ...t.recent.filter((i) => !PAGES[i].main).slice(0, 4)] : t.recent).map((i) => {
                    const p = PAGES[i]
                    return (
                      <li key={i}>
                        <button onClick={() => (p.main ? wr.current.go('page') : wr.current.openCell(i))}>
                          <span className="tp-t">{p.title}</span>
                          <span className={'tdone cp-t-' + p.tier}>{CT_LABEL[p.tier]}</span>
                          <small>updated {p.upd} · links to {p.links.length} pages</small>
                        </button>
                      </li>
                    )
                  })}
                  <li className="tp-more">and {(t.n - 5).toLocaleString()} more {a.name} pages, kept by the <Ag id={a.ag} name suffix=" agent" /></li>
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
