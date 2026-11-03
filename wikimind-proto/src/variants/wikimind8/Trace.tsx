import { AG } from './data'
import { Icon, type IconName } from './Icon'
import { Ag } from './Live'
import { useW } from './store'
import { TRACE, type TStep, type Tier } from './traces'

const KIND: Record<TStep['k'], { t: string; ic: IconName }> = {
  observed: { t: 'Observed', ic: 'eye' }, reasoned: { t: 'Reasoned', ic: 'git-branch' }, asked: { t: 'Asked', ic: 'circle-help' },
  edited: { t: 'Edited', ic: 'pencil-line' }, verified: { t: 'Verified', ic: 'badge-check' }, revoked: { t: 'Revoked', ic: 'rotate-ccw' },
}
const TIER: Record<Tier, string> = { verified: 'Verified by a person', observed: 'Read from Salesforce', unofficial: 'Unofficial practice', open: 'Open question', checking: 'Being re-checked' }

/**
 * The trace behind one piece of knowledge: the claim, its trust tier, and the chain that produced it, oldest first:
 * what the agents observed (with the source and the words), how they reasoned, whom they asked, what they edited
 * (before and after), and who verified or revoked it. Live events add links as they happen.
 */
export function Trace({ id }: { id: string }) {
  const w = useW(), base = TRACE[id], el = typeof document !== 'undefined' ? (document.querySelector(`#b-${id} .blk-c`) ?? document.querySelector(`#b-${id}`)) : null
  if (!base) return null
  const live = w.extra[id] || [], steps = [...base.steps.map((x) => ({ ...x, isNew: false })), ...live.map((x) => ({ ...x, isNew: true }))].reverse() // newest first
  const tier: Tier = id === 'who-fin' && w.verify === 'checking' ? 'checking' : id === 'renew' && w.renewal === 'answered' ? 'verified' : id === 'cfg-cpq' && w.cpq === 'fixed' ? 'observed' : base.tier
  const claim = id === 'flow' || id === 'cfg' ? '' : el instanceof HTMLTableRowElement ? [...el.cells].slice(0, 3).map((c) => c.textContent).join(' · ') : (el?.textContent || '').replace(/Edited.*$|Why\?|Asking .*$/g, '').replace(/\s+/g, ' ').trim().slice(0, 220)
  return (
    <div className="tr">
      <div className="tr-claim">
        <span className="tk">{base.label}</span>
        {claim && <p>“{claim}”</p>}
        <span className={'tr-tier ' + tier}>{TIER[tier]}</span>
      </div>
      <ol className="tr-steps">
        {steps.map((s, i) => (
          <li key={i} className={'tr-s ' + s.k + (s.isNew ? ' new' : '')}>
            <span className="tr-ic" aria-hidden="true"><Icon name={KIND[s.k].ic} size={13} /></span>
            <div className="tr-b">
              <div className="tr-h"><span className="tr-k">{KIND[s.k].t}</span><span className="tr-at">{s.at}</span></div>
              <p className="tr-t">{s.t}</p>
              <span className="tr-by">{s.by === 'person' ? <span className="tr-pp" aria-hidden="true"><Icon name="user" size={10} /></span> : <Ag id={s.by} size={16} />}{s.by === 'person' ? s.name : `${AG[s.by].name} agent`}</span>
              {s.quote && <blockquote>{s.quote}</blockquote>}
              {s.before && <p className="tr-diff"><del>{s.before}</del>{s.after && <ins>{s.after}</ins>}</p>}
              {s.src && <span className="tr-src"><Icon name="file-text" size={12} />{s.src}</span>}
            </div>
          </li>
        ))}
      </ol>
      <p className="tr-foot">Every step is kept. Agents write; people verify, answer and revoke.</p>
    </div>
  )
}
export { Ag }
