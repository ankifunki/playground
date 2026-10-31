import { useLayoutEffect } from 'react'

/** Mounts a variant's stylesheet only while the variant is on screen, so variants with overlapping class names never collide. */
export function useVariantCss(css: string) {
  useLayoutEffect(() => {
    const el = document.createElement('style')
    el.dataset.variantCss = ''
    el.textContent = css
    document.head.appendChild(el)
    return () => el.remove()
  }, [css])
}
