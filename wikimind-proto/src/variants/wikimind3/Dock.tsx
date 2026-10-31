import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { fileKind, firstName, fsize } from './logic'
import { useW } from './store'

const PAGE_SUGG = ['Who approves a 30% discount?', 'What happens at quarter end?', 'Do flat renewals need approval?']
const HOME_SUGG = ['What did Asoka learn this week?', 'Who approves a 30% discount?', 'What is Asoka unsure about?']

/** The persistent ask bar: suggestion chips, attachments, voice, send. */
export function Dock() {
  const w = useW()
  const dock = useRef<HTMLDivElement>(null), chipsEl = useRef<HTMLDivElement>(null), file = useRef<HTMLInputElement>(null), input = useRef<HTMLInputElement>(null)
  const [lean, setLean] = useState(false)
  const [ovf, setOvf] = useState(false)
  const onPage = w.view === 'page'
  const asked = w.msgs.filter((m) => m.role === 'u').map((m) => (m as { t: string }).t)
  const sugg = (onPage ? PAGE_SUGG : HOME_SUGG).filter((x) => !asked.includes(x)).slice(0, w.msgs.length ? 1 : onPage ? 2 : 3)
  const userCount = w.msgs.filter((m) => m.role === 'u').length

  // Publish the bar's height so the page and the chat panel can make room for it.
  useLayoutEffect(() => {
    const el = dock.current; if (!el) return
    const set = () => document.documentElement.style.setProperty('--dockh', el.offsetHeight + 'px')
    set(); const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect()
  }, [])
  useLayoutEffect(() => { const c = chipsEl.current; if (c) setOvf(c.scrollWidth > c.clientWidth + 2) })
  // Chips step aside while reading down the page and come back on the way up.
  useEffect(() => {
    let lastY = scrollY
    const onScroll = () => {
      const y = scrollY
      if (w.chatOpen || document.activeElement === input.current) setLean(false)
      else if (y > 160 && y > lastY + 6) setLean(true)
      else if (y < lastY - 6 || y <= 160) setLean(false)
      if (Math.abs(y - lastY) > 6) lastY = y
    }
    addEventListener('scroll', onScroll, { passive: true }); return () => removeEventListener('scroll', onScroll)
  }, [w.chatOpen])

  const placeholder = w.listening ? 'Listening…' : w.files.length ? (w.files.length === 1 ? 'Ask about this file' : 'Ask about these files') : onPage ? 'Ask about this page, or anything' : 'Ask anything about Northwind'
  return (
    <div id="dock" ref={dock} className={lean ? 'lean' : ''}>
      <div className="dw">
        <div className={'dchips' + (ovf ? ' ovf' : '')} id="dchips" ref={chipsEl}>
          {w.learned && !w.learnSeen && <button className="dchip news" onClick={w.showRenewal}><span className="pdot" />Maria answered: flat renewals</button>}
          {w.newQs.filter((x) => x.resolved && x.unseen).map((x) => <button key={x.id} className="dchip news" onClick={w.showChat}><span className="pdot" />{firstName(x.who)} answered your question</button>)}
          {w.msgs.length > 0 && !w.chatOpen && <button className="dchip conv" onClick={w.showChat}>Conversation ({userCount})</button>}
          {sugg.map((s) => <button key={s} className="dchip" onClick={() => w.ask(s)}>{s}</button>)}
        </div>
        <div className={'composer' + (w.listening ? ' listening' : '')} id="composer">
          <div className="datt">{w.files.map((f, i) => (
            <span className="att" key={i}>
              {f.kind === 'img' ? <img src={f.url} alt="" /> : <span className="fi">{({ sheet: 'CSV', doc: 'DOC', file: 'FILE' } as const)[f.kind as 'sheet' | 'doc' | 'file']}</span>}
              <span><span className="an">{f.name}</span><small>{fsize(f.size)}</small></span>
              <button onClick={() => w.removeFile(i)} aria-label={`Remove ${f.name}`} title="Remove"><Icon name="x" size={14} /></button>
            </span>
          ))}</div>
          <div className="crow2">
            <button className="cbtn" data-act="attach" aria-label="Add attachment" onClick={() => file.current?.click()}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
            <input id="cin" ref={input} type="text" placeholder={placeholder} aria-label="Ask Asoka" autoComplete="off" value={w.text}
              onChange={(e) => w.setText(e.target.value)} onFocus={() => setLean(false)}
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
