export type LandingPageType = 'LeadGen' | 'Sales'
export type LandingPageStatus = 'Draft' | 'Published' | 'Archived'
export type SectionType = 'Navbar' | 'Hero' | 'Features' | 'ProductDetails' | 'Cta' | 'Footer'

export type LandingPageSection = {
  publicId: string
  type: SectionType
  sortOrder: number
  backgroundColor: string
  contentJson: string
  isLocked: boolean
}

export type LandingPage = {
  publicId: string
  title: string
  slug: string
  type: LandingPageType
  status: LandingPageStatus
  productId: number | null
  customDomain: string | null
  createdAt: string
  updatedAt: string
}

export type LandingPageWithSections = LandingPage & {
  sections: LandingPageSection[]
}

export type SectionTemplate = {
  key: string
  name: string
  type: SectionType
  contentJson: string
  defaultBackgroundColor: string
}

export type PeriodStats = {
  totalViews: number
  uniqueVisitors: number
}

export type EmailCaptureItem = {
  email: string
  capturedAt: string
}

export type LandingPageAnalytics = {
  allTime: PeriodStats
  today: PeriodStats
  last7Days: PeriodStats
  last30Days: PeriodStats
  totalEmailCaptures: number
}

export type CreateLandingPageRequest = {
  title: string
  slug: string
  type: LandingPageType
}

export type SaveEditorSectionRequest = {
  publicId: string | null
  type: SectionType
  sortOrder: number
  backgroundColor: string
  contentJson: string
}

export type SaveEditorRequest = {
  title: string
  slug: string
  type: LandingPageType
  sections: SaveEditorSectionRequest[]
}

// Content types per section
export type HeroContent = {
  heading: string
  subheading: string
  ctaText: string
}

export type FeaturesContent = {
  heading: string
  items: { title: string; description: string }[]
}

export type ProductDetailsContent = {
  heading: string
  description: string
  showPrice: boolean
  bullets: string[]
}

export type CtaContent = {
  heading: string
  subheading: string
  buttonText: string
}

export type NavbarContent = {
  brandName: string
  links: { label: string; href: string }[]
}

export type FooterContent = {
  copyright: string
}
