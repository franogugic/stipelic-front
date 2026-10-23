export type ProductStatus = 'Draft' | 'Active' | 'Archived'

export type Product = {
  publicId: string
  name: string
  description: string | null
  /** 0 = a free product, given away for an email on lead pages instead of sold. */
  priceCents: number
  status: ProductStatus
  /** The product's document (PDF, EPUB or ZIP); null while none is uploaded. An Active product always has one. */
  fileName: string | null
  fileSizeBytes: number | null
  fileContentType: string | null
  fileUploadedAt: string | null
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
  revenueCents: number
  paidOrderCount: number
  /** Paid orders per calendar month for the last 6 months, oldest first, the current month last. */
  salesTrend: number[]
  /**
   * A free product's sign-ups (people who left their email on a lead page that gives it away). Not in the F8.1 spec: until
   * the API sends them the cards show "—" for a free product.
   */
  signupCount?: number
  /** Every order of the product, any status, all time (R6). The orders product filter lists archived products with orders. */
  orderCount?: number
  signupsThisMonth?: number
  signupsTrend?: number[]
}

type ProductFields = {
  name: string
  description: string
  priceCents: number
  thumbnailUrl: string
  /** The reference a confirmed upload returned. Omitted: the product keeps the file it has. */
  fileReference?: string
}

/** Active or Draft; omitted, the API keeps the current status (Draft on create). Archiving has its own endpoint. */
export type WritableProductStatus = Exclude<ProductStatus, 'Archived'>

export type CreateProductRequest = ProductFields & { status?: WritableProductStatus }

export type UpdateProductRequest = ProductFields & { status?: WritableProductStatus }

/** `GET …/products/{id}/signups` — the newest sign-ups across the lead pages that give a product away. */
export type ProductSignups = {
  /** Distinct emails that ever signed up on the product's lead pages. */
  total: number
  signups: Array<{
    email: string
    capturedAt: string
    unsubscribed: boolean
    landingPagePublicId: string
    landingPageTitle: string
  }>
}
