import { apiRequest } from '../../../shared/api/http-client'
import type { AnalyticsPages, AnalyticsPeriod, AnalyticsScope, AnalyticsSeries, ProductRevenueBreakdown } from '../model/types'

/** One page's, product's or (scope "workspace", no id) the whole workspace's numbers for a period (creator timezone),
 * with the period before. */
export function getAnalyticsSeries(slug: string, scope: AnalyticsScope, id: string | null, period: AnalyticsPeriod) {
  const params = new URLSearchParams({ scope, period })
  if (id) params.set('id', id)
  return apiRequest<{ data: AnalyticsSeries }>(
    `/api/creators/${encodeURIComponent(slug)}/analytics/series?${params}`,
  ).then((response) => response.data)
}

/** Paid revenue and sales per product for a period, best first. With `productId`, `selected` says where that product stands. */
export function getProductRevenue(slug: string, period: AnalyticsPeriod, productId?: string | null) {
  const params = new URLSearchParams({ period })
  if (productId) params.set('productId', productId)
  return apiRequest<{ data: ProductRevenueBreakdown }>(
    `/api/creators/${encodeURIComponent(slug)}/analytics/products?${params}`,
  ).then((response) => response.data)
}

/** The top pages of a period, ranked by revenue, then sign-ups, then views; optionally only the pages of one product. */
export function getAnalyticsPages(slug: string, period: AnalyticsPeriod, productId?: string | null, limit = 5) {
  const params = new URLSearchParams({ period, limit: String(limit) })
  if (productId) params.set('productId', productId)
  return apiRequest<{ data: AnalyticsPages }>(
    `/api/creators/${encodeURIComponent(slug)}/analytics/pages?${params}`,
  ).then((response) => response.data)
}
