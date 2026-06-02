import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useCreatorStore } from '../model/creator-store'
import type { Creator } from '../model/types'

type DeleteCreatorDialogProps = {
  creator: Creator
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteCreatorDialog({
  creator,
  isOpen,
  onClose,
  onDeleted,
}: DeleteCreatorDialogProps) {
  const deleteCreatorProfile = useCreatorStore((state) => state.deleteCreatorProfile)
  const deleteStatus = useCreatorStore((state) => state.deleteStatus)
  const deleteError = useCreatorStore((state) => state.deleteError)
  const resetDeleteCreatorFeedback = useCreatorStore((state) => state.resetDeleteCreatorFeedback)
  const [confirmation, setConfirmation] = useState('')

  const isDeleting = deleteStatus === 'submitting'
  const canDelete = confirmation.trim() === creator.slug

  if (!isOpen) {
    return null
  }

  const closeDialog = () => {
    if (isDeleting) {
      return
    }

    setConfirmation('')
    resetDeleteCreatorFeedback()
    onClose()
  }

  const submitDelete = async () => {
    if (!canDelete || isDeleting) {
      return
    }

    const wasDeleted = await deleteCreatorProfile()
    if (wasDeleted) {
      setConfirmation('')
      onDeleted?.()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/30 px-5 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.20)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-700">
              <AlertTriangle size={22} />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-neutral-950">
                Delete {creator.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                This will delete the creator workspace for /{creator.slug}. Type the slug exactly
                to confirm.
              </p>
            </div>
          </div>

          <button
            className="grid size-9 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={isDeleting}
            onClick={closeDialog}
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase text-neutral-400">Required slug</p>
          <p className="mt-1 font-mono text-sm font-semibold text-neutral-950">{creator.slug}</p>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-medium text-neutral-900">
          <span>Type slug to confirm</span>
          <input
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            maxLength={creator.slug.length}
            spellCheck={false}
            value={confirmation}
            onBeforeInput={(event) => {
              if (event.nativeEvent.inputType.toLowerCase().includes('paste')) {
                event.preventDefault()
              }
            }}
            onChange={(event) => setConfirmation(event.target.value)}
            onDrop={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
                event.preventDefault()
              }
            }}
            onPaste={(event) => event.preventDefault()}
          />
        </label>

        {deleteError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {deleteError}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={isDeleting}
            onClick={closeDialog}
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            type="button"
            disabled={!canDelete || isDeleting}
            onClick={() => {
              void submitDelete()
            }}
          >
            {isDeleting ? <Loader2 className="animate-spin" size={17} /> : <Trash2 size={17} />}
            Delete creator
          </button>
        </div>
      </section>
    </div>
  )
}
