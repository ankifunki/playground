import { useEffect, useState } from 'react'
import { LivePulse } from './Live'
import { RM, useW } from './store'

export type TocItem = { id: string; t: string; blocks?: string[] }

/**
 * On this page: the page's sections, with the one you are reading marked. Wide screens get a rail in the left margin
 * that stays in view; narrower screens get a strip of section chips that sticks under the top bar. A section a job
 * is writing right now shows the live mark.
 */
export function Toc({ items }: { items: TocItem[] }) {
  const w = useW(), [active, setActive] = useState(items[0]?.id)
  useEffect(() => {
    let raf = 0
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      let cur = items[0]?.id
      for (const it of items) { const el = document.getElementById(it.id); if (el && el.getBoundingClientRect().top < 160) cur = it.id }
      // At the very bottom, the last section is the one being read.
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = items[items.length - 1].id
      setActive(cur)
    }) }
    f(); addEventListener('scroll', f, { passive: true }); addEventListener('resize', f)
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', f); removeEventListener('resize', f) }
  }, [items])
  // Keep the active chip in view in the narrow strip.
  // Keep the current chip in view by scrolling the strip sideways only; scrollIntoView would also scroll the page.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`.toc a[data-id="${active}"]`), box = el?.closest<HTMLElement>('ol')
    if (!el || !box || box.scrollWidth <= box.clientWidth) return
    const e = el.getBoundingClientRect(), b = box.getBoundingClientRect()
    if (e.left < b.left) box.scrollLeft += e.left - b.left - 16; else if (e.right > b.right) box.scrollLeft += e.right - b.right + 16
  }, [active])
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' })
  const writing = w.presence?.page === 'discount-approvals' ? w.presence.block : null
  return (
    <nav className="toc" aria-label="On this page">
      <div className="toc-in">
        <span className="tk toc-l">On this page</span>
        <ol>
          {items.map((it) => (
            <li key={it.id} className={active === it.id ? 'on' : ''}>
              <a href={'#' + it.id} data-id={it.id} aria-current={active === it.id ? 'location' : undefined} onClick={(e) => { e.preventDefault(); go(it.id) }}>
                <span>{it.t}</span>{writing && it.blocks?.includes(writing) && <LivePulse />}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
