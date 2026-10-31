import { refFor } from './data'
import { useW } from './store'

/** Source numbers after a sentence. Tapping one opens the source sheet. */
export function Rf({ ns }: { ns: number[] }) {
  const w = useW()
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      {ns.map((n) => (
        <sup key={n} className={'rf' + (refFor(n)?.check ? ' ck' : '')}>
          <button data-ref={n} aria-label={`Source ${n}`} onClick={(e) => w.openRef(n, e.currentTarget)}>{n}</button>
        </sup>
      ))}
    </span>
  )
}
