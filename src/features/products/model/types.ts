export type ProductType = 'Digital' | 'Service' | 'Course'
export type ProductStatus = 'Draft' | 'Active' | 'Archived'

export type Product = {
  publicId: string
  name: string
  description: string | null
  priceCents: number
  type: ProductType
  status: ProductStatus
  accessUrl: string | null
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
  revenueCents: number
  paidOrderCount: number
}

type ProductFields = {
  name: string
  description: string
  priceCents: number
  type: ProductType
  accessUrl: string
  thumbnailUrl: string
}

/** Active or Draft; omitted, the API keeps the current status (Draft on create). Archiving has its own endpoint. */
export type WritableProductStatus = Exclude<ProductStatus, 'Archived'>

export type CreateProductRequest = ProductFields & { status?: WritableProductStatus }

export type UpdateProductRequest = ProductFields & { status?: WritableProductStatus }

export type ProductAnalyticsRange = '30d' | '3m' | '6m' | '1y'

export type ProductAnalytics = {
  revenueCents: number
  salesCount: number
  thisMonthRevenueCents: number
  contactCount: number
  /** "day" for 30d, "month" otherwise. */
  granularity: 'day' | 'month'
  /** Oldest first, every bucket present; `bucketStart` is "yyyy-MM-dd". */
  points: Array<{ bucketStart: string; revenueCents: number }>
  sellingPages: Array<{ publicId: string; title: string; status: 'Draft' | 'Published' | 'Archived' }>
}
