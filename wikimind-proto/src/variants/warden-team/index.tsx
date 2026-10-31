import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { createWarden } from './engine'
import css from './styles.css?inline'
import { AgentView, BrainView, Ctx, LogView, TeamView, TraceView, useE } from './ui'

const Back = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>

function Top() {
  const e = useE(), S = e.S, allP = e.A.every((a: any) => a.paused)
  let left
  if (S.view === 'team') left = <><span className="brand">Warden</span><span className="pulse" /></>
  else if (e.isLog() || e.isTrace()) left = <><button className="back" onClick={() => e.go(e.backOf())} aria-label="Back"><Back />Back</button><span className="pulse" /></>
  else if (e.isBrain()) { const ba = e.bAgent(); left = <><button className="back" onClick={() => e.go(ba.id)} aria-label={'Back to ' + ba.name}><Back />{ba.name}</button><span className="pulse" /></> }
  else left = <><button className="back" onClick={() => e.go('team')} aria-label="Back to team"><Back />Team</button><span className="pulse" /></>
  return (
    <header><div className="wrap">
      <div className="top">{left}<button className={'btn ' + (allP ? '' : 'stop')} onClick={e.stopAll}>{allP ? 'Resume all' : 'Stop all'}</button></div>
      <details className="demo"><summary>Demo events</summary><div>
        <button className="btn" onClick={() => e.sim('notice')}>Something changes</button>
        <button className="btn" onClick={() => e.sim('alert')}>Raise an alert</button>
        <button className="btn" onClick={() => e.sim('day')}>Skip a day</button>
      </div></details>
    </div></header>
  )
}

/** One message bar for everything: it talks to the team, an agent, a brain, or searches the log, depending on where you are. */
function Footer() {
  const e = useE(), S = e.S, [t, setT] = useState(''), [on, setOn] = useState(false), rec = useRef<any>(null)
  const send = (v: string) => { setT(''); e.send(v) }
  const { pill, list } = e.chips()
  const ph = S.view === 'team' ? 'Message the whole team' : e.isLog() || e.isTrace() ? 'Search the work log' : e.isBrain() ? 'Tell ' + e.bAgent().name + ' what to change' : 'Message ' + e.ag(S.view).name
  const mic = () => {
    const W = window as any, SR = W.SpeechRecognition || W.webkitSpeechRecognition
    if (!SR) { e.toast('Voice input isn’t available in this view. Type instead.'); return }
    if (rec.current) { rec.current.stop(); return }
    try { const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.onresult = (ev: any) => e.send(ev.results[0][0].transcript); r.onerror = () => e.toast('Couldn’t hear that. Try again or type.'); r.onend = () => { rec.current = null; setOn(false) }; r.start(); rec.current = r; setOn(true) } catch { rec.current = null; e.toast('Microphone is blocked here. Type instead.') }
  }
  return (
    <footer><div className="wrap">
      <div className="chips" id="chips">
        {pill && <button className="chip fc" onClick={e.unpick} aria-label="Stop changing this line">Changing: {pill} ×</button>}
        {list.map((x) => <button key={x} className="chip" onClick={() => send(x)}>{x}</button>)}
      </div>
      <div className="bar">
        <input id="in" type="text" value={t} onChange={(ev) => setT(ev.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); send(t) } }} placeholder={ph} aria-label="Message" autoComplete="off" />
        <button className={'ic' + (on ? ' on' : '')} id="mic" onClick={mic} aria-label="Speak"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></button>
        <button className="ic go" id="send" onClick={() => send(t)} aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></button>
      </div>
    </div></footer>
  )
}

function Toast() {
  const e = useE(), t = e.S.toast
  useEffect(() => { if (!t) return; const h = window.setTimeout(e.hideToast, 3200); return () => clearTimeout(h) }, [t?.id])
  return <div id="toast" role="status" className={t ? 'on' : ''} onClick={() => { if (t?.go) { e.go(t.go); e.hideToast() } }}>{t?.m}</div>
}

function Main() {
  const e = useE(), v = e.S.view
  const body = v === 'team' ? <TeamView /> : e.isTrace() ? <TraceView u={e.unitOf()} /> : e.isLog() ? <LogView who={e.logWho()} /> : e.isBrain() ? <BrainView a={e.bAgent()} /> : <AgentView a={e.ag(v)} />
  return <main className="wrap" id="main" aria-live="polite">{body}</main>
}

export default function WardenTeam() {
  useVariantCss(css)
  const [eng] = useState(createWarden)
  useEffect(() => { eng.start(); return eng.stop }, [eng])
  useSyncExternalStore(eng.subscribe, eng.getVersion)
  // New messages in the thread you're looking at scroll into view.
  const seq = eng.getScrollSeq()
  useEffect(() => { if (seq) window.scrollTo(0, document.body.scrollHeight) }, [seq])
  return <Ctx.Provider value={eng}><Top /><Main /><Footer /><Toast /></Ctx.Provider>
}
