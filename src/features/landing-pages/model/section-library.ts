import {
  CircleHelp,
  Images,
  ListChecks,
  MousePointerClick,
  Package,
  PanelBottom,
  PanelTop,
  Quote,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SectionTemplate, SectionType } from './types'

/** What the editor says about each section type (the prototype's section library). The layouts themselves —
 * variant ids, names, descriptions and starting content — come from the API's section templates. */
export type SectionKind = {
  type: SectionType
  /** The prototype's type id, used in class names (`lp-sec--product`) and wireframes (`product-card`). */
  slug: string
  name: string
  icon: LucideIcon
  description: string
  /** Navbar and Footer keep their position and can't be deleted. */
  locked: 'top' | 'bottom' | null
}

export const SECTION_KINDS: SectionKind[] = [
  { type: 'Navbar', slug: 'navbar', name: 'Navbar', icon: PanelTop, locked: 'top', description: 'Your logo or brand name and links to parts of the page.' },
  { type: 'Hero', slug: 'hero', name: 'Hero', icon: Sparkles, locked: null, description: 'The first screen: your promise, a short explanation and the main button.' },
  { type: 'Features', slug: 'features', name: 'Features', icon: ListChecks, locked: null, description: 'Three to six reasons to buy, side by side.' },
  { type: 'ProductDetails', slug: 'product', name: 'Product details', icon: Package, locked: null, description: 'What is included, the price and the key benefits.' },
  { type: 'Testimonials', slug: 'testimonials', name: 'Testimonials', icon: Quote, locked: null, description: 'Quotes from people who bought or joined.' },
  { type: 'Faq', slug: 'faq', name: 'FAQ', icon: CircleHelp, locked: null, description: 'Answer the questions that stop people from buying.' },
  { type: 'Gallery', slug: 'gallery', name: 'Gallery', icon: Images, locked: null, description: 'Show your work — up to 12 images.' },
  { type: 'Cta', slug: 'cta', name: 'Call to action', icon: MousePointerClick, locked: null, description: 'A final nudge with one clear button.' },
  { type: 'Footer', slug: 'footer', name: 'Footer', icon: PanelBottom, locked: 'bottom', description: 'The copyright line at the very bottom.' },
]

const KIND_BY_TYPE = new Map(SECTION_KINDS.map((kind) => [kind.type, kind]))

export const kindOf = (type: SectionType): SectionKind => KIND_BY_TYPE.get(type) ?? SECTION_KINDS[1]

/** Hero and CTA are required once each (the backend rejects a page without them or with two). */
export const SINGLE_TYPES: SectionType[] = ['Navbar', 'Hero', 'Cta', 'Footer']

export const variantsOf = (templates: SectionTemplate[], type: SectionType) => templates.filter((template) => template.type === type)

export const variantName = (templates: SectionTemplate[], type: SectionType, variant: string) =>
  templates.find((template) => template.type === type && template.variant === variant)?.name ?? variant

/** The section background swatches; '' is the page default. */
export const SECTION_BACKGROUNDS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Page default' },
  { value: '#F3ECE2', label: 'Cream' },
  { value: '#E9DFD0', label: 'Sand' },
  { value: '#E6ECE4', label: 'Sage' },
  { value: '#1C1612', label: 'Ink' },
]

/** Luma's lime: the brand colour of a creator who hasn't picked one. */
export const DEFAULT_BRAND_COLOR = '#CDF24B'
