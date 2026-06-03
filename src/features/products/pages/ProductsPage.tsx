import {
  AlertTriangle,
  Archive,
  BookOpen,
  ExternalLink,
  Loader2,
  Package,
  Pencil,
  Plus,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useProductStore } from '../model/product-store'
import type { CreateProductRequest, Product, ProductStatus, ProductType, UpdateProductRequest } from '../model/types'

const PRODUCT_TYPES: { value: ProductType; label: string; icon: typeof Package }[] = [
  { value: 'Digital', label: 'Digital', icon: Package },
  { value: 'Service', label: 'Service', icon: Wrench },
  { value: 'Course', label: 'Course', icon: BookOpen },
]

export function ProductsPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)

  const products = useProductStore((s) => s.products)
  const loadStatus = useProductStore((s) => s.loadStatus)
  const loadProducts = useProductStore((s) => s.loadProducts)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [archivingProduct, setArchivingProduct] = useState<Product | null>(null)

  const isLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'
  const isCurrentSlug = currentCreator?.slug === slug
  const creator = isCurrentSlug ? currentCreator : null

  const currentPlan = creatorPlans.find((p) => p.code === creator?.planCode)
  const maxProducts = currentPlan?.limits['max_products'] ?? null

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  useEffect(() => {
    if (slug && loadStatus === 'idle') void loadProducts(slug)
  }, [slug, loadStatus, loadProducts])

  const atLimit =
    maxProducts !== null && maxProducts >= 0 && products.length >= maxProducts

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid size-7 place-items-center rounded-lg bg-neutral-950 text-white"
              onClick={() => navigate(`/app/${slug ?? ''}`)}
            >
              <span className="text-xs font-bold">CP</span>
            </button>
            <span className="text-sm text-neutral-300">/</span>
            <button
              type="button"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-950 transition"
              onClick={() => navigate(`/app/${slug ?? ''}`)}
            >
              {slug}
            </button>
            <span className="text-sm text-neutral-300">/</span>
            <span className="text-sm font-medium text-neutral-950">Products</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-8">
        {isLoading ? (
          <div className="flex h-32 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 text-sm text-neutral-400 shadow-sm">
            <Loader2 className="animate-spin" size={17} />
            Loading workspace
          </div>
        ) : !creator ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="font-semibold">Workspace not found</p>
            <button
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
              type="button"
              onClick={() => navigate('/')}
            >
              Go home
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-neutral-950">Products</h1>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {maxProducts !== null && maxProducts >= 0
                    ? `${products.length} / ${maxProducts} used`
                    : `${products.length} product${products.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                type="button"
                disabled={atLimit}
                title={atLimit ? `Plan limit reached (${maxProducts ?? 0})` : undefined}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => { setIsCreateOpen(true) }}
              >
                <Plus size={16} />
                New product
              </button>
            </div>

            {/* Limit warning */}
            {atLimit ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0" />
                Plan limit reached. Archive existing products or upgrade your plan.
              </div>
            ) : null}

            {/* Product list */}
            {loadStatus === 'loading' ? (
              <div className="flex h-24 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 text-sm text-neutral-400 shadow-sm">
                <Loader2 className="animate-spin" size={16} />
                Loading products…
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center shadow-sm">
                <Package size={32} className="text-neutral-300" />
                <p className="text-sm font-medium text-neutral-500">No products yet</p>
                <button
                  type="button"
                  disabled={atLimit}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                  onClick={() => { setIsCreateOpen(true) }}
                >
                  <Plus size={15} />
                  Create your first product
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.publicId}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onArchive={() => setArchivingProduct(product)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create modal */}
      {isCreateOpen && slug ? (
        <ProductFormModal
          slug={slug}
          onClose={() => setIsCreateOpen(false)}
        />
      ) : null}

      {/* Edit modal */}
      {editingProduct && slug ? (
        <ProductFormModal
          slug={slug}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      ) : null}

      {/* Archive confirmation */}
      {archivingProduct && slug ? (
        <ArchiveProductDialog
          slug={slug}
          product={archivingProduct}
          onClose={() => setArchivingProduct(null)}
        />
      ) : null}
    </div>
  )
}

/* ─── ProductCard ──────────────────────────────────────────────── */

function ProductCard({
  product,
  onEdit,
  onArchive,
}: {
  product: Product
  onEdit: () => void
  onArchive: () => void
}) {
  const typeIcon = PRODUCT_TYPES.find((t) => t.value === product.type)
  const TypeIcon = typeIcon?.icon ?? Package

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
        <TypeIcon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-neutral-950">{product.name}</p>
          <StatusBadge status={product.status} />
        </div>
        {product.description ? (
          <p className="mt-0.5 truncate text-xs text-neutral-400">{product.description}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-neutral-950">
          {formatPrice(product.priceCents)}
        </span>
        <span className="text-xs text-neutral-400">{product.type}</span>
        {product.accessUrl ? (
          <a
            href={product.accessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 transition hover:text-neutral-700"
            title="Open access URL"
          >
            <ExternalLink size={14} />
          </a>
        ) : null}
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
          onClick={onEdit}
        >
          <Pencil size={13} />
          Edit
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          onClick={onArchive}
        >
          <Archive size={13} />
          Archive
        </button>
      </div>
    </div>
  )
}

/* ─── ProductFormModal ─────────────────────────────────────────── */

function ProductFormModal({
  slug,
  product,
  onClose,
}: {
  slug: string
  product?: Product
  onClose: () => void
}) {
  const isEditing = !!product

  const createProductFn = useProductStore((s) => s.createProduct)
  const updateProductFn = useProductStore((s) => s.updateProduct)
  const createStatus = useProductStore((s) => s.createStatus)
  const createError = useProductStore((s) => s.createError)
  const updateStatus = useProductStore((s) => s.updateStatus)
  const updateError = useProductStore((s) => s.updateError)
  const resetCreateFeedback = useProductStore((s) => s.resetCreateFeedback)
  const resetUpdateFeedback = useProductStore((s) => s.resetUpdateFeedback)

  const isSubmitting = createStatus === 'submitting' || updateStatus === 'submitting'
  const error = isEditing ? updateError : createError

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [priceCents, setPriceCents] = useState(product ? String(product.priceCents / 100) : '')
  const [type, setType] = useState<ProductType>(product?.type ?? 'Digital')
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'Draft')
  const [accessUrl, setAccessUrl] = useState(product?.accessUrl ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnailUrl ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedCents = Math.round(parseFloat(priceCents.replace(',', '.')) * 100)
    if (isNaN(parsedCents)) return

    if (isEditing && product) {
      const request: UpdateProductRequest = {
        name,
        description,
        priceCents: parsedCents,
        type,
        status,
        accessUrl,
        thumbnailUrl,
      }
      const result = await updateProductFn(slug, product.publicId, request)
      if (result) { resetUpdateFeedback(); onClose() }
    } else {
      const request: CreateProductRequest = {
        name,
        description,
        priceCents: parsedCents,
        type,
        accessUrl,
        thumbnailUrl,
      }
      const result = await createProductFn(slug, request)
      if (result) { resetCreateFeedback(); onClose() }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-950">
            {isEditing ? 'Edit product' : 'New product'}
          </h2>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6">
          <div className="grid gap-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Notion template pack"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Description
              </label>
              <textarea
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of your product…"
                className="w-full resize-none rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </div>

            {/* Type + Price row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProductType)}
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                >
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Price (EUR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={priceCents}
                  onChange={(e) => setPriceCents(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                />
              </div>
            </div>

            {/* Status (only on edit) */}
            {isEditing ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                </select>
              </div>
            ) : null}

            {/* Access URL */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Access URL
              </label>
              <input
                type="url"
                value={accessUrl}
                onChange={(e) => setAccessUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </div>

            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            ) : null}
          </div>

          {/* Footer */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : null}
              {isEditing ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── ArchiveProductDialog ─────────────────────────────────────── */

function ArchiveProductDialog({
  slug,
  product,
  onClose,
}: {
  slug: string
  product: Product
  onClose: () => void
}) {
  const archiveProductFn = useProductStore((s) => s.archiveProduct)
  const archiveStatus = useProductStore((s) => s.archiveStatus)
  const archiveError = useProductStore((s) => s.archiveError)
  const resetArchiveFeedback = useProductStore((s) => s.resetArchiveFeedback)

  const isSubmitting = archiveStatus === 'submitting'

  const handleConfirm = async () => {
    const ok = await archiveProductFn(slug, product.publicId)
    if (ok) { resetArchiveFeedback(); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <AlertTriangle size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-950">Archive product?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          <span className="font-medium text-neutral-800">{product.name}</span> will be archived and
          hidden from your workspace. This frees up a product slot on your plan.
        </p>
        {archiveError ? (
          <p className="mt-3 text-sm text-red-600">{archiveError}</p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : null}
            Archive
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === 'Active')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
      <span className="size-1.5 rounded-full bg-neutral-400" />
      Draft
    </span>
  )
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}
