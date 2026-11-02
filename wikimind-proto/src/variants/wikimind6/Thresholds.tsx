/**
 * The approval thresholds as a strip: who approves at each discount. Shared by Home's lead story (with the old line
 * struck through) and Try a deal (with a marker at the visitor's deal; dimmed when the deal is too small to need approval).
 */
export function Thresholds({ fin, was, mark, off }: { fin: number; was?: { at: number; label: string }; mark?: number; off?: boolean }) {
  const pct = (n: number) => (Math.min(50, n) / 50) * 100 + '%'
  const on = mark === undefined || off ? null : mark > 35 ? 'c' : mark > fin ? 'f' : 'm'
  const cls = (k: string) => 'thr-s ' + k + (on === k ? ' on' : '')
  return (
    <div className={'thr' + (on ? ' pick' : '') + (off ? ' off' : '')} role="img" aria-label={`Sales manager up to ${fin}%, Finance added over ${fin}%, CRO over 35%.${was ? ` Previously ${was.label}.` : ''}${mark !== undefined ? ` This deal: ${mark}% off.` : ''}`}>
      <div className="thr-bar">
        <span className={cls('m')} style={{ left: 0, width: pct(fin) }}><b>Manager</b></span>
        <span className={cls('f')} style={{ left: pct(fin), width: pct(35 - fin) }}><b>+ Finance</b></span>
        <span className={cls('c')} style={{ left: pct(35), width: pct(15) }}><b>CRO</b></span>
        {was && <span className="thr-was" style={{ left: pct(was.at) }}><small>was {was.at}%</small></span>}
        {mark !== undefined && <span className="thr-mark" style={{ left: pct(mark) }}><small>{mark}%</small></span>}
      </div>
      <div className="thr-ax">{[0, 10, 20, 30, 40, 50].map((n) => <span key={n} style={{ left: pct(n) }}>{n}%</span>)}</div>
    </div>
  )
}
