import { useEffect, useRef, useState } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { Dock } from './Dock'
import { Home } from './Home'
import { Job } from './Job'
import { Sheet } from './Sheet'
import { AgentPile } from './agents'
import { useW, WikimindProvider } from './store'
import css from './styles.css?inline'
import { Toast } from './Toast'
import { Tour } from './Tour'

function Header() {
  const w = useW(), [sc, setSc] = useState(false)
  useEffect(() => { const f = () => setSc(scrollY > 4); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  return (
    <header className={sc ? 'sc' : ''}>
      <div className="hw">
        <button className="logo" onClick={() => w.go('home')} aria-label="Wikimind home"><b>Wikimind</b><small>Northwind</small></button>
        <span className="hlive"><AgentPile /><span>6 agents working</span></span>
      </div>
    </header>
  )
}

/** Keyboard: / to ask, Esc to back out, Tab stays inside the sheet. Presenter keys: T tour, C Salesforce change, L Maria answers, A a person answers, S arrive from Slack, E evidence. */
function Keys() {
  const w = useW(), ref = useRef(w)
  ref.current = w
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const w = ref.current, tg = (e.target as HTMLElement).tagName, typing = tg === 'INPUT' || tg === 'TEXTAREA', mod = e.metaKey || e.ctrlKey || e.altKey
      if (!typing && !mod) {
        if (e.key === 'l' || e.key === 'L') return w.learn()
        if (e.key === 'a' || e.key === 'A') return w.resolveNewest()
        if (e.key === 's' || e.key === 'S') return w.arrive()
        if (e.key === 't' || e.key === 'T') return w.startTour()
        if (e.key === 'c' || e.key === 'C') return w.observeChange()
        if (e.key === 'e' || e.key === 'E') return w.setLens(!w.lens)
        if (e.key === '/') { e.preventDefault(); document.getElementById('cin')?.focus(); return }
      }
      const pop = document.getElementById('pop')
      if (e.key === 'Tab' && w.pop && pop) {
        const f = Array.from(pop.querySelectorAll('button')), i = f.indexOf(document.activeElement as HTMLButtonElement)
        if (f.length) {
          if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus() }
          else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus() }
          else if (i < 0) { e.preventDefault(); f[0].focus() }
        }
      }
      if (e.key === 'Escape') {
        if (w.pop) w.closePop()
        else if (w.blame) w.clearBlame()
      }
    }
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey)
  }, [])
  return null
}

function Shell() {
  const w = useW()
  return (
    <>
      <Header />
      <main id="main">{w.view === 'home' ? <Home /> : <Job key="page" />}</main>
      {w.tour === null ? <Dock /> : <Tour />}
      <Sheet />
      <Toast />
      <Keys />
    </>
  )
}

export default function Wikimind5() {
  useVariantCss(css)
  return <WikimindProvider><Shell /></WikimindProvider>
}
