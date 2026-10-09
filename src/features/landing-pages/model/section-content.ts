import type { SectionType } from './types'

// The content of each section type (its ContentJson), parsed with safe defaults so a section saved by an older
// editor (a missing key, an image without alt text) still renders. Keys the editor doesn't know are kept on save.
// Images carry an optional alt text: empty means decorative. Headlines may wrap words in *asterisks* to set them
// in the brand colour; the asterisks are stored in the text.

export type HeroContent = {
  heading: string
  subheading: string
  ctaText: string
  imageUrl: string | null
  imageAlt: string
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
  imageUrl: string | null
  imageAlt: string
}

export type CtaContent = {
  heading: string
  subheading: string
  buttonText: string
}

/** `href` is `#s-{sectionPublicId}`: links scroll to a section on the same page. */
export type NavbarContent = {
  brandName: string
  links: { label: string; href: string }[]
}

export type FooterContent = {
  copyright: string
}

export type TestimonialsContent = {
  heading: string
  items: { quote: string; author: string; role: string }[]
}

export type FaqContent = {
  heading: string
  items: { question: string; answer: string }[]
}

/** `imageAlts[i]` belongs to `imageUrls[i]`. */
export type GalleryContent = {
  heading: string
  imageUrls: string[]
  imageAlts: string[]
}

export type SectionContentMap = {
  Navbar: NavbarContent
  Hero: HeroContent
  Features: FeaturesContent
  ProductDetails: ProductDetailsContent
  Testimonials: TestimonialsContent
  Faq: FaqContent
  Gallery: GalleryContent
  Cta: CtaContent
  Footer: FooterContent
}

export type SectionContent = SectionContentMap[SectionType]

/** Repeater limits — frontend only; the backend caps the whole section at 64 KB. */
export const CONTENT_LIMITS = {
  navLinks: 5,
  features: 6,
  bullets: 8,
  quotes: 6,
  questions: 10,
  images: 12,
} as const

type Json = Record<string, unknown>

const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)
const nullableStr = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null)
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const record = (value: unknown): Json => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : {})

const PARSERS: { [T in SectionType]: (raw: Json) => SectionContentMap[T] } = {
  Navbar: (raw) => ({
    brandName: str(raw.brandName),
    links: list(raw.links).map((link) => ({ label: str(record(link).label), href: str(record(link).href) })),
  }),
  Hero: (raw) => ({
    heading: str(raw.heading),
    subheading: str(raw.subheading),
    ctaText: str(raw.ctaText),
    imageUrl: nullableStr(raw.imageUrl),
    imageAlt: str(raw.imageAlt),
  }),
  Features: (raw) => ({
    heading: str(raw.heading),
    items: list(raw.items).map((item) => ({ title: str(record(item).title), description: str(record(item).description) })),
  }),
  ProductDetails: (raw) => ({
    heading: str(raw.heading),
    description: str(raw.description),
    showPrice: raw.showPrice !== false,
    bullets: list(raw.bullets).map((bullet) => str(bullet)),
    imageUrl: nullableStr(raw.imageUrl),
    imageAlt: str(raw.imageAlt),
  }),
  Testimonials: (raw) => ({
    heading: str(raw.heading),
    items: list(raw.items).map((item) => ({
      quote: str(record(item).quote),
      author: str(record(item).author),
      role: str(record(item).role),
    })),
  }),
  Faq: (raw) => ({
    heading: str(raw.heading),
    items: list(raw.items).map((item) => ({ question: str(record(item).question), answer: str(record(item).answer) })),
  }),
  Gallery: (raw) => {
    const imageUrls = list(raw.imageUrls).map((url) => str(url)).filter(Boolean)
    const alts = list(raw.imageAlts)
    // Older content has no alts: every image starts without one.
    return { heading: str(raw.heading), imageUrls, imageAlts: imageUrls.map((_, index) => str(alts[index])) }
  },
  Cta: (raw) => ({ heading: str(raw.heading), subheading: str(raw.subheading), buttonText: str(raw.buttonText) }),
  Footer: (raw) => ({ copyright: str(raw.copyright) }),
}

function parseJsonObject(json: string): Json {
  try {
    return record(JSON.parse(json))
  } catch {
    return {}
  }
}

export function parseSectionContent<T extends SectionType>(type: T, contentJson: string): SectionContentMap[T] {
  return PARSERS[type](parseJsonObject(contentJson))
}

/** The edited content over the original JSON, so keys this editor doesn't know survive a save. */
export function serializeSectionContent(original: string, content: SectionContent): string {
  return JSON.stringify({ ...parseJsonObject(original), ...content })
}

/** Navbar links point at a section by its public id. */
export const sectionAnchor = (publicId: string) => `s-${publicId}`
export const sectionHref = (publicId: string) => `#${sectionAnchor(publicId)}`
export const hrefTarget = (href: string) => (href.startsWith('#s-') ? href.slice(3) : '')
