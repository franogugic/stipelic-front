import { apiRequest } from '../../../shared/api/http-client'
import { getHomeSummary } from '../../orders/api/orders-api'
import type { AiBrief, AiUsage } from '../model/ai-draft'
import type { LandingPageWithSections } from '../model/types'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

/**
 * F7-B: fills a draft page (created with the creator's title first) with an AI-written page. 201 carries the editor
 * payload; 422 AI_REFUSED, 502 AI_TRUNCATED / AI_INVALID, 429 USAGE_LIMIT and the rate limit use nothing.
 *
 * The contract names `/api/landing-pages/{id}/ai-draft`; every other landing-page route is creator-scoped, so this one
 * is too — the single place to change if the backend differs. Aborting the request saves and counts nothing.
 */
export async function generateAiDraft(slug: string, pageId: string, brief: AiBrief, signal: AbortSignal): Promise<LandingPageWithSections> {
  // Until F7-B lands: `VITE_MOCK_AI` (dev only) answers like the endpoint would, saving a real draft.
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_AI) {
    return (await import('./ai-draft-mock')).mockGenerateAiDraft(slug, pageId, brief, signal)
  }
  const res = await apiRequest<ApiResponse<LandingPageWithSections>>(`/api/creators/${slug}/landing-pages/${pageId}/ai-draft`, {
    method: 'POST',
    signal,
    body: {
      goal: brief.goal,
      audience: brief.audience.trim(),
      ...(brief.goal === 'free_product' ? { productId: brief.productId } : { offerText: brief.offer.trim() }),
      brand: brief.brand.trim(),
      tone: brief.tone,
      benefits: brief.benefits.map((benefit) => benefit.trim()),
      cta: brief.cta.trim(),
      language: brief.language,
    },
  })
  return res.data
}

/** "N of M generations this month": from the usage response (`aiGenerations`); null while the API does not send it. */
export async function loadAiUsage(slug: string): Promise<AiUsage | null> {
  const summary = await getHomeSummary(slug)
  if (summary.aiGenerations) return summary.aiGenerations
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_AI) return (await import('./ai-draft-mock')).mockUsage()
  return null
}
