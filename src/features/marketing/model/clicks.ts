import type { CampaignDetail, CampaignListItem } from './types'

/** Where a campaign stands with click statistics: sent before tracking, no links to click, or tracked with a rate (%). */
export type ClickInfo = { kind: 'untracked' } | { kind: 'nolinks' } | { kind: 'tracked'; rate: number }

/** Unique clickers ÷ delivered, as a percentage. */
export function clickInfo({
  tracked,
  links,
  uniqueClickers,
  delivered,
}: {
  tracked: boolean
  links: number
  uniqueClickers: number
  delivered: number
}): ClickInfo {
  if (!tracked) return { kind: 'untracked' }
  if (links === 0) return { kind: 'nolinks' }
  return { kind: 'tracked', rate: delivered > 0 ? (uniqueClickers / delivered) * 100 : 0 }
}

export const clickInfoOfItem = (campaign: CampaignListItem): ClickInfo =>
  clickInfo({ tracked: campaign.clickTracked, links: campaign.linkCount, uniqueClickers: campaign.uniqueClickCount, delivered: campaign.sentCount })

export const clickInfoOfDetail = (campaign: CampaignDetail): ClickInfo =>
  clickInfo({
    tracked: campaign.clickTracked,
    links: campaign.clicks.links.length,
    uniqueClickers: campaign.clicks.uniqueClickers,
    delivered: campaign.sentCount,
  })

/** "https://www.site.hr/journal/2026/09/long-slug?utm=…" → "site.hr/journal/…/long-slug": domain and path, readable. */
export function shortUrl(url: string) {
  try {
    const { hostname, pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)
    const path = segments.length > 2 ? `${segments[0]}/…/${segments[segments.length - 1]}` : segments.join('/')
    return `${hostname.replace(/^www\./, '')}${path ? `/${path}` : ''}`
  } catch {
    return url
  }
}
