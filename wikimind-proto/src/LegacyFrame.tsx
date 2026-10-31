import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Shows a not-yet-ported variant from its original HTML file. Removed once every variant is in React. */
export default function LegacyFrame({ load, title }: { load: () => Promise<{ default: string }>; title: string }) {
  const [html, setHtml] = useState<string | null>(null)
  const ref = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    let live = true
    load().then((m) => live && setHtml(m.default))
    return () => { live = false }
  }, [load])
  useLayoutEffect(() => {
    document.documentElement.classList.add('vs-legacy-on')
    const fit = () => {
      const bar = document.querySelector('.vs-bar') as HTMLElement | null
      if (ref.current) { const t = bar ? bar.offsetHeight : 0; ref.current.style.top = t + 'px'; ref.current.style.height = `calc(100% - ${t}px)` }
    }
    fit(); window.addEventListener('resize', fit)
    return () => { document.documentElement.classList.remove('vs-legacy-on'); window.removeEventListener('resize', fit) }
  }, [html])
  if (html === null) return <div className="vs-loading">Loading…</div>
  return <iframe ref={ref} className="vs-legacy" title={title} srcDoc={html} allow="microphone" />
}
