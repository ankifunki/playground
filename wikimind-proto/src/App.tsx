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

function readKey() {
  const k = new URLSearchParams(location.search).get('v') || (() => { try { return localStorage.getItem('wikimind-variant') } catch { return null } })()
  return VARIANTS.some((v) => v.key === k) ? (k as string) : DEFAULT
}

export default function App() {
  const [key, setKey] = useState(readKey)
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
      </div>
      <Suspense fallback={<div className="vs-loading">Loading…</div>}>
        <V.Component key={V.key} />
      </Suspense>
    </>
  )
}
