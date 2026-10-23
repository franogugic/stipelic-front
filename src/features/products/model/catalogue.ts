import type { LandingPage } from '../../landing-pages/model/types'
import { isFreeProduct } from './product-file'
import type { Product } from './types'

/**
 * The pages (not archived) that sell this product — or, for a free product, give it away — published ones first. A priced
 * product lives on Sales pages, a free one on lead-capture pages.
 */
export function sellingPagesOf(product: Product, pages: LandingPage[]) {
  const type = isFreeProduct(product) ? 'LeadGen' : 'Sales'
  return pages
    .filter((page) => page.productPublicId === product.publicId && page.type === type && page.status !== 'Archived')
    .sort((a, b) => Number(b.status === 'Published') - Number(a.status === 'Published'))
}

/** What a draft still needs before it can be sold: [label, done]. */
export function setupSteps(product: Product): Array<[string, boolean]> {
  return [
    ['Name and price', Boolean(product.name.trim())],
    ['Description', Boolean(product.description?.trim())],
    ['Cover image', Boolean(product.thumbnailUrl)],
    ['File uploaded', Boolean(product.fileName)],
  ]
}

/** The footer nudge of a draft: the file comes first (nothing can be delivered without it), then the rest in order. */
export function nextSetupHint(product: Product) {
  const steps = setupSteps(product)
  const verb = isFreeProduct(product) ? 'giving it away' : 'selling'
  const missing = steps.find(([label, done]) => label === 'File uploaded' && !done) ?? steps.find(([, done]) => !done)
  if (!missing) return `Set it to Active to start ${verb}`
  const hints: Record<string, string> = {
    'Name and price': 'Add a name and price',
    Description: 'Add a description',
    'Cover image': 'Add a cover image',
    'File uploaded': 'Upload the file',
  }
  return `${hints[missing[0]]} to start ${verb}`
}
