import type React from 'react'
import { KIND, refFor, type RefKind } from './data'
import { Icon, type IconName } from './Icon'

export const KICON: Record<RefKind, IconName> = { doc: 'file-text', sf: 'cloud', jira: 'ticket', slack: 'hash', meet: 'video', watch: 'eye', talk: 'message-circle' }
/** Feed kinds on Home, in the same icon language as sources. */
export const FICON: Record<string, IconName> = { Slack: 'hash', Salesforce: 'cloud', Jira: 'ticket', Meeting: 'video', Watched: 'eye', Integration: 'plug', Verified: 'badge-check' }

/** A single source-kind tile. Verified sources carry a green dot; uncertain ones a warm tint. */
export function Tile({ icon, label, ok, warn }: { icon: IconName; label: string; ok?: boolean; warn?: boolean }) {
  return <span className={'pt' + (ok ? ' v' : '') + (warn ? ' w' : '')} title={label}><Icon name={icon} size={14} /></span>
}

export const pileLabel = (ns: number[]) => {
  const refs = ns.map(refFor).filter(Boolean)
  return (refs.length === 1 ? 'Source: ' : `Sources (${refs.length}): `) + refs.map((r) => `${KIND[r.k]}, ${r.src}${r.v ? ', verified' : r.check ? ', ' + r.check.toLowerCase() : ''}`).join('; ')
}

/** Sources as an overlapping pile of icons instead of names or numbers. The full list is in the label. */
export function Pile({ ns, max = 5, label = true }: { ns: number[]; max?: number; label?: boolean }) {
  const refs = ns.map(refFor).filter(Boolean)
  return (
    <span className="pile" {...(label ? { role: 'img', 'aria-label': pileLabel(ns), title: pileLabel(ns) } : { 'aria-hidden': true })}>
      {refs.slice(0, max).map((r, i) => <span key={i} className={'pt' + (r.v ? ' v' : '') + (r.check ? ' w' : '')} style={{ '--i': i } as React.CSSProperties}><Icon name={KICON[r.k]} size={14} /></span>)}
      {refs.length > max && <span className="pt more" style={{ '--i': max } as React.CSSProperties}>+{refs.length - max}</span>}
    </span>
  )
}
