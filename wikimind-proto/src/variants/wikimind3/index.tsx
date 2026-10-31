import { useEffect, useRef, useState } from 'react'
import { useVariantCss } from '../../useVariantCss'
import { Chat } from './Chat'
import { Dock } from './Dock'
import { Home } from './Home'
import { Page } from './Page'
import { Sheet } from './Sheet'
import { useW, WikimindProvider } from './store'
import css from './styles.css?inline'
import { Toast } from './Toast'

function Header() {
  const w = useW(), [sc, setSc] = useState(false)
  useEffect(() => { const f = () => setSc(scrollY > 4); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  return (
    <header className={sc ? 'sc' : ''}>
      <div className="hw">
        <button className="logo" onClick={() => w.go('home')} aria-label="Wikimind home"><b>Wikimind</b><small>Northwind</small></button>
        <span className="hlive"><span className="pdot" />Asoka is learning</span>
      </div>
    </header>
  )
}

/** Keyboard: / to ask, Esc to back out, Tab stays inside the sheet, and presenter keys L and A. */
function Keys() {
  const w = useW(), ref = useRef(w)
  ref.current = w
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const w = ref.current, tg = (e.target as HTMLElement).tagName, typing = tg === 'INPUT' || tg === 'TEXTAREA', mod = e.metaKey || e.ctrlKey || e.altKey
      if (!typing && !mod) {
        if (e.key === 'l' || e.key === 'L') return w.learn()
        if (e.key === 'a' || e.key === 'A') return w.resolveNewest()
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
        else if (w.chatOpen) { w.hideChat(); document.getElementById('cin')?.focus() }
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
      <main id="main">{w.view === 'home' ? <Home /> : <Page key="page" />}</main>
      <Chat />
      <Dock />
      <Sheet />
      <Toast />
      <Keys />
    </>
  )
}

export default function Wikimind3() {
  useVariantCss(css)
  return <WikimindProvider><Shell /></WikimindProvider>
}
