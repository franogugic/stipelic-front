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
}

export type CreateProductRequest = {
  name: string
  description: string
  priceCents: number
  type: ProductType
  accessUrl: string
  thumbnailUrl: string
}

export type UpdateProductRequest = CreateProductRequest & {
  status: ProductStatus
}
