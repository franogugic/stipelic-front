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

  const currentCreator = useCreatorStore((state) => state.currentCreator)
  const pollActivationStatus = useCreatorStore((state) => state.pollActivationStatus)
  const pollCreatorActivation = useCreatorStore((state) => state.pollCreatorActivation)
  const resetPollActivation = useCreatorStore((state) => state.resetPollActivation)

  const isPolling = pollActivationStatus === 'polling'
  const isActivated = pollActivationStatus === 'activated'
  const isTimeout = pollActivationStatus === 'timeout'

  useEffect(() => {
    if (!isSuccess || hasStartedPolling.current) return

    hasStartedPolling.current = true
    resetPollActivation()
    void pollCreatorActivation()
  }, [isSuccess, pollCreatorActivation, resetPollActivation])

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-12">
          <section className="w-full">
            {/* Logo */}
            <div className="mb-10 flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-neutral-950 text-white">
                <span className="text-xs font-bold">CP</span>
              </span>
              <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
              {/* Polling state */}
              {isPolling ? (
                <>
                  <div className="grid size-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-600">
                    <Loader2 className="animate-spin" size={28} strokeWidth={1.8} />
                  </div>
                  <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                    Activating workspace
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-neutral-500">
                    Payment confirmed. We're activating your creator workspace — this takes a few
                    seconds.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-medium text-neutral-400">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full animate-pulse rounded-full bg-neutral-400" />
                    </div>
                    Checking activation status
                  </div>
                </>
              ) : null}

              {/* Activated state */}
              {isActivated && currentCreator ? (
                <>
                  <div className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={28} strokeWidth={1.8} />
                  </div>
                  <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                    Workspace is active
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-neutral-500">
                    Your creator workspace{' '}
                    <span className="font-semibold text-neutral-950">{currentCreator.name}</span> is
                    now active and ready to use.
                  </p>
                  <button
                    className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    type="button"
                    onClick={() => navigate(`/app/${currentCreator.slug}`, { replace: true })}
                  >
                    Open workspace
                    <ArrowRight size={17} />
                  </button>
                </>
              ) : null}

              {/* Timeout state */}
              {isTimeout ? (
                <>
                  <div className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                    <Clock size={28} strokeWidth={1.8} />
                  </div>
                  <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                    Payment received
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-neutral-500">
                    Your payment was confirmed but activation is taking longer than expected. Your
                    workspace will be ready within a few minutes.
                  </p>
                  <button
                    className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    type="button"
                    onClick={() => navigate('/', { replace: true })}
                  >
                    Back to dashboard
                    <ArrowRight size={17} />
                  </button>
                </>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-12">
        <section className="w-full">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-neutral-950 text-white">
              <span className="text-xs font-bold">CP</span>
            </span>
            <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="grid size-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-600">
              <XCircle size={28} strokeWidth={1.8} />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Payment cancelled</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Checkout was cancelled. Your workspace has been created but isn't active yet. You can
              complete payment from your dashboard whenever you're ready.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                type="button"
                onClick={() => navigate('/', { replace: true })}
              >
                Back to dashboard
                <ArrowRight size={17} />
              </button>
              <button
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                type="button"
                onClick={() => navigate('/', { replace: true })}
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
