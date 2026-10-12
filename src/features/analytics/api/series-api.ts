import { apiRequest } from '../../../shared/api/http-client'
import type { AnalyticsPeriod, AnalyticsScope, AnalyticsSeries } from '../model/types'

/** One page's or product's numbers for a period (creator timezone), with the period before. */
export function getAnalyticsSeries(slug: string, scope: AnalyticsScope, id: string, period: AnalyticsPeriod) {
  const params = new URLSearchParams({ scope, id, period })
  return apiRequest<{ data: AnalyticsSeries }>(
    `/api/creators/${encodeURIComponent(slug)}/analytics/series?${params}`,
  ).then((response) => response.data)
}
