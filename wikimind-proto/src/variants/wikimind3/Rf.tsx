import { Pile, pileLabel } from './Pile'
import { useW } from './store'

/** The sources behind a sentence, as a small icon pile. Tapping it opens them in the source sheet. */
export function Rf({ ns }: { ns: number[] }) {
  const w = useW()
  return (
    <button className="rfp" data-refs={ns.join(' ')} aria-label={pileLabel(ns)} onClick={(e) => w.openRef(ns, e.currentTarget)}>
      <Pile ns={ns} max={3} label={false} />
    </button>
  )
}
