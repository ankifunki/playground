import { useRef, useState } from 'react'
import { Icon } from './Icon'
import { Ag, Asoka } from './Live'
import { RM, useW } from './store'

/*
 * Create a rule (Wikimind 9): from the page's Rules section, a panel asks for the rule, when it applies and why; the
 * approver is the page's owner. Propose: Asoka checks it against the Salesforce config and how deals actually go in
 * #deal-desk (and says if it overlaps Who approves), sends it to Maria Okafor, and once she approves it the rule is
 * written into the page, marked as yours, and logged in Live activity. Scripted; nothing leaves the browser.
 */
const SCOPES = ['Every deal', 'Deals over $100,000', 'Discounts over 20%', 'Renewals']

export function RulePanel() {
  const w = useW(), [title, setTitle] = useState(''), [body, setBody] = useState(''), [why, setWhy] = useState(''), [scope, setScope] = useState(SCOPES[1])
  const [phase, setPhase] = useState<'edit' | 'check' | 'sent' | 'done'>('edit'), [step, setStep] = useState(0), timers = useRef<number[]>([])
  // Timers write to the store, so a proposal still lands if the panel is closed mid-check.
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, RM ? 0 : ms)) }
  const overlaps = /\d+\s*%|approv|cro|finance|manager/i.test(title + ' ' + body)
  const checks = ['Read Large Deal Approval and 2 validation rules in Salesforce', 'Compared it with 9 #deal-desk threads and 4 tickets', overlaps ? 'Overlaps Who approves: Maria will see both side by side' : 'No conflict with the page or the config']
  const ok = title.trim().length > 2 && body.trim().length > 4
  const propose = () => {
    setPhase('check'); setStep(0)
    ;[1, 2, 3].forEach((n) => later(n * 700, () => setStep(n)))
    later(2400, () => setPhase('sent'))
    later(4800, () => {
      const id = 'r-u' + Date.now()
      w.addRule({ id, title: title.trim(), body: body.trim(), why: why.trim(), scope })
      w.log({ ag: 'approvals', t: `Added your rule “${title.trim()}” after Maria Okafor approved it`, page: 'discount-approvals', block: id, kind: 'edit' })
      setPhase('done')
    })
  }
  if (phase !== 'edit') {
    const n = phase === 'check' ? step : 3
    return (
      <div className="ap bk rl">
        <div className="ap-h"><Asoka size={28} state={phase === 'check' ? 'reading' : phase === 'sent' ? 'waiting' : 'idle'} /><div><b>{title}</b><small>Discount approvals · {scope}</small></div></div>
        <section><h3>Asoka is checking it</h3>
          <ol className="rl-steps">{checks.map((c, i) => <li key={c} className={i < n ? 'done' : i === n ? 'now' : ''}><span className="cx-ck" aria-hidden="true">{i < n ? <Icon name="check" size={12} /> : i === n ? <i /> : null}</span>{c}</li>)}</ol>
        </section>
        <section><h3>Approval</h3>
          {phase === 'done' ? <p className="bk-asked"><Icon name="circle-check" size={14} />Maria Okafor approved it. It’s on the page now.</p>
            : phase === 'sent' ? <p className="rl-wait"><Ag id="approvals" size={20} />Sent to Maria Okafor, RevOps, who owns this page</p>
              : <p className="rl-wait">Goes to Maria Okafor once the checks pass</p>}
        </section>
        {phase === 'done' && <div className="ap-foot bk-foot"><button className="btn soft" onClick={() => { const id = w.rules[w.rules.length - 1]?.id; w.openRule(false); if (id) w.jump(id) }}>See it on the page<Icon name="arrow-right" size={16} /></button><button className="btn ghost" onClick={() => { setPhase('edit'); setTitle(''); setBody(''); setWhy('') }}>Add another</button></div>}
      </div>
    )
  }
  return (
    <form className="ap bk rl" onSubmit={(e) => { e.preventDefault(); if (ok) propose() }}>
      <div className="ms-h"><span className="tk">Discount approvals</span><b>New rule</b><p>Asoka checks it against Salesforce and how deals actually go, then Maria Okafor approves it before it’s on the page.</p></div>
      <label className="rl-f"><span className="tk">Rule</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Multi-year deals need Finance" autoFocus /></label>
      <label className="rl-f"><span className="tk">What it says</span><textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="e.g. Any multi-year deal over $200,000 goes to Finance, whatever the discount." /></label>
      <div className="rl-f"><span className="tk">Applies to</span><span className="rl-sc">{SCOPES.map((s) => <button type="button" key={s} className={s === scope ? 'on' : ''} aria-pressed={s === scope} onClick={() => setScope(s)}>{s}</button>)}</span></div>
      <label className="rl-f"><span className="tk">Why (optional)</span><textarea rows={2} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="What happened that makes this rule needed?" /></label>
      <div className="ap-foot bk-foot"><button className="btn primary" type="submit" disabled={!ok}>Propose rule</button><span className="rl-note">Approver: Maria Okafor, RevOps</span></div>
    </form>
  )
}
