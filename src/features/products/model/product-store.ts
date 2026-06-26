import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { archiveProduct, createProduct, listProducts, updateProduct } from '../api/products-api'
import type { CreateProductRequest, Product, UpdateProductRequest } from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type MutateStatus = 'idle' | 'submitting' | 'success' | 'error'

type ProductState = {
  products: Product[]
  loadStatus: LoadStatus
  loadError: string | null
  createStatus: MutateStatus
  createError: string | null
  updateStatus: MutateStatus
  updateError: string | null
  archiveStatus: MutateStatus
  archiveError: string | null

  loadProducts: (slug: string) => Promise<void>
  createProduct: (slug: string, request: CreateProductRequest) => Promise<Product | null>
  updateProduct: (slug: string, productId: string, request: UpdateProductRequest) => Promise<Product | null>
  archiveProduct: (slug: string, productId: string) => Promise<boolean>
  resetCreateFeedback: () => void
  resetUpdateFeedback: () => void
  resetArchiveFeedback: () => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loadStatus: 'idle',
  loadError: null,
  createStatus: 'idle',
  createError: null,
  updateStatus: 'idle',
  updateError: null,
  archiveStatus: 'idle',
  archiveError: null,

  loadProducts: async (slug) => {
    set({ loadStatus: 'loading', loadError: null })
    try {
      const products = await listProducts(slug)
      set({ products, loadStatus: 'success' })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load products.'
      set({ loadStatus: 'error', loadError: message })
    }
  },

  createProduct: async (slug, request) => {
    set({ createStatus: 'submitting', createError: null })
    try {
      const product = await createProduct(slug, request)
      set((s) => ({ products: [product, ...s.products], createStatus: 'success' }))
      return product
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create product.'
      set({ createStatus: 'error', createError: message })
      return null
    }
  },

  updateProduct: async (slug, productId, request) => {
    set({ updateStatus: 'submitting', updateError: null })
    try {
      const updated = await updateProduct(slug, productId, request)
      set((s) => ({
        products: s.products.map((p) => (p.publicId === productId ? updated : p)),
        updateStatus: 'success',
      }))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update product.'
      set({ updateStatus: 'error', updateError: message })
      return null
    }
  },

  archiveProduct: async (slug, productId) => {
    set({ archiveStatus: 'submitting', archiveError: null })
    try {
      await archiveProduct(slug, productId)
      set((s) => ({
        products: s.products.filter((p) => p.publicId !== productId),
        archiveStatus: 'success',
      }))
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to archive product.'
      set({ archiveStatus: 'error', archiveError: message })
      return false
    }
  },

  resetCreateFeedback: () => set({ createStatus: 'idle', createError: null }),
  resetUpdateFeedback: () => set({ updateStatus: 'idle', updateError: null }),
  resetArchiveFeedback: () => set({ archiveStatus: 'idle', archiveError: null }),
}))
