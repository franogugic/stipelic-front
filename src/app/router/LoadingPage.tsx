import { Loader2 } from 'lucide-react'

export function LoadingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-5">
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-10 place-items-center rounded-xl bg-neutral-950 text-white">
          <span className="text-sm font-bold">CP</span>
        </span>
        <Loader2 className="animate-spin text-neutral-400" size={20} />
      </div>
    </main>
  )
}
