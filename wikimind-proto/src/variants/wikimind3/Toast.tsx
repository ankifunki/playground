import { useEffect } from 'react'
import { useW } from './store'

export function Toast() {
  const w = useW(), t = w.toast
  useEffect(() => {
    if (!t) return
    const h = window.setTimeout(w.hideToast, t.act ? 6000 : 3200)
    return () => window.clearTimeout(h)
  }, [t?.id])
  return (
    <div id="toast" role="status" aria-live="polite" className={t ? 'on' : ''}>
      {t && <>{t.msg}{t.act && <> <button className="tact" onClick={() => w.runToastAct(t.act!)}>{t.label}</button></>}</>}
    </div>
  )
}
