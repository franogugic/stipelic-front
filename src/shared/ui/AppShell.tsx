import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import type { NavSection } from './Sidebar'

type AppShellProps = {
  slug: string
  activeSection: NavSection
  children: ReactNode
}

export function AppShell({ slug, activeSection, children }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen ">
      {/* Subtle grid texture */}
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-[0.04]" />

      <Sidebar slug={slug} activeSection={activeSection} />

      {/* Main content */}
      <div className="relative z-10  flex min-h-screen flex-1 flex-col">
        {children}
      </div>
    </div>
  )
}
