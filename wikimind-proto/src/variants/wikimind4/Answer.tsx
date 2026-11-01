import { AG, Ag, agentsFor } from './agents'
import { Pile } from './Claim'
import { Icon } from './Icon'
import { firstName, initials, whoStr } from './logic'
import { useW, type QA, type View } from './store'

function Unknown({ qa }: { qa: QA }) {
  const w = useW(), c = qa.cand!
  return (
    <>
      <p className="qan">No agent knows that yet, and none will guess.</p>
      {qa.qs === 'offer' && <>
        <div className="qsrc">{whoStr(c)} would know. The <Ag id={c.agent} name /> can ask.</div>
        <div className="qacts"><button className="qbtn pri press" onClick={() => w.commitAsk(qa.id)}>Ask {firstName(c.who)}</button><button className="qbtn press" onClick={() => w.notNow(qa.id)}>Not now</button></div>
      </>}
      {qa.qs === 'asking' && <div className="qsrc qst"><Ag id={c.agent} /> Asking {c.who}. <button className="wl" onClick={() => w.undoAsk(qa.id)}>Undo</button></div>}
      {qa.qs === 'asked' && <div className="qsrc qst"><Ag id={c.agent} /> Asking {whoStr(c)}.</div>}
      {qa.qs === 'dup' && <div className="qsrc qst">The {AG[c.agent].name} agent is already asking {whoStr(c)}.</div>}
      {qa.qs === 'dismissed' && <div className="qsrc">Okay. No agent will ask anyone.</div>}
    </>
  )
}

/** One question, answered in place. Only the visitor sees it, and it can be removed. */
function QaBlock({ qa }: { qa: QA }) {
  const w = useW(), n = qa.n || []
  return (
    <section className="qa" id={'qa-' + qa.id} aria-live="polite" aria-label={'Your question: ' + qa.q}>
      <div className="qah">
        <span className="tk">Only you see this</span>
        <button className="ibtn sm" onClick={() => w.closeQa(qa.id)} aria-label="Remove this answer" title="Remove"><Icon name="x" size={16} /></button>
      </div>
      <p className="qq">{qa.q}</p>
      {qa.files.some((f) => f.kind === 'img') && <div className="qimgs">{qa.files.filter((f) => f.kind === 'img').map((f, i) => <img key={i} src={f.url} alt={f.name} />)}</div>}
      {!qa.t && !qa.unknown && <span className="dots3" aria-label="The agents are thinking"><i /><i /><i /></span>}
      {qa.unknown && <Unknown qa={qa} />}
      {qa.t && !qa.unknown && <>
        <p className="qan">{qa.t}</p>
        {qa.note && <div className="qnote">{qa.note}</div>}
        <div className="qsrc qfoot">
          {qa.pending ? 'Checking its sources…' : n.length > 0 && <>
            <span className="agby">{agentsFor(n).map((a) => <Ag key={a.id} id={a.id} name />)}</span>
            <Pile ns={n} />
            <button className="wl" onClick={() => w.showClaims(n)}>Show on page</button>
          </>}
        </div>
      </>}
      {qa.reply && (
        <div className="qrep">
          <span className="av h">{initials(qa.reply.who)}</span>
          <div>
            <div className="rwho">{qa.reply.who} answered<small>Just now</small></div>
            <p>{qa.reply.ans}</p>
          </div>
        </div>
      )}
    </section>
  )
}

/** Where answers land: each section of the page, and a slot under the Home hero. */
export function QaSlot({ where, sec }: { where: View; sec: string }) {
  const w = useW()
  const list = w.qas.filter((q) => q.where === where && q.sec === sec)
  return list.length ? <div className="qaslot">{list.map((q) => <QaBlock key={q.id} qa={q} />)}</div> : null
}
