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
]
const DEFAULT = 'h'

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
  const V = VARIANTS.find((v) => v.key === key)!
  return (
    <>
      <div className="vs-bar">
        <span className="vs-lbl">Variant</span>
        <div className="vs-seg" role="tablist" aria-label="Prototype variant">
          {VARIANTS.map((v) => (
            <button key={v.key} role="tab" aria-selected={v.key === key} onClick={() => pick(v.key)} ref={(el) => { if (el && v.key === key) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }}>
              <b>{v.name}</b><span>{v.desc}</span>
            </button>
          ))}
        </div>
        <button className="vs-theme" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} aria-pressed={theme === 'dark'} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark'
            ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" /></svg>}
        </button>
      </div>
      <Suspense fallback={<div className="vs-loading">Loading…</div>}>
        <V.Component key={V.key} />
      </Suspense>
    </>
  )
}
