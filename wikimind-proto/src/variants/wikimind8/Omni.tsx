import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import { AG, AGENTS, ago, type AgentId } from './data'
import { Icon } from './Icon'
import { Ag } from './Live'
import { useW } from './store'

type Ans = { q: string; ag: AgentId | null; body: ReactNode; cite?: { block: string; label: string }; ask?: boolean }

/**
 * The Omni bar: ask anything, answered by the agent that knows, with the block it rests on. It lines up with the page
 * column, shrinks to an "Ask anything" pill while you read (scrolling down), and grows back on click or "/". The pill
 * is the same input, so focus never breaks. Unknown questions are never guessed: the right agent offers to ask a person.
 */
export function Omni() {
  const w = useW(), [q, setQ] = useState(''), [ans, setAns] = useState<Ans | null>(null), [mini, setMini] = useState(false), [asked, setAsked] = useState(false), [focus, setFocus] = useState(false)
  const inp = useRef<HTMLInputElement>(null), lastY = useRef(0), [sel, setSel] = useState(-1), [scope, setScope] = useState<AgentId | null>(null)
  const [hist, setHist] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('w7-asks') || '[]') } catch { return [] } })

  useEffect(() => {
    const f = () => {
      const y = scrollY, down = y > lastY.current + 4, up = y < lastY.current - 4; lastY.current = y
      if (document.activeElement === inp.current || q || ans) return
      if (y < 120) setMini(false); else if (down) setMini(true); else if (up && y < 240) setMini(false)
    }
    addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f)
  }, [q, ans])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target as HTMLElement)?.closest?.('input,textarea')) { e.preventDefault(); setMini(false); setQ('/'); inp.current?.focus() }
      if (e.key === 'Escape' && document.activeElement === inp.current) { setAns(null); inp.current?.blur() }
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])

  // Phones show the short placeholder so it never truncates; / still lists the agents.
  const [narrow] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches)
  const answer = (text: string): Ans => {
    const t = text.toLowerCase(), f = w.fin
    const m = t.match(/(\d{1,2})\s*%/), d = m ? +m[1] : null
    if (d !== null || /who approves|approv|discount/.test(t)) {
      const x = d ?? 30
      const who = x <= f ? 'the sales manager approves alone' : x <= 35 ? 'the sales manager approves, then Finance' : 'the CRO approves directly'
      return { q: text, ag: 'approvals', body: <>At {x}% off a deal over $100,000, {who}. Finance joins over {f}%{w.why['who-fin'] ? ' (changed just now)' : ''}.</>, cite: { block: x <= f ? 'who-mgr' : x <= 35 ? 'who-fin' : 'who-cro', label: 'Who approves' } }
    }
    if (/chang|new|week|today|update/.test(t)) {
      const edits = w.acts.filter((a) => a.kind === 'edit').slice(0, 3)
      return { q: text, ag: 'approvals', body: <>Latest: {edits.map((a, i) => <span key={a.id}>{i > 0 && '; '}{a.ag === 'person' ? a.who : AG[a.ag].name} {a.t.charAt(0).toLowerCase() + a.t.slice(1)}</span>)}.</>, cite: edits[0]?.block ? { block: edits[0].block!, label: 'the latest edit' } : undefined }
    }
    if (/unsure|don.?t know|question|gap|missing/.test(t)) {
      return { q: text, ag: 'approvals', body: w.renewal === 'asking'
        ? <>Two things: whether flat renewals skip approval on purpose (asking Maria Okafor), and whether EMEA deals go to the regional director first (seen once).</>
        : <>One thing: whether EMEA deals go to the regional director first (seen once). Maria Okafor answered the flat-renewals question.</>, cite: { block: 'renew', label: 'In practice' } }
    }
    if (/quarter|slack|deal.?desk/.test(t)) return { q: text, ag: 'approvals', body: <>At quarter end, Deal Desk approves large deals in #deal-desk, then logs them in Salesforce ({w.qe[0]} of the last {w.qe[1]} quarter ends). No policy says so.</>, cite: { block: 'qe', label: 'Quarter-end approvals in Slack' } }
    if (/cpq|sync|currency/.test(t)) return { q: text, ag: 'integrations', body: w.cpq === 'failing' ? <>CPQ quote sync is failing for multi-currency deals since Oct 29. The Integrations agent asked Ben Ito why.</> : <>CPQ quote sync is fixed: Ben Ito corrected the currency mapping, and the last 40 quotes synced.</>, cite: { block: 'cfg', label: 'Configured in Salesforce' } }
    return { q: text, ag: null, ask: true, body: <>No agent knows that yet, and none will guess.</> }
  }
  const submit = (text = q) => {
    const s = text.replace(/^\//, '').trim(); if (!s) return
    const a = answer(s); setAns(scope && a.ag ? { ...a, ag: scope } : a); setQ(''); setAsked(false); setMini(false); setSel(-1)
    const h = [s, ...hist.filter((x) => x !== s)].slice(0, 4); setHist(h); try { localStorage.setItem('w7-asks', JSON.stringify(h)) } catch { /* private mode */ }
  }
  // Auto-suggest, newest first: your recent questions, then questions raised by what just changed, then a few defaults.
  const FROM: Record<string, string> = { 'who-fin': 'Who approves a 30% discount now?', 'who-mgr': 'What can a sales manager approve alone?', qe: 'What happens at quarter end?', renew: 'Do flat renewals need approval?', 'cfg-cpq': 'Is CPQ quote sync working?', flow: 'How does a deal get approved?' }
  const live = w.acts.filter((a) => a.block && FROM[a.block]).map((a) => ({ t: FROM[a.block!], when: ago((w.now - a.at) / 1000) }))
  const seen = new Set<string>(), term = q.replace(/^\//, '').trim().toLowerCase()
  const rows: { t: string; kind: 'recent' | 'live' | 'try'; when?: string }[] = [
    ...hist.map((t) => ({ t, kind: 'recent' as const })), ...live.map((x) => ({ ...x, kind: 'live' as const })),
    ...['Who approves a 30% discount?', 'What changed today?', 'What are the agents unsure about?', 'Is CPQ quote sync working?'].map((t) => ({ t, kind: 'try' as const })),
  ].filter((r) => { const k = r.t.toLowerCase(); if (seen.has(k) || (term && !k.includes(term))) return false; seen.add(k); return true }).slice(0, 6)
  // Typing "/" lists the agents, so you can choose who answers. Filter by name or job after the slash.
  const agentMode = q.startsWith('/') && !q.includes(' ')
  const agents = agentMode ? AGENTS.filter((a) => (a.name + ' ' + a.job).toLowerCase().includes(q.slice(1).toLowerCase())) : []
  const pick = (id: AgentId) => { setScope(id); setQ(''); setSel(-1); inp.current?.focus() }
  const onKey = (e: React.KeyboardEvent) => {
    if (agentMode) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(agents.length - 1, i + 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(-1, i - 1)); return }
      if (e.key === 'Enter' && agents[Math.max(0, sel)]) { e.preventDefault(); pick(agents[Math.max(0, sel)].id); return }
    }
    if (e.key === 'Backspace' && !q && scope) { setScope(null); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(rows.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(-1, i - 1)) }
    else if (e.key === 'Enter' && sel >= 0 && rows[sel]) { e.preventDefault(); submit(rows[sel].t) }
  }
  const askPerson = () => { setAsked(true); w.log({ ag: 'approvals', t: `Asked Maria Okafor: “${ans!.q}”`, page: 'discount-approvals', kind: 'ask' }) }

  return (
    <div className={'om' + (mini ? ' mini' : '') + ((focus || ans) && !mini ? ' act' : '')}>
      {ans && (
        <div className="om-ans" role="region" aria-label="Answer">
          <div className="om-ah"><span className="om-q">{ans.q}</span><button className="ib" onClick={() => setAns(null)} aria-label="Close answer"><Icon name="x" size={14} /></button></div>
          <div className="om-ab">
            {ans.ag ? <Ag id={ans.ag} size={24} /> : <span className="om-none" aria-hidden="true"><Icon name="circle-help" size={14} /></span>}
            <div>
              {ans.ag && <span className="om-who">{AG[ans.ag].name} agent</span>}
              <p>{ans.body}</p>
              {ans.cite && <button className="wl om-cite" onClick={() => w.jump(ans.cite!.block)}>Go to {ans.cite.label}</button>}
              {ans.ask && (asked
                ? <p className="om-asked">Asked. Her answer will appear on the page and here.</p>
                : <span className="om-acts"><button className="btn primary om-btn" onClick={askPerson}>Ask Maria Okafor</button><button className="btn ghost om-btn" onClick={() => setAns(null)}>Not now</button></span>)}
            </div>
          </div>
        </div>
      )}
      {!ans && !mini && focus && agentMode && agents.length > 0 && (
        <div className="om-sug om-ags" role="listbox" aria-label="Ask an agent">
          <span className="om-sh tk">Ask an agent</span>
          {agents.map((a, i) => (
            <button key={a.id} style={{ '--i': i } as React.CSSProperties} role="option" aria-selected={i === sel} className={i === sel ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setSel(i)} onClick={() => pick(a.id)}>
              <Ag id={a.id} size={22} /><span><b>{a.name}</b> {a.job}</span>{w.presence?.ag === a.id && <small>writing now</small>}
            </button>
          ))}
        </div>
      )}
      {!ans && !mini && focus && !agentMode && rows.length > 0 && (
        <div className="om-sug" role="listbox" aria-label="Suggestions">
          {rows.map((r, i) => (
            <button key={r.t} style={{ '--i': i } as React.CSSProperties} role="option" aria-selected={i === sel} className={i === sel ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setSel(i)} onClick={() => submit(r.t)}>
              <Icon name={r.kind === 'recent' ? 'rotate-ccw' : r.kind === 'live' ? 'radio' : 'search'} size={14} />
              <span>{r.t}</span>
              <small>{r.kind === 'recent' ? 'You asked' : r.kind === 'live' ? `Changed ${r.when}` : 'Try'}</small>
            </button>
          ))}
        </div>
      )}
      <div className="om-shell">
        <form className="om-bar" onSubmit={(e) => { e.preventDefault(); submit() }} onClick={() => { if (mini) { setMini(false); inp.current?.focus() } }}>
          <span className="om-pill" aria-hidden="true"><Icon name="search" size={16} />Ask anything</span>
          <Icon name="search" size={16} />
          {scope && <span className="om-chip"><Ag id={scope} size={16} />{AG[scope].name}<button type="button" onClick={() => setScope(null)} aria-label="Ask any agent"><Icon name="x" size={12} /></button></span>}
          <input ref={inp} value={q} onChange={(e) => { setQ(e.target.value); setSel(-1) }} onKeyDown={onKey} onFocus={() => { setMini(false); setFocus(true) }} onBlur={() => window.setTimeout(() => setFocus(false), 150)} placeholder={scope ? `Ask the ${AG[scope].name} agent` : narrow ? 'Ask anything' : 'Ask anything, or type / to pick an agent'} aria-label="Ask anything" />
          <span className="om-scope tk">This workspace</span>
          <kbd className="om-k">/</kbd>
          <button className="om-go" type="submit" aria-label="Ask" disabled={!q.trim()}><Icon name="arrow-right" size={16} /></button>
        </form>
      </div>
    </div>
  )
}
