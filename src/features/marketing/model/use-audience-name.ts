import { useMemo } from 'react'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'

type Audience = { audienceType: 'LandingPage' | 'Product' | 'All'; targetPublicId: string | null }

/** Resolves a campaign's audience to the label used across the email screens (needs the pages and products loaded). */
export function useAudienceName() {
  const pages = useLandingPageStore((s) => s.pages)
  const products = useProductStore((s) => s.products)
  return useMemo(() => {
    const lpByPublicId = new Map(pages.map((p) => [p.publicId, p.title]))
    const productByPublicId = new Map(products.map((p) => [p.publicId, p.name]))
    return (campaign: Audience) => {
      if (campaign.audienceType === 'All') return 'All subscribers'
      const target = campaign.targetPublicId ?? ''
      return (campaign.audienceType === 'LandingPage' ? lpByPublicId.get(target) : productByPublicId.get(target)) ?? '—'
    }
  }, [pages, products])
}
