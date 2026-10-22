import { apiRequest } from '../../../shared/api/http-client'
import type { AnalyticsPeriod, AnalyticsScope, AnalyticsSeries, ProductRevenueBreakdown } from '../model/types'

/** One page's, product's or (scope "workspace", no id) the whole workspace's numbers for a period (creator timezone),
 * with the period before. */
export function getAnalyticsSeries(slug: string, scope: AnalyticsScope, id: string | null, period: AnalyticsPeriod) {
  const params = new URLSearchParams({ scope, period })
  if (id) params.set('id', id)
  return apiRequest<{ data: AnalyticsSeries }>(
    `/api/creators/${encodeURIComponent(slug)}/analytics/series?${params}`,
  ).then((response) => response.data)
}

/** Paid revenue and sales per product for a period, best first. */
export function getProductRevenue(slug: string, period: AnalyticsPeriod) {
  return apiRequest<{ data: ProductRevenueBreakdown }>(
    `/api/creators/${encodeURIComponent(slug)}/analytics/products?${new URLSearchParams({ period })}`,
  ).then((response) => response.data)
}
