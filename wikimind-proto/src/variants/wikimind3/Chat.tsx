import { useLayoutEffect, useRef } from 'react'
import { Icon } from './Icon'
import { firstName, initials, whoStr } from './logic'
import { AG, Ag, agentsFor } from './agents'
import { Rf } from './Rf'
import { useW, type AMsg, type Msg } from './store'

function Unknown({ m }: { m: AMsg }) {
  const w = useW(), c = m.cand!
  const onTalk = w.view === 'page' && w.tab === 'talk'
  return (
    <>
      <p>No agent knows that yet, and none will guess.</p>
      {m.qs === 'offer' && <>
        <div className="src">{whoStr(c)} would know. The <Ag id={c.agent} name /> can ask.</div>
        <div className="qacts"><button className="qbtn pri press" onClick={() => w.commitAsk(m.id)}>Ask {firstName(c.who)}</button><button className="qbtn press" onClick={() => w.notNow(m.id)}>Not now</button></div>
      </>}
      {m.qs === 'asking' && <div className="src qst">Asking {c.who}. <button className="wl" onClick={() => w.undoAsk(m.id)}>Undo</button></div>}
      {m.qs === 'asked' && <div className="src qst">Asking {whoStr(c)}.{c.page && !onTalk && <> <button className="wl" onClick={() => w.pickTab('talk')}>See it in Questions</button></>}</div>}
      {m.qs === 'dup' && <div className="src qst">The {AG[c.agent].name} agent is already asking {whoStr(c)}.</div>}
      {m.qs === 'answered' && <div className="src">{c.who} answered. See below.</div>}
      {m.qs === 'dismissed' && <div className="src">Okay. I won’t ask anyone.</div>}
    </>
  )
}

function Bubble({ m }: { m: Msg }) {
  const w = useW()
  if (m.role === 'r') return (
    <div className="ba res"><span className="av h">{initials(m.who)}</span><div>
      <div className="rwho">{m.who} answered your question<small>Just now</small></div>
      <div className="rq">“{m.q}”</div><p>{m.ans}</p>
    </div></div>
  )
  if (m.role === 'u') return (
    <div className="bu">
      {m.files.length > 0 && <div className="atts">{m.files.map((f, i) => (f.kind === 'img' ? <img key={i} src={f.url} alt={f.name} /> : <span key={i}>{f.name}</span>))}</div>}
      {m.t}
    </div>
  )
  return (
    <div className="ba" data-mi={m.id}><span className="avag">{m.unknown && m.cand ? <Ag id={m.cand.agent} size={28} /> : <Ag id={m.n && m.n.length ? agentsFor(m.n)[0].id : 'approvals'} size={28} />}</span><div>
      {!m.t && !m.unknown && <span className="dots3" aria-label="The agents are thinking"><i /><i /><i /></span>}
      {m.unknown && <Unknown m={m} />}
      {m.t && !m.unknown && <>
        <p>{m.t}{m.n && m.n.length > 0 && <Rf ns={m.n} />}</p>
        {m.note && <div className="note">{m.note}</div>}
        <div className="src">{m.pending ? 'Checking its sources…' : m.n && m.n.length > 0 && <button className="wl" onClick={() => w.showSrc(m.n![0])}>Show on page</button>}</div>
      </>}
    </div></div>
  )
}

export function Chat() {
  const w = useW(), list = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight }, [w.msgs, w.chatOpen])
  return (
    <div className={'chat' + (w.chatOpen && w.msgs.length ? ' open' : '')} id="chat" aria-live="polite">
      {w.msgs.length > 0 && (
        <div className="cw">
          <div className="chd"><span className="pdot" />Agents<span className="sp2" />
            <button className="ibtn" onClick={w.newChat} aria-label="New conversation" title="New conversation"><Icon name="square-pen" /></button>
            <button className="ibtn" onClick={w.hideChat} aria-label="Hide conversation" title="Hide"><Icon name="chevron-down" size={20} /></button>
          </div>
          <div className="cms" id="cms" ref={list}>{w.msgs.map((m) => <Bubble key={m.id} m={m} />)}</div>
        </div>
      )}
    </div>
  )
}
