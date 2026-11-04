import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AG, DEALS, money, type AgentId } from './data'
import { Icon } from './Icon'
import { Ag } from './Live'
import { RM, useW, type ChatMsg, type ChatObj } from './store'

/*
 * Chat with the jobs, in the right panel. A question from the ask bar moves here (it flies from the bar into the
 * thread) and the conversation continues with its own input. Answers come from the job that knows, with live UI
 * pulled in: the rule it rests on (opens its trace), the Salesforce record, the approval route. The jobs can act
 * (submit a deal for approval, post in Slack, ask a person), but only after you confirm, never past what people
 * decide (it won't approve a discount itself), and every action lands in Live activity.
 */

type Deal = (typeof DEALS)[number]
const OWNER: Record<string, string> = { 'Orion platform': 'Sam Ortiz', 'Helios expansion': 'Ana Reyes', 'Atlas renewal': 'Sam Ortiz', 'Kestrel new logo': 'Jo Park', 'Juniper add-on': 'Ana Reyes', 'Vega upgrade': 'Jo Park', 'Lumen pilot': 'Sam Ortiz', 'Cobalt multi-year': 'Ana Reyes' }
const findDeal = (t: string) => DEALS.find((d) => t.toLowerCase().includes(d.name.split(' ')[0].toLowerCase()))

/** Who approves a deal under the live config. */
function route(d: { amt: number; disc: number }, fin: number) {
  if (d.amt < 100000) return { who: [] as string[], block: 'sum', time: '', line: 'no approval: it’s under $100,000' }
  if (d.disc <= fin) return { who: ['Sales manager'], block: 'who-mgr', time: 'about an hour', line: 'the sales manager approves alone' }
  if (d.disc <= 35) return { who: ['Sales manager', 'Finance'], block: 'who-fin', time: 'about four hours', line: 'the sales manager approves, then Finance' }
  return { who: ['CRO'], block: 'who-cro', time: 'about a day', line: 'the CRO approves directly' }
}

type Ctx = { fin: number; cpq: string; renewal: string; qe: [number, number]; deal: Deal | null; submitted: Set<string>; latest: string[] }
/** Approvers as a phrase: “the CRO”, “the sales manager, then Finance”. */
const them = (who: string[]) => who.map((x) => (x === 'CRO' ? 'the CRO' : x === 'Sales manager' ? 'the sales manager' : x)).join(', then ')
type Reply = Omit<ChatMsg, 'id'>

/** The jobs' side of the conversation. Simple intent matching over the demo's knowledge; unknowns are never guessed. */
function reply(text: string, c: Ctx): Reply {
  const t = text.toLowerCase(), d = findDeal(t) || c.deal
  const pct = t.match(/(\d{1,2})\s*%/), amtM = t.match(/\$\s?(\d[\d,.]*)\s*(k|m)?/)
  // The job never decides what people decide.
  if (/(can|could|will|would) you (just )?approve|approve it|approve this|override|skip (the )?(cro|approval|finance)/.test(t)) {
    if (d && d.amt < 100000) return { who: 'approvals', text: `${d.name} doesn’t need approval: it’s under $100,000. Move it to Negotiation in Salesforce.`, objs: [{ k: 'rule', block: 'sum' }] }
    return { who: 'approvals', text: `I can’t. People decide discounts over ${c.fin}%: I route the request, keep the record and chase the approvers. I can submit it for you.`, objs: [{ k: 'rule', block: d ? route(d, c.fin).block : 'who-fin' }], next: ['Submit it for approval', 'Ask Maria about an exception'] }
  }
  if (/submit|send (it )?(for|to)|route it|start (the )?approval|request approval|for approval/.test(t)) {
    if (!d) return { who: 'approvals', text: 'Which deal?', next: ['Submit Orion platform for approval', 'Submit Helios expansion for approval'] }
    const r = route(d, c.fin)
    if (!r.who.length) return { who: 'approvals', text: `${d.name} doesn’t need approval: it’s under $100,000.`, objs: [{ k: 'record', deal: d.name }] }
    if (c.submitted.has(d.name)) return { who: 'approvals', text: `${d.name} is already with ${them(r.who)}. I’ll post the answer in #deal-desk.`, objs: [{ k: 'record', deal: d.name }], next: ['What’s the status?'] }
    return { who: 'approvals', text: `Here’s what I’ll do for ${d.name}. Nothing happens until you confirm.`, objs: [{ k: 'route', deal: d.name }, { k: 'action', deal: d.name, state: 'ask', step: 0 }] }
  }
  if (/(tell|let|notify|post|message|update).*(know|sam|ana|jo|deal.?desk|slack|rep|team|channel)/.test(t)) {
    if (!d) return { who: 'approvals', text: 'About which deal?', next: ['Let Sam know about Orion platform'] }
    return { who: 'approvals', text: 'Here’s a draft for #deal-desk. I’ll post it as Asoka.', objs: [{ k: 'slack', deal: d.name, state: 'draft' }] }
  }
  if (/maria|exception|owner|wrong/.test(t)) {
    return { who: 'approvals', text: 'Maria Okafor in RevOps owns Discount approvals. I’ll ask her and bring her answer back here and to the page.', objs: [{ k: 'person', q: d ? `Can ${d.name} get an exception to the discount rule (${d.disc}% off)?` : text, state: 'draft' }] }
  }
  if (/status|where is|update on|did (the )?(cro|finance)|heard back/.test(t)) {
    if (d && c.submitted.has(d.name)) return { who: 'approvals', text: `${d.name} is locked and with ${them(route(d, c.fin).who)}, submitted just now. Usually ${route(d, c.fin).time}.`, objs: [{ k: 'record', deal: d.name }] }
    if (d) return { who: 'approvals', text: `${d.name} hasn’t been submitted for approval yet.`, objs: [{ k: 'record', deal: d.name }], next: ['Submit it for approval'] }
  }
  if (pct || /discount|approv|close|who|deal/.test(t) || findDeal(t)) {
    let amt = d?.amt ?? 240000
    if (amtM) { const n = parseFloat(amtM[1].replace(/,/g, '')); amt = amtM[2] === 'k' ? n * 1000 : amtM[2] === 'm' ? n * 1e6 : n }
    const disc = pct ? +pct[1] : d?.disc ?? 30
    const r = route({ amt, disc }, c.fin)
    const name = d && (!pct || +pct[1] === d.disc) ? d.name : null
    const objs: ChatObj[] = [{ k: 'rule', block: r.block }]
    if (name) objs.push({ k: 'record', deal: name })
    return {
      who: 'approvals',
      text: name ? `${name} is ${money(amt)} at ${disc}% off, so ${r.line}.${r.time ? ` That usually takes ${r.time}.` : ''}` : `At ${disc}% off a ${money(amt)} deal, ${r.line}.`,
      objs, next: name && r.who.length ? ['Submit it for approval', 'Can you approve it yourself?'] : ['Can Orion platform close at 38% off?'],
    }
  }
  if (/cpq|sync|currency/.test(t)) return { who: 'integrations', text: c.cpq === 'failing' ? 'CPQ quote sync is failing for multi-currency deals since Oct 29. I asked Ben Ito why.' : 'CPQ quote sync is fixed: Ben Ito corrected the currency mapping and the last 40 quotes synced.', objs: [{ k: 'rule', block: 'cfg-cpq' }] }
  if (/quarter/.test(t)) return { who: 'approvals', text: `At quarter end, Deal Desk approves large deals in #deal-desk first, then logs them in Salesforce (${c.qe[0]} of the last ${c.qe[1]} quarter ends). No policy says so.`, objs: [{ k: 'rule', block: 'qe' }] }
  if (/renewal/.test(t)) return { who: 'approvals', text: c.renewal === 'asking' ? 'Flat renewals skip approval, even over $100,000, but no rule explains it. I’m asking Maria Okafor.' : 'Flat renewals skip approval on purpose: policy since 2023.', objs: [{ k: 'rule', block: 'renew' }] }
  if (/chang|today|new|latest/.test(t)) return { who: 'approvals', text: c.latest.length ? `Latest: ${c.latest.join('; ')}.` : 'Nothing has changed in the last hour.', next: ['Who approves 30% off on a $240k deal?'] }
  return { who: 'none', text: 'I don’t know that yet, and I won’t guess. Ask about approvals, discounts, CPQ sync, quarter end or renewals, or ask me to act on a deal.', next: ['Can Orion platform close at 38% off?', 'What changed today?'] }
}

const RULE: Record<string, (f: number, c: Ctx) => { label: string; t: string }> = {
  sum: () => ({ label: 'Discount approvals', t: 'Deals over $100,000 need approval before they move to Negotiation.' }),
  'who-mgr': (f) => ({ label: 'Who approves', t: `Up to ${f}% off: the sales manager approves alone.` }),
  'who-fin': (f) => ({ label: 'Who approves', t: `From ${f}% to 35%: the sales manager, then Finance.` }),
  'who-cro': () => ({ label: 'Who approves', t: 'Over 35%: the CRO approves directly.' }),
  'cfg-cpq': (_, c) => ({ label: 'What touches this', t: c.cpq === 'failing' ? 'CPQ quote sync: failing for multi-currency deals.' : 'CPQ quote sync: fixed, 40 of 40 synced.' }),
  qe: (_, c) => ({ label: 'In practice', t: `At quarter end, Deal Desk approves in #deal-desk first (${c.qe[0]} of the last ${c.qe[1]}).` }),
  renew: (_, c) => ({ label: 'In practice', t: c.renewal === 'asking' ? 'Flat renewals skip approval, but no rule explains it.' : 'Flat renewals skip approval on purpose: policy since 2023.' }),
}

/** One object pulled into the thread. */
function Obj({ o, c, set, mid }: { o: ChatObj; c: Ctx; set: (mid: number, o: ChatObj, patch: { state?: string; step?: number }) => void; mid: number }) {
  const w = useW()
  if (o.k === 'rule') {
    const r = RULE[o.block](c.fin, c)
    return (
      <div className="cx-o cx-rule">
        <span className="tk">Discount approvals · {r.label}</span>
        <p>{r.t}</p>
        <span className="cx-acts">{w.proof && <button className="wl" onClick={() => w.openTrace(o.block)}>See why</button>}<button className="wl" onClick={() => w.jump(o.block)}>Open on the page</button></span>
      </div>
    )
  }
  const d = DEALS.find((x) => x.name === (o as { deal?: string }).deal)
  if (o.k === 'record' && d) {
    const r = route(d, c.fin), sub = c.submitted.has(d.name)
    return (
      <div className="cx-o cx-rec">
        <div className="cx-rh"><span className="tk"><Icon name="cloud" size={12} />Salesforce · Opportunity</span><span className={'cx-st' + (sub ? ' lock' : '')}>{sub ? <><Icon name="lock" size={12} />Locked for approval</> : 'Open'}</span></div>
        <b>{d.name}</b>
        <dl>
          <div><dt className="tk">Amount</dt><dd className="num">${d.amt.toLocaleString('en-US')}</dd></div>
          <div><dt className="tk">Discount</dt><dd className="num">{d.disc}%</dd></div>
          <div><dt className="tk">Stage</dt><dd>Proposal</dd></div>
          <div><dt className="tk">Owner</dt><dd>{OWNER[d.name]}</dd></div>
        </dl>
        {sub && <p className="cx-wait">Waiting on {them(r.who)} · usually {r.time}</p>}
      </div>
    )
  }
  if (o.k === 'route' && d) {
    const r = route(d, c.fin), steps = ['Rep', 'Asoka', ...r.who, 'Unlocked']
    return (
      <div className="cx-o cx-route" aria-label={`Route: ${steps.join(', then ')}`}>
        <span className="tk">Route under today’s config · {d.disc}% off</span>
        <ol>{steps.map((s, i) => <li key={s} className={i === 1 ? 'ag' : r.who.includes(s) ? 'gate' : ''}>{i === 1 ? <Ag id="approvals" size={16} /> : <i aria-hidden="true" />}<span>{s}</span></li>)}</ol>
      </div>
    )
  }
  if (o.k === 'action' && d) {
    const r = route(d, c.fin)
    const steps = [`Lock ${d.name} for approval`, `Route it to ${them(r.who)}`, `Tell ${them(r.who.slice(0, 1))} in Slack`]
    return (
      <div className={'cx-o cx-act ' + o.state}>
        <span className="tk">Action · Approvals job</span>
        <b>Submit {d.name} for approval</b>
        <ol>{steps.map((s, i) => {
          const done = o.state === 'done' || (o.state === 'running' && i < o.step), now = o.state === 'running' && i === o.step
          return <li key={s} className={done ? 'done' : now ? 'now' : ''}><span className="cx-ck" aria-hidden="true">{done ? <Icon name="check" size={12} /> : now ? <i /> : null}</span>{s}</li>
        })}</ol>
        {o.state === 'ask' && <div className="cx-btns"><button className="btn primary" onClick={() => set(mid, o, { state: 'running', step: 0 })}>Submit</button><button className="btn ghost" onClick={() => set(mid, o, { state: 'cancel' })}>Not now</button></div>}
        {o.state === 'cancel' && <p className="cx-note">Not submitted.</p>}
        {o.state !== 'cancel' && <p className="cx-note">Asoka runs it for {OWNER[d.name]}. Logged in Live activity.</p>}
      </div>
    )
  }
  if (o.k === 'slack' && d) {
    const r = route(d, c.fin), sub = c.submitted.has(d.name)
    const msg = sub ? `${d.name} (${d.disc}% off) is with ${them(r.who)} for approval. Expect an answer in ${r.time}.` : `${d.name} (${d.disc}% off) needs ${them(r.who)} to approve before it can close. I can submit it when you’re ready.`
    return (
      <div className={'cx-o cx-slack ' + o.state}>
        <span className="tk"><Icon name="hash" size={12} />deal-desk</span>
        <p><Ag id="approvals" size={20} /><span><b>Asoka</b>@{OWNER[d.name].split(' ')[0]} {msg}</span></p>
        {o.state === 'draft' && <div className="cx-btns"><button className="btn primary" onClick={() => set(mid, o, { state: 'sent' })}>Post</button><button className="btn ghost" onClick={() => set(mid, o, { state: 'cancel' })}>Not now</button></div>}
        {o.state === 'sent' && <p className="cx-done"><Icon name="circle-check" size={14} />Posted in #deal-desk</p>}
        {o.state === 'cancel' && <p className="cx-note">Not posted.</p>}
      </div>
    )
  }
  if (o.k === 'person') {
    return (
      <div className={'cx-o cx-person ' + o.state}>
        <span className="tk">Ask a person · in Slack</span>
        <p><span className="cx-av" aria-hidden="true"><Icon name="user" size={12} /></span><span><b>Maria Okafor</b>“{o.q}”</span></p>
        {o.state === 'draft' && <div className="cx-btns"><button className="btn primary" onClick={() => set(mid, o, { state: 'sent' })}>Ask Maria</button><button className="btn ghost" onClick={() => set(mid, o, { state: 'cancel' })}>Not now</button></div>}
        {o.state === 'sent' && <p className="cx-done"><Icon name="circle-check" size={14} />Asked. Her answer will appear here and on the page.</p>}
        {o.state === 'cancel' && <p className="cx-note">Not asked.</p>}
      </div>
    )
  }
  return null
}

export function Chat() {
  const w = useW(), [q, setQ] = useState(''), list = useRef<HTMLDivElement>(null), inp = useRef<HTMLTextAreaElement>(null)
  const timers = useRef<number[]>([]), flipped = useRef(new Set<number>())
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)) }
  // Timers write to the store, not to this component, so they safely outlive it (closing the panel mid-reply is fine).

  // The conversation's deal is the last one named; submitted deals come from confirmed actions.
  const submitted = new Set<string>(), named: string[] = []
  w.chat.forEach((m) => { const d = findDeal(m.text); if (d) named.push(d.name); m.objs?.forEach((o) => { if (o.k === 'action' && o.state === 'done') submitted.add(o.deal); if ('deal' in o) named.push(o.deal) }) })
  const deal = DEALS.find((d) => d.name === named[named.length - 1]) || null
  const latest = w.acts.filter((a) => a.kind === 'edit').slice(0, 3).map((a) => (a.ag === 'person' ? a.who + ' ' : 'Asoka ') + a.t.charAt(0).toLowerCase() + a.t.slice(1))
  const c: Ctx = { fin: w.fin, cpq: w.cpq, renewal: w.renewal, qe: w.qe, deal, submitted, latest }

  // Answer the newest question: a typing line from the job that knows, then its reply.
  const last = w.chat[w.chat.length - 1]
  const answered = useRef(new Set<number>())
  useEffect(() => {
    if (!last || last.who !== 'you' || answered.current.has(last.id)) return
    answered.current.add(last.id)
    const r = reply(last.text, c), id = Date.now() + 1
    w.setChat((m) => [...m, { id, who: r.who, text: '', typing: true }])
    later(RM ? 200 : 650 + Math.min(900, r.text.length * 8), () => w.setChat((m) => m.map((x) => (x.id === id ? { ...r, id } : x))))
  }, [last?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the newest message in view.
  useEffect(() => { const el = list.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: RM ? 'auto' : 'smooth' }) }, [w.chat])

  // The hand-off: the question flies from the ask bar into its place in the thread while the panel slides in.
  useLayoutEffect(() => {
    const from = w.chatFrom, m = [...w.chat].reverse().find((x) => x.who === 'you')
    if (!from || !m || flipped.current.has(m.id) || RM) return
    flipped.current.add(m.id)
    const el = document.querySelector<HTMLElement>(`[data-cx="${m.id}"] .cx-you`), rail = el?.closest<HTMLElement>('.rail')
    if (!el || !rail) return
    const tx = new DOMMatrixReadOnly(getComputedStyle(rail).transform).m41, to = el.getBoundingClientRect()
    const g = document.createElement('div'); g.className = 'cx-ghost'; g.textContent = m.text
    Object.assign(g.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' })
    document.body.appendChild(g); el.style.opacity = '0'
    const a = g.animate([{ left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: '24px' },
      { left: to.left - tx + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px', borderRadius: '16px' }], { duration: 480, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' })
    a.onfinish = () => { el.style.opacity = ''; g.remove() }
  }, [w.chat.length]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Update one object in a message; confirming an action runs its steps and the job reports back. */
  const set = (mid: number, o: ChatObj, patch: { state?: string; step?: number }) => {
    const upd = (p: { state?: string; step?: number }) => w.setChat((ms) => ms.map((m) => (m.id !== mid ? m : { ...m, objs: m.objs?.map((x) => (x === o || (x.k === o.k && 'deal' in x && 'deal' in o && x.deal === o.deal) ? { ...x, ...p } as ChatObj : x)) })))
    upd(patch)
    if (o.k === 'action' && patch.state === 'running') {
      const d = DEALS.find((x) => x.name === o.deal)!, r = route(d, w.fin)
      ;[1, 2, 3].forEach((n) => later(n * (RM ? 100 : 750), () => upd(n < 3 ? { step: n } : { state: 'done', step: 3 })))
      later(3 * (RM ? 100 : 750) + 400, () => {
        w.log({ ag: 'approvals', t: `Submitted ${d.name} for approval: ${them(r.who)}`, page: 'discount-approvals', block: r.block, kind: 'edit' })
        w.setChat((ms) => [...ms, { id: Date.now(), who: 'approvals', text: `Submitted. ${them(r.who).charAt(0).toUpperCase() + them(r.who).slice(1)} usually ${r.who.length > 1 ? 'decide' : 'decides'} within ${r.time}. I’ll post the answer in #deal-desk.`, objs: [{ k: 'record', deal: d.name }], next: [`Let ${OWNER[d.name].split(' ')[0]} know in #deal-desk`, 'What’s the status?'] }])
      })
    }
    if (o.k === 'slack' && patch.state === 'sent') w.log({ ag: 'approvals', t: `Posted in #deal-desk about ${o.deal}`, page: 'discount-approvals', kind: 'edit' })
    if (o.k === 'person' && patch.state === 'sent') w.log({ ag: 'approvals', t: `Asked Maria Okafor: “${o.q}”`, page: 'discount-approvals', kind: 'ask' })
  }

  const send = (text = q) => { const s = text.trim(); if (!s) return; w.setChat((m) => [...m, { id: Date.now(), who: 'you', text: s }]); setQ(''); inp.current?.focus() }
  const lastAgent = [...w.chat].reverse().find((m) => m.who !== 'you')
  const next = last && last.who !== 'you' && !last.typing ? lastAgent?.next : undefined
  const empty = !w.chat.length

  return (
    <div className="cx">
      <div className="cx-list" ref={list}>
        {empty && <div className="cx-empty"><b>Ask anything</b><p>Asoka answers from what it knows, shows what each answer rests on, and can act for you once you confirm.</p></div>}
        {w.chat.map((m) => (
          <div key={m.id} data-cx={m.id} className={'cx-m ' + (m.who === 'you' ? 'you' : 'bot')}>
            {m.who === 'you' ? <p className="cx-you">{m.text}</p> : (
              <>
                <span className="cx-who">{m.who === 'none' ? <span className="cx-none" aria-hidden="true"><Icon name="circle-help" size={12} /></span> : <Ag id={m.who as AgentId} size={20} />}<b>{m.who === 'none' ? 'Asoka' : 'Asoka · ' + AG[m.who as AgentId].name}</b></span>
                {m.typing ? <span className="cx-typing" aria-label="Writing"><i /><i /><i /></span> : <>
                  <p className="cx-t">{m.text}</p>
                  {m.objs?.map((o, i) => <div key={i} className="cx-in" style={{ animationDelay: `${120 + i * 90}ms` }}><Obj o={o} c={c} set={set} mid={m.id} /></div>)}
                </>}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="cx-foot">
        {next && <div className="cx-next">{next.map((n) => <button key={n} onClick={() => send(n)}>{n}</button>)}</div>}
        <form className="cx-in-bar" onSubmit={(e) => { e.preventDefault(); send() }}>
          <textarea ref={inp} rows={1} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Ask, or ask Asoka to do something" aria-label="Message the jobs" />
          <button className="om-go" type="submit" aria-label="Send" disabled={!q.trim()}><Icon name="arrow-right" size={16} /></button>
        </form>
        {!empty && <button className="wl cx-new" onClick={() => { w.setChat([]); inp.current?.focus() }}>New chat</button>}
      </div>
    </div>
  )
}
