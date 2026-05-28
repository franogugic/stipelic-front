import { ArrowLeft, Loader2, Settings, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DeleteCreatorDialog } from '../components/DeleteCreatorDialog'
import { useCreatorStore } from '../model/creator-store'

export function CreatorWorkspacePage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const currentCreator = useCreatorStore((state) => state.currentCreator)
  const currentCreatorStatus = useCreatorStore((state) => state.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((state) => state.loadCurrentCreator)
  const resetDeleteCreatorFeedback = useCreatorStore((state) => state.resetDeleteCreatorFeedback)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isLoadingCreator = currentCreatorStatus === 'loading' || currentCreatorStatus === 'idle'
  const isCurrentSlug = currentCreator?.slug === slug

  useEffect(() => {
    if (currentCreatorStatus === 'idle') {
      void loadCurrentCreator()
    }
  }, [currentCreatorStatus, loadCurrentCreator])

  const openDeleteDialog = () => {
    resetDeleteCreatorFeedback()
    setIsDeleteDialogOpen(true)
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl">
        <header className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Creator Platform</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">/{slug}</p>
          </div>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
            type="button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            Home
          </button>
        </header>
      </div>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div>
          <p className="text-sm font-semibold text-neutral-500">Creator workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            {currentCreator && isCurrentSlug ? currentCreator.name : `/${slug}`}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
            Landing page editing and stats will live here.
          </p>
        </div>

        {isLoadingCreator ? (
          <div className="mt-8 flex items-center gap-3 rounded-3xl border border-neutral-200 bg-white p-5 text-sm font-medium text-neutral-500 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <Loader2 className="animate-spin" size={18} />
            Loading creator workspace
          </div>
        ) : null}

        {!isLoadingCreator && (!currentCreator || !isCurrentSlug) ? (
          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="text-sm font-semibold">Creator workspace not found</p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              Go back home and open your current creator workspace.
            </p>
          </div>
        ) : null}

        {currentCreator && isCurrentSlug ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold tracking-normal text-neutral-950">
                    /{currentCreator.slug}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Open settings to review the backend settings for this creator.
                  </p>
                </div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                  type="button"
                  onClick={() => navigate(`/app/${currentCreator.slug}/settings`)}
                >
                  <Settings size={17} />
                  Settings
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <CreatorWorkspaceMeta label="Status" value={currentCreator.status} />
                <CreatorWorkspaceMeta label="Currency" value={currentCreator.defaultCurrency} />
                <CreatorWorkspaceMeta label="Plan" value={currentCreator.planCode || 'Free'} />
              </div>
            </section>

            <aside className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold text-neutral-950">Danger zone</p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Delete this creator workspace and return to home.
              </p>
              <button
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                type="button"
                onClick={openDeleteDialog}
              >
                <Trash2 size={17} />
                Delete creator
              </button>
            </aside>
          </div>
        ) : null}
      </section>

      {currentCreator && isCurrentSlug ? (
        <DeleteCreatorDialog
          creator={currentCreator}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={() => navigate('/')}
        />
      ) : null}
    </main>
  )
}

function CreatorWorkspaceMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="block text-xs font-semibold uppercase text-neutral-400">{label}</span>
      <span className="mt-1 block text-sm font-semibold text-neutral-950">{value}</span>
    </span>
  )
}
