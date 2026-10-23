export type LandingPageType = 'LeadGen' | 'Sales'
export type LandingPageStatus = 'Draft' | 'Published' | 'Archived'
export type SectionType =
  | 'Navbar'
  | 'Hero'
  | 'Features'
  | 'ProductDetails'
  | 'Cta'
  | 'Footer'
  | 'Testimonials'
  | 'Faq'
  | 'Gallery'

export type LandingPageSection = {
  publicId: string
  type: SectionType
  /** The layout, one of the type's variants (see `SectionTemplate.variant`). */
  variant: string
  sortOrder: number
  /** Hex colour, or null for the page default (follows the page's light / dark theme). */
  backgroundColor: string | null
  contentJson: string
  isLocked: boolean
}

/** The creator's brand as a visitor sees it (public page only). */
export type PublicCreatorBrand = {
  name: string
  primaryColor: string | null
  logoUrl: string | null
}

/** "More from {brand}" on a missing public page: the creator's published pages. */
export type PublicCreatorPages = {
  creator: PublicCreatorBrand
  pages: Array<{
    title: string
    slug: string
    type: LandingPageType
    productPriceCents: number | null
    currency: string | null
    thumbnailUrl: string | null
  }>
}

export type LandingPage = {
  publicId: string
  title: string
  slug: string
  type: LandingPageType
  status: LandingPageStatus
  productPublicId: string | null
  productName: string | null
  productThumbnailUrl: string | null
  customDomain: string | null
  createdAt: string
  updatedAt: string
  totalViews: number
  uniqueVisitors: number
  purchaseCount: number
  totalRevenueCents: number
  captureCount: number
}

export type LandingPageWithSections = Omit<
  LandingPage,
  'totalViews' | 'uniqueVisitors' | 'purchaseCount' | 'totalRevenueCents' | 'captureCount'
> & {
  sections: LandingPageSection[]
  productPriceCents: number | null
  /** Public page only. */
  creator?: PublicCreatorBrand
  /** Public page only; absent when the page has no product. */
  product?: { currency: string }
}

export type SectionTemplate = {
  key: string
  type: SectionType
  variant: string
  name: string
  description: string
  contentJson: string
  /** Null = the page default. */
  defaultBackgroundColor: string | null
  /** Navbar and Footer: always on the page, never added or removed. */
  isLocked: boolean
}

export type PeriodStats = {
  totalViews: number
  uniqueVisitors: number
  /** Paid orders, by the time they were paid. */
  purchaseCount: number
  /** Email captures, by the time they were captured. */
  captureCount: number
  revenueCents: number
}

export type EmailCaptureItem = {
  email: string
  capturedAt: string
  unsubscribed: boolean
}

export type LandingPageAnalytics = {
  title: string
  slug: string
  status: LandingPageStatus
  allTime: PeriodStats
  today: PeriodStats
  last7Days: PeriodStats
  last30Days: PeriodStats
  totalEmailCaptures: number
  purchaseCount: number
  totalRevenueCents: number
  currency: string | null
}

export type CreateLandingPageRequest = {
  title: string
  slug: string
  type: LandingPageType
  /** A sales page's paid product; a lead page's document (a free product), or omitted for a newsletter sign-up. */
  productId?: string
}

export type SaveEditorSectionRequest = {
  publicId: string | null
  type: SectionType
  variant: string
  sortOrder: number
  backgroundColor: string | null
  contentJson: string
}

export type SaveEditorRequest = {
  title: string
  slug: string
  type: LandingPageType
  /**
   * A lead page's document (an Active free product), or null for a plain newsletter sign-up. Left out: unchanged.
   * (Not in the F8.1 spec's list of fields — the page settings need a way to send it.)
   */
  productId?: string | null
  sections: SaveEditorSectionRequest[]
}
