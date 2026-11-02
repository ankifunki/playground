import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { fileKind, fsize } from './logic'
import { useW } from './store'

const PAGE_SUGG = ['Who approves a 30% discount?', 'What happens at quarter end?', 'Who can change an approved deal?']
const HOME_SUGG = ['What changed this week?', 'Who approves a 30% discount?', 'What are the agents unsure about?']

/** The persistent ask bar: suggestion chips, attachments, voice, send. */
export function Dock() {
  const w = useW()
  const dock = useRef<HTMLDivElement>(null), chipsEl = useRef<HTMLDivElement>(null), file = useRef<HTMLInputElement>(null), input = useRef<HTMLInputElement>(null)
  const [lean, setLean] = useState(false)
  // Small "Ask anything" pill while reading; the full composer at the top of the page or once you click into it.
  const [mini, setMini] = useState(false)
  const busy = !!w.text || w.files.length > 0 || w.listening
  const [ovf, setOvf] = useState(false)
  const onPage = w.view === 'page'
  const asked = w.qas.map((m) => m.q)
  const sugg = (onPage ? PAGE_SUGG : HOME_SUGG).filter((x) => !asked.includes(x)).slice(0, w.qas.length ? 1 : onPage ? 2 : 3)

  // Publish the bar's height so the page and the chat panel can make room for it.
  useLayoutEffect(() => {
    const el = dock.current; if (!el) return
    const set = () => document.documentElement.style.setProperty('--dockh', el.offsetHeight + 'px')
    set(); const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect()
  }, [])
  useLayoutEffect(() => { const c = chipsEl.current; if (c) setOvf(c.scrollWidth > c.clientWidth + 2) })
  // While reading, the bar shrinks to a pill and the chips step aside. It only grows back when you ask for it.
  const busyR = useRef(busy); busyR.current = busy
  useEffect(() => {
    const onScroll = () => {
      const y = scrollY, focused = document.activeElement === input.current
      if (focused || busyR.current) { setLean(false); setMini(false); return }
      setLean(y > 160); setMini(y > 160)
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true }); return () => removeEventListener('scroll', onScroll)
  }, [w.view])
  useEffect(() => { if (busy) { setMini(false); setLean(false) } }, [busy])
  // On the page, the bar lines up with the text column; on Home it stays centred on the content.
  useLayoutEffect(() => {
    const el = dock.current; if (!el) return
    const place = () => {
      const col = w.view === 'page' ? document.querySelector('.art-body') : null
      if (col && innerWidth > 640) { const r = col.getBoundingClientRect(); el.style.setProperty('--dl', r.left - 12 + 'px'); el.style.setProperty('--dwid', r.width + 'px') }
      else { el.style.removeProperty('--dl'); el.style.removeProperty('--dwid') }
    }
    place(); const t = window.setTimeout(place, 300)
    addEventListener('resize', place); return () => { window.clearTimeout(t); removeEventListener('resize', place) }
  }, [w.view])
  const grow = () => { setMini(false); setLean(false); input.current?.focus() }

  const placeholder = w.listening ? 'Listening…' : w.files.length ? (w.files.length === 1 ? 'Ask about this file' : 'Ask about these files') : onPage ? 'Ask about this page, or anything' : 'Ask anything about Northwind'
  return (
    <div id="dock" ref={dock} className={(lean ? 'lean' : '') + (mini ? ' mini' : '')}>
      <div className="dw">
        <div className={'dchips' + (ovf ? ' ovf' : '')} id="dchips" ref={chipsEl}>
          {w.learned && !w.learnSeen && <button className="dchip news" onClick={w.showRenewal}><span className="pdot" />Maria answered: flat renewals</button>}
          {sugg.map((s) => <button key={s} className="dchip" onClick={() => w.ask(s)}>{s}</button>)}
        </div>
        <div className={'composer' + (w.listening ? ' listening' : '')} id="composer" onClick={() => mini && grow()}>
          <div className="datt">{w.files.map((f, i) => (
            <span className="att" key={i}>
              {f.kind === 'img' ? <img src={f.url} alt="" /> : <span className="fi">{({ sheet: 'CSV', doc: 'DOC', file: 'FILE' } as const)[f.kind as 'sheet' | 'doc' | 'file']}</span>}
              <span><span className="an">{f.name}</span><small>{fsize(f.size)}</small></span>
              <button onClick={() => w.removeFile(i)} aria-label={`Remove ${f.name}`} title="Remove"><Icon name="x" size={14} /></button>
            </span>
          ))}</div>
          <div className="crow2">
            <span className="dmini" aria-hidden="true"><Icon name="message-circle" size={16} /></span>
            <button className="cbtn" data-act="attach" aria-label="Add attachment" onClick={() => file.current?.click()}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
            <input id="cin" ref={input} type="text" placeholder={mini ? 'Ask anything' : placeholder} aria-label="Ask the agents" autoComplete="off" value={w.text}
              onChange={(e) => w.setText(e.target.value)} onFocus={() => { setLean(false); setMini(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); w.send() } }} />
            <span className="wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
            <button className={'cbtn mic' + (w.listening ? ' on' : '')} id="mic" onClick={w.toggleMic} aria-label={w.listening ? 'Stop listening' : 'Speak your question'}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></button>
            <button className="cbtn send" onClick={w.send} aria-label="Send"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></button>
          </div>
        </div>
        <input type="file" ref={file} multiple accept="image/*,.pdf,.csv,.xlsx,.xls,.doc,.docx,.txt" hidden onChange={(e) => { w.addFiles(e.target.files, fileKind); e.target.value = ''; input.current?.focus() }} />
      </div>
    </div>
  )
}
