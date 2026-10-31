import { useEffect, useRef, useState } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { CHIPS, TCOL } from './data'
import { Home } from './Home'
import { isExc } from './logic'
import { Page } from './Page'
import { useW, W1Provider } from './store'
import css from './styles.css?inline'

const Back = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>

function Header() {
  const w = useW(), [sc, setSc] = useState(false)
  useEffect(() => { const f = () => setSc(scrollY > 4); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  return (
    <header className={sc ? 'sc' : ''}><div className="wrap"><div className="top">
      {w.view === 'home'
        ? <><button className="wm" onClick={() => w.go('home')}><b>Wikimind</b><span>Northwind</span></button><span className="sp" /><span className="live"><span className="pdot" />Asoka is learning</span></>
        : <><button className="back" onClick={() => w.go('home')}><Back />Wikimind</button><span className="sp" /><span className="live"><span className="pdot" />Live</span></>}
    </div></div></header>
  )
}

/** The ask bar, always at the bottom. Answers cite the facts they come from. */
function Footer() {
  const w = useW(), [t, setT] = useState(''), a = w.ans
  const send = () => { const x = t; setT(''); w.ask(x) }
  const chips = CHIPS[w.view === 'home' ? 'home' : w.mode]
  return (
    <footer><div className="fw">
      <div id="ans">{a && (
        <div className="ans in" key={a.n}>
          <p>{a.t}</p>
          {a.cav && <div className="cav">{a.cav}</div>}
          {a.c.length > 0 && <div className="cites">{a.c.map((id) => { const b = w.B[id]; return <button key={id} className="cite" onClick={() => w.goBlock(id)}><i style={{ background: isExc(b) ? TCOL[b.tier] : 'var(--ink2)' }} />{b.tier === 'one' ? 'Seen once: ' : b.tier === 'gap' ? 'Open question: ' : ''}{b.text.split(/[.,]/)[0].slice(0, 38)}…</button> })}</div>}
          <button className="x" onClick={() => w.setAns(null)} aria-label="Close">×</button>
        </div>
      )}</div>
      <div className="chips" id="chips">{chips.map((x) => <button key={x} className="chip" onClick={() => w.ask(x)}>{x}</button>)}</div>
      <div className="bar">
        <input id="in" type="text" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }} placeholder="Ask Wikimind anything about Northwind" aria-label="Ask Wikimind" autoComplete="off" />
        <button className="go" onClick={send} aria-label="Ask"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></button>
      </div>
    </div></footer>
  )
}

function Toast() {
  const w = useW(), t = w.toast
  useEffect(() => { if (!t) return; const h = window.setTimeout(() => w.setToast(null), 3200); return () => clearTimeout(h) }, [t?.id])
  return <div id="toast" role="status" aria-live="polite" className={t ? 'on' : ''}>{t?.msg}</div>
}

function Keys() {
  const w = useW(), ref = useRef(w); ref.current = w
  useEffect(() => {
    const k = (e: KeyboardEvent) => { const w = ref.current; if (e.key === 'Escape' && (w.sel || w.why)) { if (w.sel) w.setSel(null); else w.setWhy(null) } }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])
  return null
}

function Shell() {
  const w = useW()
  return (
    <>
      <Header />
      <main className="wrap enter" id="main" key={w.navKey}>{w.view === 'home' ? <Home /> : <Page />}</main>
      <Footer />
      <Toast />
      <Keys />
    </>
  )
}

export default function Wikimind() {
  useVariantCss(css)
  return <W1Provider><Shell /></W1Provider>
}
