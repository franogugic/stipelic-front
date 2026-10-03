import { AlertTriangle, Loader2 } from "lucide-react";

/** Confirms cancelling the subscription (old design; moved out of the dashboard, used by Settings). */
export function CancelSubscriptionDialog({
  isSubmitting,
  onClose,
  onConfirm,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-500/12 light:bg-amber-50">
          <AlertTriangle
            className="text-amber-400 light:text-amber-600"
            size={22}
          />
        </div>
        <h2 className="font-display mt-4 text-lg font-semibold text-white light:text-neutral-950">
          Cancel subscription?
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-950/50">
          Your plan remains active until the end of the current billing period.
          After that, the workspace will be suspended and landing pages will go
          offline.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-white/70 light:text-neutral-950/70 transition hover:bg-secondary"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Keep plan
          </button>
          <button
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong disabled:opacity-40"
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={15} />
            ) : null}
            Confirm cancel
          </button>
        </div>
      </div>
    </div>
  );
}
