import {
  ArrowLeft,
  AtSign,
  CircleDollarSign,
  Clock3,
  Fingerprint,
  Globe2,
  Hash,
  Image,
  Loader2,
  Palette,
  Settings,
} from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreatorStore } from '../model/creator-store'

export function CreatorSettingsPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const creatorSettings = useCreatorStore((state) => state.creatorSettings)
  const creatorSettingsStatus = useCreatorStore((state) => state.creatorSettingsStatus)
  const creatorSettingsError = useCreatorStore((state) => state.creatorSettingsError)
  const loadCreatorSettings = useCreatorStore((state) => state.loadCreatorSettings)

  const isLoading = creatorSettingsStatus === 'loading' || creatorSettingsStatus === 'idle'
  const normalizedSlug = slug ?? ''

  useEffect(() => {
    if (normalizedSlug) {
      void loadCreatorSettings(normalizedSlug)
    }
  }, [loadCreatorSettings, normalizedSlug])

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl">
        <header className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Creator Platform</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">
              /{normalizedSlug}/settings
            </p>
          </div>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
            type="button"
            onClick={() => navigate(`/app/${normalizedSlug}`)}
          >
            <ArrowLeft size={16} />
            Workspace
          </button>
        </header>
      </div>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white">
              <Settings size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-500">Creator settings</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                {creatorSettings?.creatorName ?? `/${normalizedSlug}`}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
                Review the public settings stored for this creator workspace.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 flex items-center gap-3 rounded-3xl border border-neutral-200 bg-white p-5 text-sm font-medium text-neutral-500 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <Loader2 className="animate-spin" size={18} />
            Loading creator settings
          </div>
        ) : null}

        {creatorSettingsStatus === 'error' ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="text-sm font-semibold">Could not load settings</p>
            <p className="mt-2 text-sm leading-6">{creatorSettingsError}</p>
          </div>
        ) : null}

        {creatorSettingsStatus === 'success' && creatorSettings ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit rounded-3xl border border-neutral-200 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <SettingsNavItem active icon={Palette} label="Brand" />
              <SettingsNavItem icon={Globe2} label="Public details" />
              <SettingsNavItem icon={Settings} label="Workspace" />
            </aside>

            <div className="grid gap-6">
              <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <div
                  className="relative min-h-48 p-6"
                  style={{ backgroundColor: normalizeColor(creatorSettings.primaryColor) }}
                >
                  <div className="absolute inset-0 bg-white/10" />
                  <div className="relative flex h-full flex-col justify-between gap-10">
                    <span className="inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      Public preview
                    </span>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex items-end gap-4">
                        <div className="grid size-20 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-neutral-950 text-2xl font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.20)]">
                          {getInitials(creatorSettings.brandName || creatorSettings.creatorName)}
                        </div>
                        <div>
                          <p className="text-3xl font-semibold tracking-normal text-white">
                            {creatorSettings.brandName || creatorSettings.creatorName}
                          </p>
                          <p className="mt-2 text-sm font-medium text-white/75">
                            /{creatorSettings.slug}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-950">
                        {formatLanguage(creatorSettings.language)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid divide-y divide-neutral-200 p-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <PreviewMetric
                    label="Brand"
                    value={creatorSettings.brandName || creatorSettings.creatorName}
                  />
                  <PreviewMetric
                    label="Currency"
                    value={creatorSettings.defaultCurrency}
                  />
                  <PreviewMetric label="Timezone" value={creatorSettings.timezone} />
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold tracking-normal text-neutral-950">
                        Public details
                      </p>
                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        Values currently returned by the backend settings endpoint.
                      </p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
                      Read only
                    </span>
                  </div>

                  <div className="mt-5 divide-y divide-neutral-200">
                    <SettingsLine icon={AtSign} label="Support email" value={creatorSettings.supportEmail || 'Not set'} />
                    <SettingsLine icon={Image} label="Logo URL" value={creatorSettings.logoUrl || 'Not set'} />
                    <SettingsLine
                      icon={Palette}
                      label="Primary color"
                      value={creatorSettings.primaryColor}
                      swatch={creatorSettings.primaryColor}
                    />
                    <SettingsLine icon={Globe2} label="Language" value={formatLanguage(creatorSettings.language)} />
                  </div>
                </div>

                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-lg font-semibold tracking-normal text-neutral-950">
                    Workspace
                  </p>
                  <div className="mt-5 grid gap-3">
                    <SettingsRow icon={Fingerprint} label="Creator ID" value={creatorSettings.creatorPublicId} />
                    <SettingsRow icon={Hash} label="Slug" value={`/${creatorSettings.slug}`} />
                    <SettingsRow icon={CircleDollarSign} label="Currency" value={creatorSettings.defaultCurrency} />
                    <SettingsRow icon={Clock3} label="Timezone" value={creatorSettings.timezone} />
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

type SettingsNavItemProps = {
  active?: boolean
  icon: typeof AtSign
  label: string
}

function SettingsNavItem({ active = false, icon: Icon, label }: SettingsNavItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold ${
        active ? 'bg-neutral-950 text-white' : 'text-neutral-600'
      }`}
    >
      <Icon size={17} />
      {label}
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-4">
      <p className="text-xs font-semibold uppercase text-neutral-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  )
}

type SettingsLineProps = {
  icon: typeof AtSign
  label: string
  value: string
  swatch?: string
}

function SettingsLine({ icon: Icon, label, value, swatch }: SettingsLineProps) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[180px_1fr] sm:items-center">
      <span className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
        <Icon size={16} />
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-neutral-950">
        {swatch ? (
          <span
            className="size-4 rounded-full border border-neutral-200"
            style={{ backgroundColor: normalizeColor(swatch) }}
          />
        ) : null}
        <span className="truncate">{value}</span>
      </span>
    </div>
  )
}

function SettingsRow({ icon: Icon, label, value }: { icon: typeof AtSign; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-neutral-500">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase text-neutral-400">{label}</span>
        <span className="mt-1 block break-words text-sm font-semibold text-neutral-950">
          {value}
        </span>
      </span>
    </div>
  )
}


function formatLanguage(language: string) {
  return language.toLowerCase() === 'en' ? 'English' : language
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'CP'
}

function normalizeColor(color: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#111827'
}
