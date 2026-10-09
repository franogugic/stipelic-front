import { apiRequest } from '../../../shared/api/http-client'
import type { LandingPageWithSections, PublicCreatorPages } from '../model/types'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

/** A published page with the creator's brand and the product's type and currency. An unknown and an unpublished
 * page are the same 404 (`PAGE_NOT_FOUND`). Loading it records a page view. */
export async function getPublishedLandingPage(creatorSlug: string, landingPageSlug: string): Promise<LandingPageWithSections> {
  const res = await apiRequest<ApiResponse<LandingPageWithSections>>(
    `/api/public/landing-pages/${encodeURIComponent(creatorSlug)}/${encodeURIComponent(landingPageSlug)}`,
  )
  return res.data
}

/** "More from {brand}": the creator's brand and up to six published pages. 404 for an unknown or deleted workspace. */
export async function getCreatorPages(creatorSlug: string): Promise<PublicCreatorPages> {
  const res = await apiRequest<ApiResponse<PublicCreatorPages>>(`/api/public/creators/${encodeURIComponent(creatorSlug)}/pages`)
  return res.data
}

/** Starts Stripe Checkout and returns its URL. Stripe asks the buyer for their email. */
export async function createCheckout(creatorSlug: string, landingPageSlug: string): Promise<string> {
  const res = await apiRequest<ApiResponse<{ checkoutUrl: string }>>(
    `/api/public/landing-pages/${encodeURIComponent(creatorSlug)}/${encodeURIComponent(landingPageSlug)}/checkout`,
    { method: 'POST', body: {} },
  )
  return res.data.checkoutUrl
}

/** A lead sign-up. A 409 means sign-ups are paused; an address already on the list succeeds like a new one. */
export async function captureEmail(creatorSlug: string, landingPageSlug: string, email: string): Promise<void> {
  await apiRequest<unknown>(
    `/api/public/landing-pages/${encodeURIComponent(creatorSlug)}/${encodeURIComponent(landingPageSlug)}/captures`,
    { method: 'POST', body: { email } },
  )
}
