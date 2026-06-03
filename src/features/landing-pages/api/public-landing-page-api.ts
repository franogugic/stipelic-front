import { apiRequest } from '../../../shared/api/http-client'
import type { LandingPageWithSections } from '../model/types'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

export async function getPublishedLandingPage(
  creatorSlug: string,
  landingPageSlug: string,
): Promise<LandingPageWithSections> {
  const res = await apiRequest<ApiResponse<LandingPageWithSections>>(
    `/api/public/landing-pages/${creatorSlug}/${landingPageSlug}`,
  )
  return res.data
}
