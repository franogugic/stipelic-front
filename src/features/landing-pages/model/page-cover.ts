import type { CSSProperties } from 'react'
import { cover } from '../../../shared/lib/cover'

/** Cover for a landing page tile: the product's thumbnail, else a prototype variant picked from the page's id. */
export function pageCover(page: { publicId: string; productThumbnailUrl: string | null }): {
  className: string
  style?: CSSProperties
} {
  return cover(page.publicId, page.productThumbnailUrl)
}
