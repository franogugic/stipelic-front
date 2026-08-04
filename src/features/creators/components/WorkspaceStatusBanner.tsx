import { CreditCard, Loader2, ShieldAlert } from 'lucide-react'

type WorkspaceStatusBannerProps = {
  requiresPayment: boolean
  isSuspended: boolean
  checkoutError: string | null
  isStartingCheckout: boolean
  onPayNow: () => void
}

export function WorkspaceStatusBanner({
  requiresPayment,
  isSuspended,
  checkoutError,
  isStartingCheckout,
  onPayNow,
}: WorkspaceStatusBannerProps) {
  if (!requiresPayment && !isSuspended && !checkoutError) return null

  return (
    <div className="mb-6 grid gap-3">
      {requiresPayment && (
        <div className="flex items-center gap-4 rounded-xl border border-amber-500/25 light:border-amber-200 bg-amber-500/10 light:bg-amber-50 px-5 py-3.5">
          <CreditCard className="shrink-0 text-amber-400 light:text-amber-600" size={16} />
          <p className="flex-1 text-sm text-amber-200 light:text-amber-700">
            <span className="font-semibold">Payment required</span> — complete checkout to activate this workspace.
          </p>
          <button
            className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-50"
            type="button"
            disabled={isStartingCheckout}
            onClick={onPayNow}
          >
            {isStartingCheckout ? <Loader2 className="animate-spin" size={12} /> : <CreditCard size={12} />}
            Pay now
          </button>
        </div>
      )}
      {isSuspended && (
        <div className="flex items-center gap-4 rounded-xl border border-red-500/25 light:border-red-200 bg-red-500/10 light:bg-red-50 px-5 py-3.5">
          <ShieldAlert className="shrink-0 text-red-400 light:text-red-600" size={16} />
          <p className="text-sm text-red-200 light:text-red-700">
            <span className="font-semibold">Workspace suspended</span> — your subscription may have lapsed.
          </p>
        </div>
      )}
      {checkoutError && (
        <div className="rounded-xl border border-red-500/25 light:border-red-200 bg-red-500/10 light:bg-red-50 px-5 py-3 text-sm text-red-200 light:text-red-700">
          {checkoutError}
        </div>
      )}
    </div>
  )
}
