import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute left-1/3 top-0 size-[500px] rounded-full bg-chart-1 opacity-[0.05] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 size-80 rounded-full bg-accent opacity-[0.06] blur-3xl" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-accent">
            <span className="font-display text-sm font-bold text-white">CP</span>
          </span>
          <span className="font-display text-xl font-bold tracking-widest text-foreground">
            CREATOR
          </span>
        </div>

        {children}
      </div>
    </div>
  )
}
