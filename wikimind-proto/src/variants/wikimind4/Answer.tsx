import { Icon } from './Icon'
import { firstName, initials, whoStr } from './logic'
import { useW, type QA, type View } from './store'

function Unknown({ qa }: { qa: QA }) {
  const w = useW(), c = qa.cand!
  return (
    <>
      <p className="qan">I don’t know that yet, and I won’t guess.</p>
      {qa.qs === 'offer' && <>
        <div className="qsrc">{whoStr(c)} would know.</div>
        <div className="qacts"><button className="qbtn pri press" onClick={() => w.commitAsk(qa.id)}>Ask {firstName(c.who)}</button><button className="qbtn press" onClick={() => w.notNow(qa.id)}>Not now</button></div>
      </>}
      {qa.qs === 'asking' && <div className="qsrc qst">Asking {c.who}. <button className="wl" onClick={() => w.undoAsk(qa.id)}>Undo</button></div>}
      {qa.qs === 'asked' && <div className="qsrc qst">Asking {whoStr(c)}. Their answer will appear right here.</div>}
      {qa.qs === 'dup' && <div className="qsrc qst">Asoka is already asking {whoStr(c)}.</div>}
      {qa.qs === 'dismissed' && <div className="qsrc">Okay. I won’t ask anyone.</div>}
    </>
  )
}

/** One question, answered in place. Only the visitor sees it, and it can be removed. */
function QaBlock({ qa }: { qa: QA }) {
  const w = useW(), n = qa.n || []
  return (
    <section className="qa" id={'qa-' + qa.id} aria-live="polite" aria-label={'Your question: ' + qa.q}>
      <div className="qah">
        <span className="tk">You asked{qa.files.length ? `, with ${qa.files.length === 1 ? 'a file' : qa.files.length + ' files'}` : ''}. Only you see this</span>
        <button className="ibtn sm" onClick={() => w.closeQa(qa.id)} aria-label="Remove this answer" title="Remove"><Icon name="x" size={16} /></button>
      </div>
      <p className="qq">{qa.q}</p>
      {qa.files.some((f) => f.kind === 'img') && <div className="qimgs">{qa.files.filter((f) => f.kind === 'img').map((f, i) => <img key={i} src={f.url} alt={f.name} />)}</div>}
      {!qa.t && !qa.unknown && <span className="dots3" aria-label="Asoka is thinking"><i /><i /><i /></span>}
      {qa.unknown && <Unknown qa={qa} />}
      {qa.t && !qa.unknown && <>
        <p className="qan">{qa.t}</p>
        {qa.note && <div className="qnote">{qa.note}</div>}
        <div className="qsrc">
          {qa.pending ? 'Checking all of its sources…' : n.length > 0 && <>
            {qa.src === 'asoka' ? 'Answered by Asoka from ' : 'From '}{n.length === 1 ? 'one sentence' : n.length + ' sentences'} {qa.where === 'page' ? 'on this page' : 'in Opportunity approvals'}.{' '}
            <button className="wl" onClick={() => w.showClaims(n)}>{qa.where === 'page' ? 'Show them' : 'Open them'}</button>
          </>}
        </div>
      </>}
      {qa.reply && (
        <div className="qrep">
          <span className="av h">{initials(qa.reply.who)}</span>
          <div>
            <div className="rwho">{qa.reply.who} answered<small>Just now</small></div>
            <p>{qa.reply.ans}</p>
            <div className="qsrc">Asoka added this to what it knows and will answer it directly from now on.</div>
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
