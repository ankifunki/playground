import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { AG, REASONS, type Agent, type AgentId, type DClass, type Trace } from './data'
import { useW, WardenProvider, type Need } from './store'
import css from './styles.css?inline'

/* Each agent has its own mark, drawn in its own colours. */
function Glyph({ id }: { id: AgentId }) {
  const f = `var(--${id}-fg)`
  if (id === 'iris') return <><rect x="20" y="20" width="24" height="24" rx="6" fill="none" stroke={f} strokeWidth="2.5" /><path d="M26 16v4M32 16v4M38 16v4M26 44v4M32 44v4M38 44v4M16 26h4M16 38h4M44 26h4M44 38h4" stroke={f} strokeWidth="2.5" strokeLinecap="round" /><circle cx="27.5" cy="30" r="2.4" fill={f} /><circle cx="36.5" cy="30" r="2.4" fill={f} /><path d="M28 37q4 3 8 0" fill="none" stroke={f} strokeWidth="2.2" strokeLinecap="round" /></>
  if (id === 'sol') return <><path d="M32 15l14 5v11c0 9-6 15-14 18c-8-3-14-9-14-18V20z" fill="none" stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><circle cx="27" cy="29" r="2.4" fill={f} /><circle cx="37" cy="29" r="2.4" fill={f} /><path d="M28 37h8" stroke={f} strokeWidth="2.2" strokeLinecap="round" /></>
  if (id === 'fen') return <><circle cx="27" cy="25" r="2.4" fill={f} /><circle cx="37" cy="25" r="2.4" fill={f} /><rect x="21" y="38" width="5" height="9" rx="1.5" fill={f} /><rect x="29.5" y="34" width="5" height="13" rx="1.5" fill={f} /><rect x="38" y="30" width="5" height="17" rx="1.5" fill={f} /></>
  return <><circle cx="27" cy="32" r="11" fill="none" stroke={f} strokeWidth="2.5" /><circle cx="37" cy="32" r="11" fill="none" stroke={f} strokeWidth="2.5" /><circle cx="29" cy="30" r="2.2" fill={f} /><circle cx="35" cy="30" r="2.2" fill={f} /><path d="M29 36q3 2.4 6 0" fill="none" stroke={f} strokeWidth="2.2" strokeLinecap="round" /></>
}
/** The ring says how the agent is doing: red paused, amber needs you, green fine. */
function Avatar({ a, size }: { a: Agent; size: number }) {
  const w = useW(), rc = w.paused[a.id] ? 'var(--bad)' : w.needsOf(a.id).length ? 'var(--warn)' : 'var(--ok)'
  return <span className="avw" aria-hidden="true"><svg viewBox="0 0 64 64" width={size} height={size}><circle cx="32" cy="32" r="30" fill="none" stroke={rc} strokeWidth="2" /><rect x="7" y="7" width="50" height="50" rx="17" fill={`var(--${a.id}-bg)`} /><Glyph id={a.id} /></svg></span>
}
const Dots = ({ d }: { d: string }) => (d ? <span className="dots" aria-hidden="true">{d.split('').map((c, i) => <i key={i} className={'d' + c} />)}</span> : null)
const Chev = () => <svg className="chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
const Back = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>

function NeedCard({ n }: { n: Need }) {
  const w = useW(), a = w.ag(n.agent)!
  if (n.type === 'spot') {
    const t = w.tr(n.trace!)!, c = w.cl(t.cls)
    return <div className="card"><div className="kick"><Avatar a={a} size={26} />Spot check from {a.name}</div><div className="t">Was this right? {t.title}</div><div className="w">One of {c.week} {c.name.toLowerCase()} {a.name} did on its own this week. Checking a few keeps it honest.</div><div className="btns"><button className="btn pri" onClick={() => w.go('trace-' + t.id)}>Review it</button><button className="btn" onClick={() => w.skip(n.id)}>Skip</button></div></div>
  }
  if (n.type === 'hand') {
    const k = w.cl(n.cls!)
    return <div className="card"><div className="kick"><Avatar a={a} size={26} />{a.name} is ready for more</div><div className="t">Let {a.name} handle {k.name.toLowerCase()} on its own?</div><div className="w">{k.a[0]} of the last {k.a[1]} matched your call. None were reversed.</div><div style={{ marginTop: 10 }}><Dots d={k.dots} /></div>
      {n.sent ? <div className="w" style={{ marginTop: 12, color: 'var(--ink)' }}>Sent to Dev for a second OK.</div> : <div className="btns"><button className="btn pri" onClick={() => w.handOver(k.id, n.id)}>Hand it over</button><button className="btn" onClick={() => w.skip(n.id)}>Not yet</button></div>}</div>
  }
  return <div className="card"><div className="kick"><Avatar a={a} size={26} />Fen is holding a payment</div><div className="t">Confirm Acme’s new bank details?</div><div className="w">The $4,200 invoice matches its PO, but Acme’s bank account changed 2 days ago. Only confirm if you or Acme verified it by phone.</div><div className="btns"><button className="btn pri" onClick={() => w.bank(true)}>I verified it</button><button className="btn" onClick={() => w.bank(false)}>Keep holding</button></div></div>
}

function Home() {
  const w = useW(), hr = new Date().getHours(), gw = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening', n = w.needs.length
  const line = w.allPaused ? 'Everyone is paused. Resume when you’re ready.' : n ? (n === 1 ? 'One thing needs you' : n + ' things need you') + '. Everything else is handled.' : 'Nothing needs you. The team has it.'
  return (
    <>
      <section className="greet"><h1>{gw}, Priya</h1><p>{line}</p></section>
      <h2>Needs you{n > 0 && <> <span className="n">{n}</span></>}</h2>
      {n ? w.needs.map((x) => <NeedCard key={x.id} n={x} />) : <div className="empty">You’re all caught up.</div>}
      <h2>Your team</h2>
      {AG.map((a) => {
        const nn = w.needsOf(a.id).length
        const ln = w.paused[a.id] ? 'Paused.' : (nn ? (nn === 1 ? '1 thing needs you. ' : nn + ' things need you. ') : '') + `Handled ${a.today} today, agrees with you ${w.agree(a.id)}% of the time.`
        return <button key={a.id} className="row" onClick={() => w.go(a.id)}><Avatar a={a} size={46} /><span className="x"><span className="nm">{a.name}</span> <span className="rl">{a.role}</span><div className="ln">{ln}</div></span><Chev /></button>
      })}
    </>
  )
}

function ClassCard({ c }: { c: DClass }) {
  const w = useW(), p = w.pct(c), open = w.open === c.id
  return (
    <div className="cls">
      <button className="ch" onClick={() => w.toggleClass(c.id)} aria-expanded={open}><span className="l1"><span className="nm">{c.name}</span>{p !== null && <span className={'pc' + (p < 95 ? ' lo' : '')}>{p}%</span>}</span><span className="sc">{c.scope}</span>{c.dots && <Dots d={c.dots} />}</button>
      {open && <div className="cx">
        {c.lvl === 'never' ? <div className="lock">This one always comes to you. It’s a hard rule, so it can’t be handed over.</div> : <>
          <div className="lg"><span><i className="dg" />Matched your call</span><span><i className="da" />You edited it</span><span><i className="dr" />Reversed</span><span><i className="dx" />Not reviewed</span></div>
          <div className="w" style={{ color: 'var(--ink)' }}>{c.a[0]} of {c.a[1]} decisions matched what you’d have done. {c.week} this week.</div>
        </>}
        {c.rules.length > 0 && <><div className="sub">Always</div><ul>{c.rules.map((r) => <li key={r}>{r}</li>)}</ul></>}
        {c.ex.length > 0 && <><div className="sub">Recent work</div>{c.ex.map((id) => { const t = w.tr(id)!; return <button key={id} className="ex" onClick={() => w.go('trace-' + t.id)}><span className="x">{t.title}<br /><small>{t.when}{t.rv ? (t.rv === 'ok' ? ', reviewed' : ', corrected by you') : ''}</small></span><Chev /></button> })}</>}
        {c.lvl === 'alone' && <div className="btns"><button className="btn" onClick={() => w.takeBack(c.id)}>Take it back</button></div>}
        {c.lvl === 'asks' && (c.ready ? <div className="btns"><button className="btn pri" onClick={() => w.handOver(c.id, null)}>Hand it over</button></div> : <div className="w" style={{ marginTop: 12, fontSize: 14.5 }}>{c.need || 'Needs more decisions first.'}</div>)}
      </div>}
    </div>
  )
}

function AgentView({ a }: { a: Agent }) {
  const w = useW(), mine = w.classes.filter((c) => c.agent === a.id)
  const al = mine.filter((c) => c.lvl === 'alone'), as = mine.filter((c) => c.lvl === 'asks'), nv = mine.filter((c) => c.lvl === 'never'), pz = w.paused[a.id]
  return (
    <>
      <section className="ahead"><div className="r1"><Avatar a={a} size={72} /><div><h1>{a.name}</h1><div className="rl">{a.role}<span className="ai">AI agent</span></div></div></div>
        <p>{pz ? 'Paused. Nothing runs until you resume.' : `Handles ${al.length} kind${al.length === 1 ? '' : 's'} of work on its own and asks you about ${as.length}. Agrees with you ${w.agree(a.id)}% of the time.`}</p></section>
      {al.length > 0 && <div className="grp"><h3>Handles on its own</h3>{al.map((c) => <ClassCard key={c.id} c={c} />)}</div>}
      {as.length > 0 && <div className="grp"><h3>Asks you first</h3>{as.map((c) => <ClassCard key={c.id} c={c} />)}</div>}
      {nv.length > 0 && <div className="grp"><h3>Always yours</h3>{nv.map((c) => <ClassCard key={c.id} c={c} />)}</div>}
      <div className="btns" style={{ marginTop: 22 }}><button className={'btn' + (pz ? '' : ' stop')} onClick={() => w.togglePause(a.id)}>{pz ? 'Resume ' : 'Pause '}{a.name}</button></div>
    </>
  )
}

/** Was this right? Correcting one example becomes a rule, with its impact shown before you apply it. */
function Review({ t }: { t: Trace }) {
  const w = useW(), a = w.ag(t.agent)!, [why, setWhy] = useState(t.rr?.why || '')
  if (t.rv === 'ok') return <div className="card"><div className="done">✓ You confirmed this was right.</div></div>
  if (t.rv === 'fixed') return <div className="card"><div className="done">✓ Corrected. {t.fixMsg}</div>{t.fixCls && <div className="btns"><button className="lnk" onClick={() => w.toClass(t.fixCls!)}>See the new rule</button></div>}</div>
  if (t.rv === 'once') return <div className="card"><div className="done">✓ Noted as a one-off. {a.name} won’t change its approach.</div></div>
  const R = t.rr
  if (!R) return <div className="card"><div className="t">Was this right?</div><div className="w">Your answer teaches {a.name}. It’s the fastest way to shape how it works.</div><div className="btns"><button className="btn pri" onClick={() => w.reviewOk(t.id)}>Yes, that’s right</button><button className="btn" onClick={() => w.reviewNo(t.id)}>Not quite</button></div></div>
  if (R.stage === 'reason') return <div className="card"><div className="t">What was off?</div><div className="opts">{REASONS.map((r, i) => <button key={r} className="opt" onClick={() => w.pickReason(t.id, i)}>{r}</button>)}</div></div>
  if (R.stage === 'why') {
    const sg = t.gen ? t.gen.reason! : 'This case was different'
    return <div className="card"><div className="t">{REASONS[R.reason!]}. What made this case different?</div><div className="w">One line is enough. {a.name} will look for others like it.</div>
      <input className="inp" id="why" type="text" value={why} onChange={(e) => setWhy(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') w.submitWhy(t.id, why) }} placeholder={'For example: ' + sg} aria-label="What made it different" />
      <button className="sug" onClick={() => setWhy(sg)}>{sg}</button>
      <div className="btns"><button className="btn pri" onClick={() => w.submitWhy(t.id, why)}>Continue</button></div></div>
  }
  const g = w.genOf(t), newL = R.reason === 3 ? 'won’t happen without you' : 'will ask you first'
  return <div className="card"><div className="t">Here’s what {a.name} would change</div>
    <div className="gen"><div className="t">From now on, {g.name.charAt(0).toLowerCase() + g.name.slice(1)} {newL}.</div><div className="w" style={{ marginTop: 6 }}>Because: “{R.why}”</div><div className="w" style={{ marginTop: 6 }}>Last month this would have changed {g.affected.length} of {g.of} decisions: {g.affected.join(', ')}.</div></div>
    <div className="btns"><button className="btn pri" onClick={() => w.applyGen(t.id)}>Apply</button><button className="btn" onClick={() => w.justOnce(t.id)}>Just this once</button></div></div>
}

function TraceView({ t }: { t: Trace }) {
  const w = useW(), a = w.ag(t.agent)!, c = w.cl(t.cls), p = w.pct(c)
  return (
    <>
      <section className="thead"><div className="k"><Avatar a={a} size={26} />{a.name}, {t.when}</div><h1>{t.title}</h1><div className="st">{t.status}{t.undone ? '. Undone by you.' : ''}</div></section>
      <div className="card" style={{ marginTop: 14 }}>
        <ol className="tl">{t.steps.map((s, i) => <li key={i} className={s[1]}>{s[0]}</li>)}</ol>
        <button className="whyb" onClick={() => w.toClass(c.id)}><span className="x"><b>{c.name}</b>: {c.lvl === 'alone' ? 'handles on its own' : c.lvl === 'asks' ? 'asks you first' : 'always yours'}{p === null ? '' : `. Matched your call ${c.a[0]} of ${c.a[1]} times.`}</span><Chev /></button>
      </div>
      <Review t={t} key={t.id + (t.rr?.stage || '')} />
      {t.rev && !t.undone && /^Done|^Scheduled/.test(t.status) && <div className="btns" style={{ marginTop: 4 }}><button className="lnk" onClick={() => w.undo(t.id)}>Undo this</button></div>}
    </>
  )
}

function Footer() {
  const w = useW(), [t, setT] = useState(''), [on, setOn] = useState(false), rec = useRef<any>(null)
  const send = () => { const x = t; setT(''); w.handle(x) }
  const chips = w.view === 'home' ? ['Catch me up', 'Find j.park', 'Pause everyone'] : w.view.startsWith('trace-') ? ['Catch me up', 'Find m.chen'] : ['Catch me up']
  const mic = () => {
    const W = window as any, SR = W.SpeechRecognition || W.webkitSpeechRecognition
    if (!SR) { w.showToast('Voice isn’t available in this view. Type instead.'); return }
    if (rec.current) { rec.current.stop(); return }
    try { const r = new SR(); r.lang = 'en-US'; r.onresult = (e: any) => w.handle(e.results[0][0].transcript); r.onerror = () => w.showToast('Couldn’t hear that.'); r.onend = () => { rec.current = null; setOn(false) }; r.start(); rec.current = r; setOn(true) } catch { rec.current = null; w.showToast('Microphone is blocked here.') }
  }
  return (
    <footer><div className="wrap">
      <div id="reply">{w.reply && <div className="reply">{w.reply}<button className="x" onClick={() => w.setReply(null)} aria-label="Close">×</button></div>}</div>
      <div className="chips" id="chips">{chips.map((x) => <button key={x} className="chip" onClick={() => w.handle(x)}>{x}</button>)}</div>
      <div className="bar">
        <input id="in" type="text" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }} placeholder="Ask, find, or tell your team" aria-label="Message" autoComplete="off" />
        <button className={'ic' + (on ? ' on' : '')} id="mic" onClick={mic} aria-label="Speak"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></button>
        <button className="ic go" onClick={send} aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></button>
      </div>
    </div></footer>
  )
}

function Shell() {
  const w = useW(), v = w.view
  const isTrace = v.startsWith('trace-'), t = isTrace ? w.tr(v.slice(6)) : undefined, a = w.ag(v)
  const back = t ? t.agent : 'home', lab = t ? w.ag(t.agent)!.name : 'Home'
  useEffect(() => { if (!w.toast) return; const h = window.setTimeout(() => w.setToast(null), 3000); return () => clearTimeout(h) }, [w.toast?.id])
  let main: React.ReactNode
  if (v === 'home') main = <Home />
  else if (isTrace) main = t ? <TraceView t={t} /> : <p className="w">That work isn’t here.</p>
  else main = a ? <AgentView a={a} /> : <Home />
  return (
    <>
      <header><div className="wrap"><div className="top">
        {v === 'home' ? <><span className="brand">Warden</span><span className="sp" /></> : <><button className="back" onClick={() => w.go(back)}><Back />{lab}</button><span className="sp" /></>}
        <button className={'btn sm ' + (w.allPaused ? '' : 'stop')} onClick={() => (w.allPaused ? w.resumeAll() : w.pauseAll())}>{w.allPaused ? 'Resume all' : 'Stop all'}</button>
      </div></div></header>
      <main className="wrap" id="main">{main}</main>
      <Footer />
      <div id="toast" role="status" aria-live="polite" className={w.toast ? 'on' : ''}>{w.toast?.msg}</div>
    </>
  )
}

export default function WardenV2() {
  useVariantCss(css)
  return <WardenProvider><Shell /></WardenProvider>
}
