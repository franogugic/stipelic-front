import { ArrowRight, CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreatorStore } from '../model/creator-store'

type PaymentStatusPageProps = {
  status: 'success' | 'cancel'
}

export function PaymentStatusPage({ status }: PaymentStatusPageProps) {
  const navigate = useNavigate()
  const isSuccess = status === 'success'
  const hasStartedPolling = useRef(false)

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const pollActivationStatus = useCreatorStore((s) => s.pollActivationStatus)
  const pollCreatorActivation = useCreatorStore((s) => s.pollCreatorActivation)
  const resetPollActivation = useCreatorStore((s) => s.resetPollActivation)

  const isPolling = pollActivationStatus === 'polling'
  const isActivated = pollActivationStatus === 'activated'
  const isTimeout = pollActivationStatus === 'timeout'

  useEffect(() => {
    if (!isSuccess || hasStartedPolling.current) return
    hasStartedPolling.current = true
    resetPollActivation()
    void pollCreatorActivation()
  }, [isSuccess, pollCreatorActivation, resetPollActivation])

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
          {isSuccess ? (
            <>
              {/* Polling */}
              {isPolling ? (
                <>
                  <div className="grid size-16 place-items-center rounded-2xl bg-neutral-100">
                    <Loader2 className="animate-spin text-neutral-600" size={28} strokeWidth={1.8} />
                  </div>
                  <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
                    Activating workspace
                  </h1>
                  <p className="mt-2.5 text-sm leading-6 text-neutral-500">
                    Payment confirmed. We're activating your workspace — this only takes a few
                    seconds.
                  </p>
                  <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-neutral-400" />
                  </div>
                </>
              ) : null}

              {/* Activated */}
              {isActivated && currentCreator ? (
                <>
                  <div className="grid size-16 place-items-center rounded-2xl bg-emerald-50">
                    <CheckCircle2 className="text-emerald-600" size={28} strokeWidth={1.8} />
                  </div>
                  <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
                    Workspace is live
                  </h1>
                  <p className="mt-2.5 text-sm leading-6 text-neutral-500">
                    <span className="font-semibold text-neutral-950">{currentCreator.name}</span> is
                    now active. Start building your landing pages and collecting leads.
                  </p>
                  <button
                    className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    type="button"
                    onClick={() => navigate(`/app/${currentCreator.slug}`, { replace: true })}
                  >
                    Open workspace
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : null}

              {/* Timeout */}
              {isTimeout ? (
                <>
                  <div className="grid size-16 place-items-center rounded-2xl bg-amber-50">
                    <Clock className="text-amber-600" size={28} strokeWidth={1.8} />
                  </div>
                  <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
                    Payment received
                  </h1>
                  <p className="mt-2.5 text-sm leading-6 text-neutral-500">
                    Payment confirmed but activation is taking longer than expected. Your workspace
                    will be ready within a few minutes.
                  </p>
                  <button
                    className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    type="button"
                    onClick={() => navigate('/', { replace: true })}
                  >
                    Go to workspace
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : null}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
