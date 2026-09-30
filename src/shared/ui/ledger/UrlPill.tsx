import type { LucideIcon } from 'lucide-react'

/** Monospace pill for a public URL or another technical string. */
export function UrlPill({ icon: Icon, className, children }: { icon?: LucideIcon; className?: string; children: string }) {
  return (
    <span className={['url-pill', className].filter(Boolean).join(' ')}>
      {Icon && <Icon />}
      <span>{children}</span>
    </span>
  )
}
