import { useEffect, useRef, useState } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { AskView } from './AskView'
import { ClaimView } from './ClaimView'
import { cl, claimsOf, dom, PEEK, proc, procByName } from './data'
import { MapView } from './MapView'
import { Arrow, MiniMap } from './parts'
import { ProcView } from './ProcView'
import { useW, W2Provider } from './store'
import css from './styles.css?inline'

function Header() {
  const w = useW(), [sc, setSc] = useState(false), crumbs = useRef<HTMLDivElement>(null)
  useEffect(() => { const f = () => setSc(scrollY > 4); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  const cp = w.curProc(), here = w.view === 'map' ? w.map.dom : cp ? cp.d : null
  type Crumb = { l: string; on: () => void }
  const L: Crumb[] = [{ l: 'Northwind', on: () => w.crumb(0) }]
  if (w.view === 'map') {
    const m = w.map
    if (m.lvl >= 1 && m.dom) L.push({ l: dom(m.dom).n, on: () => w.crumb(1, m.dom!) })
    if (m.lvl === 2 && m.proc) L.push({ l: proc(m.proc)!.n, on: () => w.crumb(2, m.proc!) })
    if (m.claim) L.push({ l: cl(m.claim)!.s, on: () => w.openClaim(m.claim!) })
  } else if (cp) {
    L.push({ l: dom(cp.d).n, on: () => w.crumb(1, cp.d) })
    L.push({ l: cp.n, on: () => (w.view === 'claim' ? w.openProc(cp.id) : w.crumb(2, cp.id)) })
    if (w.view === 'claim') L.push({ l: cl(w.cid)!.s, on: () => w.openClaim(w.cid) })
  }
  useEffect(() => { const el = crumbs.current; if (el) el.scrollLeft = el.scrollWidth })
  return (
    <header id="hd" className={sc ? 'sc' : ''}><div className="wrap">
      <div className="hrow">
        <button className="logo" onClick={w.home}><b>Wikimind</b><span>Northwind</span></button>
        <span className="sp" />
        {w.view !== 'map' && <button className="mm press" onClick={w.mapHere} aria-label="Show where you are on the map"><MiniMap size={26} hi={here} /></button>}
      </div>
      <div className="crumbs" ref={crumbs} style={{ display: w.view === 'ask' ? 'none' : undefined }}>
        {w.view !== 'ask' && L.map((c, i) => <span key={i} style={{ display: 'contents' }}>{i > 0 && <i>›</i>}<button className={i === L.length - 1 ? 'cur' : ''} onClick={c.on}>{c.l}</button></span>)}
      </div>
    </div></header>
  )
}

function Footer() {
  const w = useW(), [t, setT] = useState('')
  const send = () => { const x = t; setT(''); w.doAsk(x) }
  return (
    <footer id="ft" style={{ display: w.view === 'ask' ? 'none' : undefined }}>
      <div className="fb"><input id="fin" type="text" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }} placeholder="Ask anything about Northwind" aria-label="Ask" /><button onClick={send} aria-label="Ask"><Arrow /></button></div>
    </footer>
  )
}

function Peek() {
  const w = useW(), last = useRef<string | null>(null)
  if (w.peek) last.current = w.peek
  const name = last.current
  const pr = name ? procByName(name) : undefined
  const info: [string, string] = !name ? ['', ''] : pr ? ['Process in ' + dom(pr.d).n, pr.w + ' ' + claimsOf(pr.id).length + ' things Asoka knows.'] : PEEK[name] || ['Related', 'More about ' + name + '.']
  return (
    <>
      <div className={'scrim' + (w.peek ? ' on' : '')} onClick={w.closePeek} />
      <div className={'peek' + (w.peek ? ' on' : '')} role="dialog" aria-label="Preview">
        {name && <div className="card"><div className="pk">{info[0]}</div><h3>{name}</h3><p>{info[1]}</p>
          {pr && <button className="openp2 press" onClick={() => w.openProc(pr.id)}>Open {pr.n}</button>}
          <button className="px press" onClick={w.closePeek} aria-label="Close">×</button></div>}
      </div>
    </>
  )
}

function Toast() {
  const w = useW(), t = w.toast
  useEffect(() => { if (!t) return; const h = window.setTimeout(() => w.setToast(null), 3000); return () => clearTimeout(h) }, [t?.id])
  return <div id="toast" role="status" aria-live="polite" className={t ? 'on' : ''}>{t?.msg}</div>
}

function Keys() {
  const w = useW(), ref = useRef(w); ref.current = w
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; const w = ref.current; if (w.peek) w.closePeek(); else if (w.view === 'map' && w.map.lvl > 0) w.zoomOut() }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])
  return null
}

function Shell() {
  const w = useW()
  return (
    <>
      <Header />
      <main className="wrap enter" id="main" key={w.navKey}>
        {w.view === 'ask' ? <AskView /> : w.view === 'map' ? <MapView /> : w.view === 'proc' ? <ProcView /> : <ClaimView />}
      </main>
      <Footer />
      <Peek />
      <Toast />
      <Keys />
    </>
  )
}

export default function Wikimind2() {
  useVariantCss(css)
  return <W2Provider><Shell /></W2Provider>
}
