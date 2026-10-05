import { type ReactNode, useRef } from 'react'

export function ReportActionMenu({ name, children }: { name: string; children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null)
  return <details ref={menu} className="report-action-menu" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false }} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); menu.current!.open = false; menu.current?.querySelector('summary')?.focus() } }}>
    <summary aria-label={`More actions for ${name}`} title="More actions">•••</summary>
    <div className="report-action-menu__items" onClick={(event) => { if ((event.target as HTMLElement).closest('button') && menu.current) menu.current.open = false }}>{children}</div>
  </details>
}
