import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { getPublishedLandingPage } from '../api/public-landing-page-api'
import type {
  CtaContent,
  FeaturesContent,
  HeroContent,
  LandingPageSection,
  LandingPageType,
  LandingPageWithSections,
  ProductDetailsContent,
  SectionType,
} from '../model/types'

export function PublicLandingPage() {
  const { creatorSlug, pageSlug } = useParams<{ creatorSlug: string; pageSlug: string }>()

  const [page, setPage] = useState<LandingPageWithSections | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    if (!creatorSlug || !pageSlug) return
    getPublishedLandingPage(creatorSlug, pageSlug)
      .then((data) => { setPage(data); setStatus('success') })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setStatus('notfound')
        else setStatus('error')
      })
  }, [creatorSlug, pageSlug])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={24} />
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center px-5">
        <p className="text-4xl font-bold text-neutral-950">404</p>
        <p className="text-neutral-500">This page doesn't exist or hasn't been published yet.</p>
      </div>
    )
  }

  if (status === 'error' || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-neutral-500">Something went wrong. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {page.sections.map((section) => (
        <PublicSection key={section.publicId} section={section} pageType={page.type} />
      ))}
    </div>
  )
}

/* ─── PublicSection ───────────────────────────────────────────── */

function PublicSection({ section, pageType }: { section: LandingPageSection; pageType: LandingPageType }) {
  const content = parseJson(section.contentJson)

  switch (section.type as SectionType) {
    case 'Hero': {
      const c = content as Partial<HeroContent>
      return (
        <section style={{ backgroundColor: section.backgroundColor }} className="px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-950 sm:text-5xl">
              {c.heading}
            </h1>
            {c.subheading ? (
              <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-600">{c.subheading}</p>
            ) : null}
            <div className="mt-8">
              <CtaButton label={c.ctaText ?? 'Get started'} pageType={pageType} />
            </div>
          </div>
        </section>
      )
    }

    case 'Features': {
      const c = content as Partial<FeaturesContent>
      const items = c.items ?? []
      return (
        <section style={{ backgroundColor: section.backgroundColor }} className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            {c.heading ? (
              <h2 className="mb-12 text-center text-3xl font-bold text-neutral-950">{c.heading}</h2>
            ) : null}
            <div className={`grid gap-8 ${items.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              {items.map((item, i) => (
                <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <p className="text-lg font-semibold text-neutral-950">{item.title}</p>
                  <p className="mt-2 text-neutral-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    case 'ProductDetails': {
      const c = content as Partial<ProductDetailsContent>
      return (
        <section style={{ backgroundColor: section.backgroundColor }} className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            {c.heading ? (
              <h2 className="text-3xl font-bold text-neutral-950">{c.heading}</h2>
            ) : null}
            {c.description ? (
              <p className="mt-4 text-lg leading-relaxed text-neutral-600">{c.description}</p>
            ) : null}
            {c.showPrice ? (
              <p className="mt-6 text-3xl font-bold text-neutral-950">Price on request</p>
            ) : null}
            {c.bullets && c.bullets.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {c.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-700">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-neutral-950" />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      )
    }

    case 'Cta': {
      const c = content as Partial<CtaContent>
      return (
        <section style={{ backgroundColor: section.backgroundColor }} className="px-6 py-24 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-neutral-950 sm:text-4xl">{c.heading}</h2>
            {c.subheading ? (
              <p className="mt-4 text-lg text-neutral-600">{c.subheading}</p>
            ) : null}
            <div className="mt-8">
              <CtaButton label={c.buttonText ?? 'Get started'} pageType={pageType} />
            </div>
          </div>
        </section>
      )
    }
  }
}

/* ─── CtaButton ───────────────────────────────────────────────── */

function CtaButton({ label, pageType }: { label: string; pageType: LandingPageType }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (pageType === 'LeadGen') {
    if (submitted) {
      return (
        <p className="inline-block rounded-2xl bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-700">
          ✓ You're in! Check your inbox.
        </p>
      )
    }
    return (
      <form
        className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
        onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          {label}
        </button>
      </form>
    )
  }

  // Sales — buy button (Stripe later)
  return (
    <button
      type="button"
      className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-950 px-8 text-sm font-semibold text-white transition hover:bg-neutral-800"
    >
      {label}
    </button>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function parseJson(json: string): Record<string, unknown> {
  try { return JSON.parse(json) as Record<string, unknown> } catch { return {} }
}
