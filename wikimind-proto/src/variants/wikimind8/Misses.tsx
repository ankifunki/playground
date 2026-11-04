import { AG, type AgentId } from './data'
import { Icon } from './Icon'
import { Ag } from './Live'
import { useW } from './store'

/*
 * The misses behind "98.6% reliable": every decision a person later changed, each with what the job did, what the
 * person did, and what changed after. Trust by exception: they are always shown, never summarised away. Demo data.
 */
type Miss = { ag: AgentId; when: string; did: string; person: string; after: string; go: string; block?: string; cta: string }
export const MISSES: Miss[] = [
  { ag: 'approvals', when: 'Oct 22', did: 'Sent Juniper add-on (22% off) to the sales manager alone.', person: 'Dana Ruiz added Finance: over its two-year term the discount came to 26%.', after: 'Asoka now routes on the discount over the whole term. Who approves says so.', go: 'discount-approvals', block: 'who-fin', cta: 'Read Who approves' },
  { ag: 'access', when: 'Oct 17', did: 'Reclaimed a Sales Cloud seat from a rep on parental leave.', person: 'Priya Shah gave it back the same day.', after: 'Seats of people on leave in Workday are never reclaimed. License seats says so.', go: 'license-seats', cta: 'Read License seats' },
  { ag: 'security', when: 'Oct 9', did: 'Closed a sign-in alert from Lisbon as expected travel.', person: 'IT reopened it: the rep’s trip was to Madrid.', after: 'It asks a person when the sign-in city doesn’t match the booked trip, until it gets Okta sign-in logs.', go: 'login-policies', cta: 'Read Login policies' },
]

/** The misses, in the right panel: all of them, or one job's with a way back to all. */
export function Misses({ only }: { only: AgentId | 'all' }) {
  const w = useW(), list = only === 'all' ? MISSES : MISSES.filter((m) => m.ag === only)
  return (
    <div className="ap ms">
      <div className="ms-h">
        <span className="tk">Reliability · 30 days</span>
        <b className="num">98.6%</b>
        <p>matched a person on 1,912 decisions. {MISSES.length} times a person changed what Asoka did. All of them are here.</p>
      </div>
      {only !== 'all' && <p className="ms-f">{AG[only].name} job · {list.length ? `${list.length} miss` : 'no misses'}<button className="wl" onClick={() => w.openMisses('all')}>See all {MISSES.length}</button></p>}
      <ol className="ms-l">
        {list.map((m) => (
          <li key={m.did}>
            <span className="ms-k"><Ag id={m.ag} size={20} /><b>{AG[m.ag].name}</b><span className="tk">{m.when}</span></span>
            <dl>
              <div><dt className="tk">Asoka</dt><dd>{m.did}</dd></div>
              <div><dt className="tk">A person</dt><dd>{m.person}</dd></div>
              <div><dt className="tk">Since then</dt><dd>{m.after}</dd></div>
            </dl>
            <button className="wl ms-go" onClick={() => (m.block ? w.jump(m.block) : w.go(m.go))}>{m.cta}<Icon name="arrow-right" size={14} /></button>
          </li>
        ))}
      </ol>
    </div>
  )
}
