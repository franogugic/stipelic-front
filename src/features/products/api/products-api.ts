import { apiRequest } from '../../../shared/api/http-client'
import type { CreateProductRequest, Product, UpdateProductRequest } from '../model/types'

type ApiResponse<T> = {
  statusCode: number
  message: string
  code: string
  data: T
}

export async function listProducts(slug: string): Promise<Product[]> {
  const res = await apiRequest<ApiResponse<Product[]>>(`/api/creators/${slug}/products`)
  return res.data
}

export async function createProduct(slug: string, request: CreateProductRequest): Promise<Product> {
  const res = await apiRequest<ApiResponse<Product>>(`/api/creators/${slug}/products`, {
    method: 'POST',
    body: request,
  })
  return res.data
}

export async function updateProduct(
  slug: string,
  productId: string,
  request: UpdateProductRequest,
): Promise<Product> {
  const res = await apiRequest<ApiResponse<Product>>(
    `/api/creators/${slug}/products/${productId}`,
    { method: 'PUT', body: request },
  )
  return res.data
}

export async function archiveProduct(slug: string, productId: string): Promise<void> {
  await apiRequest<unknown>(`/api/creators/${slug}/products/${productId}`, { method: 'DELETE' })
}
