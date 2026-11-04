import { useEffect, useState } from 'react'
import { AGENTS, SPACES } from './data'
import { Icon, type IconName } from './Icon'
import { Ag } from './Live'
import { RM } from './store'

/*
 * "This could be your org": the first day, compressed into about nine seconds. Three sources connect, then a day's
 * clock runs while each job writes its grove, asks about what it can't tell, and the admins start verifying.
 * It answers the buyer's unspoken question: what would this look like for us? Plays once; reduced motion shows the end.
 */
const SRC: { ic: IconName; name: string; n: string; at: number }[] = [
  { ic: 'cloud', name: 'Salesforce', n: 'six years of changes', at: 0.3 },
  { ic: 'hash', name: 'Slack', n: '48,210 messages', at: 0.8 },
  { ic: 'ticket', name: 'Tickets', n: '1,912', at: 1.3 },
]
const START = 1.8, DAY = 7, END = START + DAY
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

export function Assemble() {
  const [t, setT] = useState(RM ? END : 0), [run, setRun] = useState(0)
  useEffect(() => {
    if (RM) return
    let raf = 0; const t0 = performance.now()
    const f = (now: number) => { const x = Math.min(END, (now - t0) / 1000); setT(x); if (x < END) raf = requestAnimationFrame(f) }
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf)
  }, [run])
  const d = Math.max(0, (t - START) / DAY) // 0..1 across the first day
  const hour = Math.round(d * 24)
  const total = SPACES.reduce((n, s) => n + s.total, 0)
  // Each job starts a little after the one before, so the groves fill unevenly, as they would.
  const share = (i: number) => ease((d - i * 0.05) / (0.7 + i * 0.03))
  const pages = SPACES.reduce((n, s, i) => n + Math.round(s.total * share(i)), 0)
  const asked = Math.min(6, Math.floor(d * 9))
  const verified = Math.round(212 * ease((d - 0.4) / 0.6))
  return (
    <div className="asm" role="img" aria-label={`Your org's first day: Salesforce, Slack and tickets connect; by hour 24 the jobs have written ${total.toLocaleString('en-US')} pages, asked 6 questions, and admins verified 212.`}>
      <div className="asm-h">
        <span className="tk">Your org · first day</span>
        <span className="asm-clock num">{t < START ? 'Connecting' : `Hour ${hour}`}</span>
        {!RM && t >= END && <button className="wl asm-re" onClick={() => setRun((r) => r + 1)}><Icon name="rotate-ccw" size={12} />Replay</button>}
      </div>
      <ul className="asm-src">
        {SRC.map((s) => (
          <li key={s.name} className={t >= s.at ? 'on' : ''}><Icon name={s.ic} size={14} /><b>{s.name}</b><span>{t >= s.at ? s.n : 'connecting'}</span>{t >= s.at && <Icon name="check" size={12} />}</li>
        ))}
      </ul>
      <ul className="asm-ag">
        {SPACES.map((s, i) => {
          const a = AGENTS.find((x) => x.id === s.ag)!, k = share(i)
          return (
            <li key={s.ag}>
              <Ag id={s.ag} size={20} /><span className="asm-n">{a.name}</span>
              <span className="asm-bar" aria-hidden="true"><i style={{ transform: `scaleX(${k})` }} /></span>
              <span className="num asm-c">{Math.round(s.total * k)}</span>
            </li>
          )
        })}
      </ul>
      <dl className="asm-sum">
        <div><dt className="tk">Pages written</dt><dd className="num">{pages.toLocaleString('en-US')}</dd></div>
        <div><dt className="tk">Questions asked</dt><dd className="num">{asked}</dd></div>
        <div><dt className="tk">Verified by your admins</dt><dd className="num">{verified}</dd></div>
      </dl>
    </div>
  )
}
