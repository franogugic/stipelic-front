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
import { AppShell } from '../../../shared/ui/AppShell'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useProductStore } from '../model/product-store'
import type {
  CreateProductRequest,
  Product,
  ProductStatus,
  ProductType,
  UpdateProductRequest,
} from '../model/types'

const PRODUCT_TYPES: { value: ProductType; label: string; icon: typeof Package }[] = [
  { value: 'Digital', label: 'Digital', icon: Package },
  { value: 'Service', label: 'Service', icon: Wrench },
  { value: 'Course',  label: 'Course',  icon: BookOpen },
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
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const currentPlan = creatorPlans.find((p) => p.code === creator?.planCode)
  const maxProducts = currentPlan?.limits['max_products'] ?? null
  const atLimit = maxProducts !== null && maxProducts >= 0 && products.length >= maxProducts

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  useEffect(() => {
    if (slug && loadStatus === 'idle') void loadProducts(slug)
  }, [slug, loadStatus, loadProducts])

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="products">
      <div className="px-8 py-8">

        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading workspace…
          </div>
        ) : !creator ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="font-semibold text-neutral-950">Workspace not found</p>
            <button
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
              type="button"
              onClick={() => navigate('/')}
            >
              Go home
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Products</h1>
                <p className="mt-1 text-sm text-neutral-400">
                  {maxProducts !== null && maxProducts >= 0
                    ? `${products.length} of ${maxProducts} used`
                    : `${products.length} product${products.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                type="button"
                disabled={atLimit}
                title={atLimit ? `Plan limit reached (${maxProducts ?? 0})` : undefined}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={15} />
                New product
              </button>
            </div>

            {atLimit ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                Plan limit reached. Archive existing products or upgrade your plan.
              </div>
            ) : null}

            {loadStatus === 'loading' ? (
              <div className="flex h-32 items-center justify-center gap-3 text-sm text-neutral-400">
                <Loader2 className="animate-spin" size={16} />
                Loading products…
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
                  <Package size={24} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-950">No products yet</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    Add a digital product, service, or course to start selling.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={atLimit}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus size={15} />
                  Create first product
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="grid grid-cols-[auto_1fr_160px_100px_100px] items-center border-b border-neutral-100 px-5 py-3">
                  <span className="w-10" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Product</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Type</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Price</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Status</p>
                </div>
                <ul className="divide-y divide-neutral-100">
                  {products.map((product) => {
                    const typeInfo = PRODUCT_TYPES.find((t) => t.value === product.type)
                    const TypeIcon = typeInfo?.icon ?? Package
                    return (
                      <li key={product.publicId} className="group">
                        <div className="grid grid-cols-[auto_1fr_160px_100px_100px] items-center px-5 py-4">
                          <span className="mr-4 grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
                            <TypeIcon size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-950">{product.name}</p>
                            {product.description ? (
                              <p className="mt-0.5 truncate text-xs text-neutral-400">{product.description}</p>
                            ) : null}
                          </div>
                          <p className="text-xs font-medium text-neutral-600">{product.type}</p>
                          <p className="text-sm font-semibold text-neutral-950">{formatPrice(product.priceCents)}</p>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={product.status} />
                          </div>
                        </div>
                        {/* Row actions revealed on hover */}
                        <div className="hidden border-t border-neutral-50 bg-neutral-50 px-5 py-2.5 group-hover:flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          {product.accessUrl ? (
                            <a
                              href={product.accessUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
                            >
                              <ExternalLink size={12} />
                              Access URL
                            </a>
                          ) : null}
                          <button
                            type="button"
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setArchivingProduct(product)}
                          >
                            <Archive size={12} />
                            Archive
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {isCreateOpen && slug ? (
        <ProductFormModal slug={slug} onClose={() => setIsCreateOpen(false)} />
      ) : null}
      {editingProduct && slug ? (
        <ProductFormModal slug={slug} product={editingProduct} onClose={() => setEditingProduct(null)} />
      ) : null}
      {archivingProduct && slug ? (
        <ArchiveProductDialog slug={slug} product={archivingProduct} onClose={() => setArchivingProduct(null)} />
      ) : null}
    </AppShell>
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
      const req: UpdateProductRequest = { name, description, priceCents: parsedCents, type, status, accessUrl, thumbnailUrl }
      const result = await updateProductFn(slug, product.publicId, req)
      if (result) { resetUpdateFeedback(); onClose() }
    } else {
      const req: CreateProductRequest = { name, description, priceCents: parsedCents, type, accessUrl, thumbnailUrl }
      const result = await createProductFn(slug, req)
      if (result) { resetCreateFeedback(); onClose() }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl">
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
          <div className="grid gap-5">
            <ModalField label="Name" required>
              <input type="text" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Notion template pack" className={inputClass} />
            </ModalField>

            <ModalField label="Description">
              <textarea rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of your product…" className={`${inputClass} resize-none`} />
            </ModalField>

            <div className="grid grid-cols-2 gap-4">
              <ModalField label="Type">
                <select value={type} onChange={(e) => setType(e.target.value as ProductType)} className={inputClass}>
                  {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </ModalField>
              <ModalField label="Price (EUR)" required>
                <input type="number" min="0" step="0.01" required value={priceCents} onChange={(e) => setPriceCents(e.target.value)} placeholder="0.00" className={inputClass} />
              </ModalField>
            </div>

            {isEditing ? (
              <ModalField label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)} className={inputClass}>
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                </select>
              </ModalField>
            ) : null}

            <ModalField label="Access URL">
              <input type="url" value={accessUrl} onChange={(e) => setAccessUrl(e.target.value)} placeholder="https://drive.google.com/…" className={inputClass} />
            </ModalField>

            <ModalField label="Thumbnail URL">
              <input type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" className={inputClass} />
            </ModalField>

            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            ) : null}
          </div>

          <div className="mt-6 flex gap-3">
            <button type="button" className="flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50" disabled={isSubmitting} onClick={onClose}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40">
              {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : null}
              {isEditing ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-neutral-700">
        {label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100'

/* ─── ArchiveProductDialog ─────────────────────────────────────── */

function ArchiveProductDialog({ slug, product, onClose }: { slug: string; product: Product; onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-50">
          <AlertTriangle className="text-amber-600" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-950">Archive product?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          <span className="font-medium text-neutral-800">{product.name}</span> will be archived and hidden from your workspace.
        </p>
        {archiveError ? <p className="mt-3 text-sm text-red-600">{archiveError}</p> : null}
        <div className="mt-6 flex gap-3">
          <button type="button" className="flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50" disabled={isSubmitting} onClick={onClose}>Cancel</button>
          <button type="button" disabled={isSubmitting} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40" onClick={() => void handleConfirm()}>
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500">
      <span className="size-1.5 rounded-full bg-neutral-400" />
      Draft
    </span>
  )
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(cents / 100)
}
