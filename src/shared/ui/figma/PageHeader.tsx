import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-start justify-between mb-8 ${className}`}>
      <div>
        <h1 className="font-bold leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem' }}>
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
