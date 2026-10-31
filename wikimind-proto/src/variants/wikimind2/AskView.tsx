import { useEffect, useState } from 'react'
import { CLAIMS, cl, proc, SUG } from './data'
import { Arrow, Chev, ClaimRow, MiniMap } from './parts'
import { useW } from './store'

const OWN: [string, string, string, 'chg' | 'chk', string][] = [
  ['c2', 'Over 35% now goes to the CRO', 'Opportunity approvals. It was 40% until Oct 28.', 'chg', 'Changed'],
  ['c7', 'Flat renewals skip approval', 'Opportunity approvals. Asoka is asking why.', 'chk', 'Check this'],
  ['cpqsync2', 'Multi-currency quotes are failing to sync', 'CPQ quote sync. Approvals depend on it.', 'chk', 'Check this'],
]

/** Ask-first front door: the question box leads, the map and what changed follow. */
export function AskView() {
  const w = useW(), a = w.ans
  const [text, setText] = useState(w.q)
  useEffect(() => setText(w.q), [w.q])
  const rows = a && !a.unknown ? (a.local ? a.ids.slice(1) : a.ids) : []
  const op = a?.open ? proc(a.open) : undefined
  return (
    <>
      <section className="door">
        <h1>Ask anything about how Northwind works.</h1>
        <div className="qbox">
          <input id="qin" type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); w.doAsk(text) } }} placeholder="Who approves a big discount?" aria-label="Ask Wikimind" />
          <button className="qgo press" onClick={() => w.doAsk(text)} aria-label="Ask"><Arrow /></button>
        </div>
        {!a && <div className="sugs">{SUG.map((s) => <button key={s} className="sug press" onClick={() => w.doAsk(s)}>{s}</button>)}</div>}
      </section>
      {a && (
        <section key={w.q + '|' + a.src} className={'ans' + (a.up ? ' up' : '')}>
          {a.unknown && !a.pending && <><p className="lead">I don’t know that yet, and I won’t guess.</p><p className="note">I’ve added it to my open questions and will ask the person most likely to know. The answer will show up here.</p></>}
          {a.unknown && a.pending && <div className="thinking"><i /><i /><i />Checking everything Asoka knows <button className="stopb" onClick={w.stopAsk}>Stop</button></div>}
          {!a.unknown && <>
            <p className="lead" onClick={a.local ? () => w.openClaim(a.ids[0]) : undefined} style={a.local ? { cursor: 'pointer' } : undefined}>{a.lead}</p>
            {a.note && <p className="note">{a.note}</p>}
            {a.pending ? <div className="thinking"><i /><i /><i />Asoka is checking all {CLAIMS.length} things it knows <button className="stopb" onClick={w.stopAsk}>Stop</button></div>
              : a.src === 'asoka' && <p className="srcline"><b>Answered by Asoka</b> from {CLAIMS.length} things it knows, citing {a.ids.length}.</p>}
            {a.local && rows.length > 0 && <p className="srcline">Related</p>}
            {rows.map((id) => <ClaimRow key={id} c={cl(id)!} />)}
            {op && <button className="openb press" onClick={() => (a.blast ? w.openBlast(op.id) : w.openProc(op.id))}><span>{a.blast ? 'See what breaks' : 'See the whole picture: ' + op.n}</span><Chev inherit /></button>}
          </>}
          <div className="sugs" style={{ marginTop: 16 }}>{SUG.filter((s) => s !== w.q).slice(0, 3).map((s) => <button key={s} className="sug press" onClick={() => w.doAsk(s)}>{s}</button>)}</div>
        </section>
      )}
      <div className="sec-h">Or find your way around</div>
      <button className="card mapcard press" onClick={() => w.goMap(0)}><MiniMap size={76} /><span><b>Explore the map</b><span>Everything Asoka knows about Northwind, in one space you can zoom into.</span></span></button>
      <div className="sec-h">Changed in what you own</div>
      {OWN.map(([id, t, s, cls, tag]) => <button key={id} className="own press" onClick={() => w.openClaim(id)}><span className="x1"><b>{t}</b><small>{s}</small></span><span className={'tag ' + cls}>{tag}</span></button>)}
      {w.asked.length > 0 && <>
        <div className="sec-h">You asked, Asoka is finding out</div>
        {w.asked.map((x) => <div key={x} className="unk"><span className="x1">{x}<small>Asoka will ask the person most likely to know</small></span><span className="tag chk">Asking</span></div>)}
      </>}
    </>
  )
}
