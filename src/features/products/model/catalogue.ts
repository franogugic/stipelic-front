import type { LandingPage } from '../../landing-pages/model/types'
import type { Product } from './types'

/** The sales pages (not archived) that sell this product, published ones first. */
export function sellingPagesOf(product: Product, pages: LandingPage[]) {
  return pages
    .filter((page) => page.productPublicId === product.publicId && page.type === 'Sales' && page.status !== 'Archived')
    .sort((a, b) => Number(b.status === 'Published') - Number(a.status === 'Published'))
}

/** What a draft still needs before it can be sold: [label, done]. */
export function setupSteps(product: Product): Array<[string, boolean]> {
  return [
    ['Name and price', Boolean(product.name.trim() && product.priceCents > 0)],
    ['Description', Boolean(product.description?.trim())],
    ['Cover image', Boolean(product.thumbnailUrl)],
    ['Access link', Boolean(product.accessUrl)],
  ]
}

/** The footer nudge of a draft: the access link comes first (nothing can be delivered without it), then the rest in order. */
export function nextSetupHint(product: Product) {
  const steps = setupSteps(product)
  const missing = steps.find(([label, done]) => label === 'Access link' && !done) ?? steps.find(([, done]) => !done)
  if (!missing) return 'Set it to Active to start selling'
  const hints: Record<string, string> = {
    'Name and price': 'Add a name and price',
    Description: 'Add a description',
    'Cover image': 'Add a cover image',
    'Access link': 'Add an access link',
  }
  return `${hints[missing[0]]} to start selling`
}
