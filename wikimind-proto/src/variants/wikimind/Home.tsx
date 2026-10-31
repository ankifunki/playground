import type React from 'react'
import { CL } from './data'
import { DOTS, RM } from './logic'
import { useW } from './store'

const LINKS: [number, number][] = [[0, 1], [1, 2], [0, 3], [1, 4], [4, 5], [0, 4], [3, 4], [2, 5], [0, 5]]

/** 1,284 pages as a slowly drifting constellation. Tap an area to list what's inside. */
function Constellation() {
  const w = useW()
  return (
    <svg viewBox="0 6 420 284" role="img" aria-label="Map of 1,284 knowledge pages in six areas. Recently changed pages glow.">
      {LINKS.map(([a, b]) => <line key={a + '-' + b} x1={CL[a].x} y1={CL[a].y} x2={CL[b].x} y2={CL[b].y} stroke="var(--line)" strokeWidth={1} />)}
      {CL.map((c, ci) => {
        const R = Math.sqrt(Math.round(c.p / 10)) * 5.6
        const vars = { '--d': (9 + ci * 1.7).toFixed(1) + 's', '--dx': ((ci % 2 ? 1 : -1) * (2 + (ci % 3))).toFixed(0) + 'px', '--dy': ((ci % 3 ? 1 : -1) * 2).toFixed(0) + 'px' } as React.CSSProperties
        return (
          <g key={c.n}>
            <g className="clg" id={'cl' + ci} style={vars}>{DOTS[ci].map((p, i) => <circle key={i} className={'dot' + (p.f ? ' fr' : '')} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={p.s.toFixed(1)} />)}</g>
            <g className="clhit" style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={c.n} onClick={() => w.setCluster(w.cluster === ci ? null : ci)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); w.setCluster(w.cluster === ci ? null : ci) } }}>
              <circle cx={c.x} cy={c.y} r={(R + 10).toFixed(0)} fill="transparent" />
              <text className="cll" x={c.x} y={(c.y + R * 0.8 + 18).toFixed(0)} textAnchor="middle">{c.n}</text>
              <text className="cln" x={c.x} y={(c.y + R * 0.8 + 32).toFixed(0)} textAnchor="middle">{c.p} pages</text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}

const COV: [string, number, number][] = [['Sales Cloud', 96, 78], ['CPQ', 88, 64], ['Policies', 83, 72], ['Service Cloud', 74, 51], ['Integrations', 61, 40]]

export function Home() {
  const w = useW()
  const dt = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const oq = w.asking.filter((a) => !a.done).length + 7
  const toAsking = () => document.getElementById('asking')?.parentElement?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' })
  return (
    <>
      <div className="date">{dt}</div>
      <h1 className="hero-h">Everything Asoka knows about Northwind, and how it knows it.</h1>
      <div className="stats" role="list">
        <div className="stat" role="listitem"><span className="sl">Pages</span><b>1,284</b><span className="sd">+12 today</span></div>
        <div className="stat" role="listitem"><span className="sl">Observations</span><b id="obs">{w.obs.toLocaleString()}</b><span className="sd sdl"><span className="pdot" />This week, live</span></div>
        <div className="stat" role="listitem"><span className="sl">Verified</span><b>71%</b><span className="sd">Checked by a person</span><span className="sbar" aria-hidden="true"><i style={{ width: '71%' }} /></span></div>
        <button className="stat sbtn" role="listitem" onClick={toAsking}><span className="sl">Open questions</span><b>{oq}</b><span className="sd">Asoka is asking ›</span></button>
      </div>
      <div className="hgrid">
        <div>
          <div className="card const">
            <div className="ch"><span className="pdot" />Asoka’s knowledge, live</div>
            <Constellation />
            <div className="cap"><span><i style={{ background: 'var(--ink2)', opacity: 0.5 }} />A page</span><span><i style={{ background: 'var(--accent)' }} />Changed today</span><span>Tap an area to look inside.</span></div>
            {w.cluster !== null && <div className="clist"><div className="h">{CL[w.cluster].n}</div>{CL[w.cluster].pages.map(([name, link]) => <button key={name} className="lrow" onClick={() => (link ? w.go('page') : w.stub())}><span>{name}</span><small>{link ? 'Updated today' : 'Open'}</small></button>)}</div>}
          </div>
          <div className="card lead" style={{ marginTop: 18 }}><button className="story" onClick={() => w.go('page', { mode: 'change' })}><div className="kk">Changed this week</div><h2>Discounts over 35% now go straight to the CRO</h2><p>The threshold dropped from 40%. Asoka saw the Salesforce change, matched it to a Jira ticket and a Deal Desk thread, and updated four pages.</p><div className="prov"><span className="ok">✓ Verified by Dana Ruiz</span><span>Built from 3 sources</span></div></button></div>
          <div className="card" style={{ marginTop: 18 }}><div className="more">
            <button className="story" onClick={() => w.go('page')}><div className="kk">Unwritten rule, now written</div><h3>How quarter-end approvals really work</h3><div className="prov">From 9 Slack threads and a meeting</div></button>
            <button className="story" onClick={w.stub}><div className="kk">System health</div><h3>CPQ quote sync is failing for multi-currency deals</h3><div className="prov">Seen since Oct 29</div></button>
            <button className="story" onClick={w.stub}><div className="kk">People</div><h3>Priya Shah now leads Deal Desk</h3><div className="prov">From the org chart and Slack</div></button>
          </div></div>
        </div>
        <div>
          <div className="card"><div className="ch"><span className="pdot" />Learning right now</div>
            <ul className="tick" id="tick">{w.ticks.map((x, i) => <li key={x.t + x.ago} className={w.tickFresh && i === 0 ? 'new' : ''}><span className="k">{x.k}</span><span>{x.t}<br /><small style={{ color: 'var(--ink2)', fontSize: 12.5 }}>{x.ago === 0 ? 'Just now' : x.ago + ' min ago'}</small></span></li>)}</ul></div>
          <div className="card" style={{ marginTop: 18 }}><div className="ch">Asoka is asking</div>
            <div id="asking">{w.asking.map((a, i) => <div className="ask" key={i}><div className="q">{a.q}</div><div className="who">{a.who}, {a.when}. <span className={'st' + (a.done ? ' done' : '')}>{a.done ? 'Answered' : 'Waiting'}</span></div></div>)}</div>
            <div className="who" style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 8 }}>When something doesn’t add up, Asoka asks the person who’d know.</div></div>
          <div className="card" style={{ marginTop: 18 }}><div className="ch">Most cited this week</div>
            <button className="lrow" onClick={() => w.go('page', { mode: 'cite' })}><span>Approval requests expire after 14 days</span><small>23 times</small></button>
            <button className="lrow" onClick={w.stub}><span>Discount policy</span><small>17 times</small></button>
            <button className="lrow" onClick={w.stub}><span>Quarter-end close</span><small>11 times</small></button>
            <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 8 }}>Pages Asoka linked when it explained a decision to someone.</div></div>
          <div className="card" style={{ marginTop: 18 }}><div className="ch">How complete is this?</div>
            <div className="cov">{COV.map(([n, a, b]) => <span key={n} style={{ display: 'contents' }}><span>{n}</span><span className="bar"><i style={{ width: a + '%', background: 'var(--corb)' }} /><i style={{ width: b + '%', background: 'var(--ver)' }} /></span><span className="n">{a}%</span></span>)}</div>
            <div className="cap"><span><i style={{ background: 'var(--ver)' }} />Verified</span><span><i style={{ background: 'var(--corb)' }} />Seen in practice</span></div>
            <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 6 }}>Gaps are shown, not hidden. Asoka is closing them.</div></div>
        </div>
      </div>
    </>
  )
}
