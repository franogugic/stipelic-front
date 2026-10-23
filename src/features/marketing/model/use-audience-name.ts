import { useMemo } from 'react'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'
import { audienceLabel } from './audience'
import type { CampaignAudienceType, ResendSource } from './types'

type Audience = { audienceType: CampaignAudienceType; targetPublicId: string | null; source?: ResendSource | null }

/** Resolves a campaign's audience to the label used across the email screens (needs the pages and products loaded). */
export function useAudienceName() {
  const pages = useLandingPageStore((s) => s.pages)
  const products = useProductStore((s) => s.products)
  return useMemo(() => {
    const lpByPublicId = new Map(pages.map((p) => [p.publicId, p.title]))
    const productByPublicId = new Map(products.map((p) => [p.publicId, p.name]))
    return (campaign: Audience) => {
      if (campaign.audienceType === 'All') return audienceLabel('All', '')
      if (campaign.audienceType === 'CampaignNonOpeners') return audienceLabel('CampaignNonOpeners', campaign.source?.subject ?? '—')
      const target = campaign.targetPublicId ?? ''
      const name = (campaign.audienceType === 'Product' ? productByPublicId.get(target) : lpByPublicId.get(target)) ?? '—'
      return audienceLabel(campaign.audienceType, name)
    }
  }, [pages, products])
}
