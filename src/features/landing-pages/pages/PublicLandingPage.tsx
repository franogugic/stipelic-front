import { ArrowRight, Compass, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { cover } from '../../../shared/lib/cover'
import { money } from '../../../shared/lib/format'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { captureEmail, createCheckout, getCreatorPages, getPublishedLandingPage } from '../api/public-landing-page-api'
import { BuyButton, LeadForm } from '../components/LandingActions'
import { LandingSection, LandingShell } from '../components/LandingSections'
import type { LandingContext, RenderedSection } from '../components/LandingSections'
import { PublicPageNotFound } from '../components/PublicPageNotFound'
import { parseSectionContent } from '../model/section-content'
import { DEFAULT_BRAND_COLOR } from '../model/section-library'
import type { LandingPageWithSections, PublicCreatorPages } from '../model/types'

type Load =
  | { status: 'loading' }
  | { status: 'ready'; page: LandingPageWithSections }
  /** The page is missing or unpublished (the same to a visitor); `creator` is null when the workspace is unknown too. */
  | { status: 'missing'; creator: PublicCreatorPages | null }
  | { status: 'error' }

const toRendered = (page: LandingPageWithSections): RenderedSection[] =>
  [...page.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(
      (section) =>
        ({
          key: section.publicId,
          type: section.type,
          variant: section.variant,
          background: section.backgroundColor,
          content: parseSectionContent(section.type, section.contentJson),
        }) as RenderedSection,
    )

/** The creator's public page at /p/{creator}/{page}: the sections in the creator's brand, with checkout or sign-up. */
export function PublicLandingPage() {
  const { creatorSlug = '', pageSlug = '' } = useParams<{ creatorSlug: string; pageSlug: string }>()
  const [load, setLoad] = useState<Load>({ status: 'loading' })

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const page = await getPublishedLandingPage(creatorSlug, pageSlug)
        if (active) setLoad({ status: 'ready', page })
      } catch (error) {
        if (!active) return
        if (!(error instanceof ApiError && error.status === 404)) {
          setLoad({ status: 'error' })
          return
        }
        try {
          const creator = await getCreatorPages(creatorSlug)
          if (active) setLoad({ status: 'missing', creator })
        } catch {
          if (active) setLoad({ status: 'missing', creator: null })
        }
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [creatorSlug, pageSlug])

  if (load.status === 'missing') {
    return load.creator ? <MissingPage creatorSlug={creatorSlug} pageSlug={pageSlug} data={load.creator} /> : <PublicPageNotFound />
  }
  if (load.status === 'error') return <LoadFailed />
  if (load.status === 'loading') {
    return (
      <LandingShell brandColor={DEFAULT_BRAND_COLOR}>
        <span className="sr-only" role="status">
          Loading…
        </span>
      </LandingShell>
    )
  }
  return <LivePage creatorSlug={creatorSlug} pageSlug={pageSlug} page={load.page} />
}

function LivePage({ creatorSlug, pageSlug, page }: { creatorSlug: string; pageSlug: string; page: LandingPageWithSections }) {
  const brand = {
    name: page.creator?.name ?? '',
    color: page.creator?.primaryColor || DEFAULT_BRAND_COLOR,
    logoUrl: page.creator?.logoUrl ?? null,
  }
  useDocumentTitle(`${page.title} · ${brand.name || 'Luma'}`)

  const [redirecting, setRedirecting] = useState(false)

  /** Opens Stripe Checkout; returns the message to show when it can't. */
  const buy = async (): Promise<string | null> => {
    setRedirecting(true)
    try {
      window.location.assign(await createCheckout(creatorSlug, pageSlug))
      return null
    } catch (error) {
      setRedirecting(false)
      return error instanceof ApiError && error.status === 409
        ? 'Checkout isn’t available right now. Please try again later.'
        : 'We couldn’t open checkout. Please try again.'
    }
  }

  // Coming back from Stripe with the browser's Back button restores this page from the cache: drop the overlay.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const signUp = async (email: string): Promise<'success' | 'closed'> => {
    try {
      await captureEmail(creatorSlug, pageSlug, email)
      return 'success'
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return 'closed'
      throw error
    }
  }

  const ctx: LandingContext = {
    pageType: page.type,
    product:
      page.productName !== null
        ? {
            name: page.productName,
            priceCents: page.productPriceCents ?? 0,
            currency: page.product?.currency ?? 'EUR',
          }
        : null,
    brand,
    renderAction: (label, options) =>
      page.type === 'Sales' ? (
        <BuyButton label={label} inverted={options?.inverted} onBuy={buy} />
      ) : (
        <LeadForm label={label} inverted={options?.inverted} brandName={brand.name} productName={page.productName} onSubmit={signUp} />
      ),
  }

  return (
    <LandingShell brandColor={brand.color}>
      {toRendered(page).map((section) => (
        <LandingSection key={section.key} section={section} ctx={ctx} />
      ))}
      {redirecting && (
        <div className="lp-overlay" role="alertdialog" aria-modal="true" aria-labelledby="checkout-title" aria-describedby="checkout-text">
          <div className="lp-overlay__card">
            <span className="lp-spinner" aria-hidden="true" />
            <p className="lp-overlay__title" id="checkout-title">
              Taking you to secure checkout
            </p>
            <p className="lp-overlay__text" id="checkout-text">
              You’ll pay on Stripe and come straight back here. Please don’t close this tab.
            </p>
            <p className="lp-overlay__brand">
              <Lock />
              Payments processed by Stripe
            </p>
          </div>
        </div>
      )}
    </LandingShell>
  )
}

/** A missing or unpublished page of a known creator: their brand, "This page isn't here" and their live pages. */
function MissingPage({ creatorSlug, pageSlug, data }: { creatorSlug: string; pageSlug: string; data: PublicCreatorPages }) {
  const brand = { name: data.creator.name, color: data.creator.primaryColor || DEFAULT_BRAND_COLOR, logoUrl: data.creator.logoUrl }
  useDocumentTitle(`Page not found · ${brand.name}`)
  const ctx: LandingContext = { pageType: 'LeadGen', product: null, brand, renderAction: () => null }
  const live = data.pages.filter((page) => page.slug !== pageSlug)

  return (
    <LandingShell brandColor={brand.color}>
      <LandingSection ctx={ctx} section={{ key: 'missing-nav', type: 'Navbar', variant: 'simple', background: null, content: { brandName: '', links: [] } }} />
      <section className="lp-sec lp-missing" aria-labelledby="missing-title">
        <span className="lp-missing__icon">
          <Compass />
        </span>
        <h1 className="lp__title" id="missing-title">
          This page <em>isn’t here.</em>
        </h1>
        <p className="lp__sub">The link may be mistyped, or {brand.name} may have moved or removed this page.</p>
        {live.length > 0 && (
          <div className="lp-missing__list">
            <p className="lp-eyebrow">More from {brand.name}</p>
            <ul role="list">
              {live.map((page) => {
                const art = cover(page.slug, page.thumbnailUrl)
                return (
                  <li key={page.slug}>
                    <Link className="lp-missing__link" to={`/p/${creatorSlug}/${page.slug}`}>
                      <span className={`${art.className} cover--thumb`} style={art.style} />
                      <span className="lp-missing__text">
                        <strong>{page.title}</strong>
                        <span>
                          {page.type === 'Sales' && page.productPriceCents !== null
                            ? money(page.productPriceCents, page.currency ?? 'EUR')
                            : 'Free'}
                        </span>
                      </span>
                      <ArrowRight />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <p className="lp-missing__owner">
          Is this your page? <Link to="/login">Log in to Luma</Link> to check your pages.
        </p>
      </section>
      <LandingSection
        ctx={ctx}
        section={{ key: 'missing-foot', type: 'Footer', variant: 'centered', background: null, content: { copyright: '' } }}
      />
    </LandingShell>
  )
}

function LoadFailed() {
  useDocumentTitle('Luma')
  return (
    <LandingShell brandColor={DEFAULT_BRAND_COLOR}>
      <section className="lp-sec lp-missing" aria-labelledby="failed-title">
        <span className="lp-missing__icon">
          <Compass />
        </span>
        <h1 className="lp__title" id="failed-title">
          We couldn’t load <em>this page.</em>
        </h1>
        <p className="lp__sub">Check your connection and try again.</p>
        <button className="lp__cta" type="button" onClick={() => window.location.reload()}>
          <span>Try again</span>
        </button>
      </section>
    </LandingShell>
  )
}
