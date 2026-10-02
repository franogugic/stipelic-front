import { ArrowRight, RefreshCw, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/** Stripe's cancel URL (old design; the success URL has its own page). Rebuilt in Screen 10. */
export function PaymentStatusPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-950">
            <span className="text-xs font-black text-white">CP</span>
          </span>
          <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="grid size-16 place-items-center rounded-2xl bg-neutral-100">
            <XCircle className="text-neutral-500" size={28} strokeWidth={1.8} />
          </div>
          <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
            Payment cancelled
          </h1>
          <p className="mt-2.5 text-sm leading-6 text-neutral-500">
            Checkout was cancelled. Your workspace exists but isn't active yet. Complete
            payment from your workspace whenever you're ready.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
              type="button"
              onClick={() => navigate('/', { replace: true })}
            >
              Back to workspace
              <ArrowRight size={16} />
            </button>
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              type="button"
              onClick={() => navigate('/', { replace: true })}
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
