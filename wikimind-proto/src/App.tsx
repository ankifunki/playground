import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'

type Variant = { key: string; name: string; desc: string; Component: ComponentType }

export const VARIANTS: Variant[] = [
  { key: 'b', name: 'Team + brain', desc: 'Fleet, brain map, dials, traces', Component: lazy(() => import('./variants/warden-team')) },
  { key: 'c', name: 'Decision classes', desc: 'Delegate, spot-check, correct', Component: lazy(() => import('./variants/warden-v2')) },
  { key: 'd', name: 'Wikimind', desc: 'Pages with trust and actions', Component: lazy(() => import('./variants/wikimind')) },
  { key: 'e', name: 'Wikimind 2', desc: 'Ask, zoom map, claims', Component: lazy(() => import('./variants/wikimind2')) },
  { key: 'f', name: 'Wikimind 3', desc: 'Cited, always learning', Component: lazy(() => import('./variants/wikimind3')) },
  { key: 'g', name: 'Wikimind 4', desc: 'Provenance, answers in place', Component: lazy(() => import('./variants/wikimind4')) },
  { key: 'h', name: 'Wikimind 5', desc: 'Front page, live proof, demos', Component: lazy(() => import('./variants/wikimind5')) },
  { key: 'i', name: 'Wikimind 6', desc: 'Read-only proof layer, from the brief', Component: lazy(() => import('./variants/wikimind6')) },
  { key: 'j', name: 'Wikimind 7', desc: 'Agent-first wiki, live flows', Component: lazy(() => import('./variants/wikimind7')) },
  { key: 'k', name: 'Wikimind 8', desc: 'Best of each, one workspace', Component: lazy(() => import('./variants/wikimind8')) },
  { key: 'l', name: 'Wikimind 8b', desc: 'Home as the front page', Component: lazy(() => import('./variants/wikimind8/news')) },
  { key: 'm', name: 'Wikimind 9', desc: 'Asoka named, play any deal', Component: lazy(() => import('./variants/wikimind8/nine')) },
]
const DEFAULT = 'm'
/** The iterations before Wikimind (the Warden explorations), folded behind a chevron in the bar. */
const EARLY = ['b', 'c']

type Theme = 'light' | 'dark'
/** Light unless the visitor chose dark. Every variant styles both through :root[data-theme]. */
function readTheme(): Theme {
  try { return localStorage.getItem('wikimind-theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' }
}

function readKey() {
  const k = new URLSearchParams(location.search).get('v') || (() => { try { return localStorage.getItem('wikimind-variant') } catch { return null } })()
  return VARIANTS.some((v) => v.key === k) ? (k as string) : DEFAULT
}

export default function App() {
  const [key, setKey] = useState(readKey)
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('wikimind-theme', theme) } catch { /* private mode */ }
  }, [theme])
  useEffect(() => {
    const u = new URL(location.href)
    if (u.searchParams.get('v') !== key) { u.searchParams.set('v', key); history.replaceState(null, '', u) }
    try { localStorage.setItem('wikimind-variant', key) } catch { /* private mode */ }
  }, [key])
  const pick = (k: string) => {
    if (k === key) return
    const u = new URL(location.href); u.hash = ''; u.searchParams.set('v', k); history.replaceState(null, '', u)
    setKey(k); window.scrollTo(0, 0)
  }
  const [early, setEarly] = useState(() => EARLY.includes(readKey())), [open, setOpen] = useState(false)
  const V = VARIANTS.find((v) => v.key === key)!
  // The switcher floats: a small pill (bottom-left) with the variant's name and a chevron; it opens a menu above it.
  // Outside clicks and Esc close it. The page keeps the full height (no bar across the top).
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest?.('.vs-float')) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    addEventListener('pointerdown', down); addEventListener('keydown', key, true)
    return () => { removeEventListener('pointerdown', down); removeEventListener('keydown', key, true) }
  }, [open])
  const chev = <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
  return (
    <>
      <div className={'vs-float' + (open ? ' open' : '')}>
        {open && (
          <div className="vs-menu" role="menu" aria-label="Prototype variant">
            <span className="vs-menu-h">Variant</span>
            <ul>
              {VARIANTS.filter((v) => early || !EARLY.includes(v.key)).slice().reverse().map((v) => (
                <li key={v.key}><button role="menuitemradio" aria-checked={v.key === key} className={v.key === key ? 'on' : ''} onClick={() => { pick(v.key); setOpen(false) }}>
                  <b>{v.name}</b><span>{v.desc}</span>
                  {v.key === key && <svg className="vs-tick" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>}
                </button></li>
              ))}
            </ul>
            <div className="vs-menu-f">
              <button className="vs-more" onClick={() => setEarly(!early)} aria-expanded={early}>{early ? 'Hide earlier' : `${EARLY.length} earlier`}</button>
              <button className="vs-theme" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} aria-pressed={theme === 'dark'}>
                {theme === 'dark'
                  ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
                  : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" /></svg>}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>
        )}
        <button className="vs-pill" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" title="Switch variant">
          <b>{V.name}</b>{chev}
        </button>
      </div>
      <Suspense fallback={<div className="vs-loading">Loading…</div>}>
        <V.Component key={V.key} />
      </Suspense>
    </>
  )
}
