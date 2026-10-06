import { Check, CircleAlert, Link as LinkIcon, Package } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { currencySymbol, number } from '../../../shared/lib/format'
import { formatPriceInput, parsePriceInput } from '../../../shared/lib/price-input'
import { useImageUpload } from '../../../shared/lib/use-image-upload'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Alert,
  Button,
  Card,
  Choice,
  EmptyState,
  ErrorState,
  Field,
  Input,
  InputAddon,
  InputGroup,
  PageHeader,
  Select,
  SkeletonRows,
  Textarea,
  Uploader,
  useToast,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { listProducts } from '../api/products-api'
import { useProductStore } from '../model/product-store'
import type { Product, ProductStatus, ProductType, WritableProductStatus } from '../model/types'

const NAME_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 2000
const ACCESS_URL_MAX_LENGTH = 2000
const FORM_ID = 'product-form'

const PRODUCT_TYPES: ProductType[] = ['Digital', 'Service', 'Course']
const STATUS_CHOICES: Array<[ProductStatus, string]> = [
  ['Active', 'Can be sold on landing pages'],
  ['Draft', 'Hidden while you work on it'],
  ['Archived', 'No longer for sale'],
]

type Errors = Partial<Record<'name' | 'price' | 'accessUrl', string>>
type Lookup = { status: 'loading' } | { status: 'error' } | { status: 'missing' } | { status: 'found'; product: Product }

function validate(name: string, price: string, accessUrl: string): Errors {
  const errors: Errors = {}
  if (!name.trim()) errors.name = 'Enter a name for the product.'
  const parsed = parsePriceInput(price)
  if (!parsed.ok) errors.price = parsed.error
  const link = accessUrl.trim()
  if (link) {
    if (link.length > ACCESS_URL_MAX_LENGTH) errors.accessUrl = `The link can’t be longer than ${number(ACCESS_URL_MAX_LENGTH)} characters.`
    else if (!isHttpUrl(link)) errors.accessUrl = 'Enter a valid http or https link.'
  }
  return errors
}

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** The file name of an uploaded image's address, for the uploader's preview. */
function fileNameOf(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '')
  } catch {
    return ''
  }
}

/** "New product" (`/products/new`) and "Edit product" (`/products/:productId/edit`), the prototype's `SCREENS['product-form']`. */
export function ProductFormPage() {
  const { slug = '', productId } = useParams<{ slug: string; productId: string }>()
  const isEditing = productId !== undefined

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)

  const [lookup, setLookup] = useState<Lookup>({ status: 'loading' })

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  // The list the store holds may leave archived products out, so the product comes straight from the API.
  const loadProduct = useCallback(() => {
    let active = true
    listProducts(slug, true)
      .then((products) => {
        if (!active) return
        const product = products.find((candidate) => candidate.publicId === productId)
        setLookup(product ? { status: 'found', product } : { status: 'missing' })
      })
      .catch(() => active && setLookup({ status: 'error' }))
    return () => {
      active = false
    }
  }, [slug, productId])

  useEffect(() => {
    if (isEditing && slug) return loadProduct()
  }, [isEditing, slug, loadProduct])

  const retryLoad = () => {
    setLookup({ status: 'loading' })
    loadProduct()
  }

  const documentTitle = isEditing ? 'Edit product · Luma' : 'New product · Luma'

  const content = () => {
    if (creatorLoading) return <SkeletonRows />
    if (!creator) return <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
    if (!isEditing) return <ProductForm key="new" slug={slug} product={null} currency={creator.defaultCurrency} planCode={creator.planCode} planName={creator.planName} />
    if (lookup.status === 'loading') return <SkeletonRows />
    if (lookup.status === 'error') return <ErrorState onRetry={retryLoad} />
    if (lookup.status === 'missing') {
      return (
        <EmptyState
          icon={Package}
          title="Product not found"
          text="This product doesn’t exist in your workspace."
          action={{ label: 'Back to products', variant: 'secondary', to: `/app/${slug}/products` }}
        />
      )
    }
    return (
      <ProductForm
        key={lookup.product.publicId}
        slug={slug}
        product={lookup.product}
        currency={creator.defaultCurrency}
        planCode={creator.planCode}
        planName={creator.planName}
      />
    )
  }

  return (
    <AppShell slug={slug} activeSection="products" documentTitle={documentTitle}>
      {content()}
    </AppShell>
  )
}

function ProductForm({
  slug,
  product,
  currency,
  planCode,
  planName,
}: {
  slug: string
  product: Product | null
  currency: string
  planCode: string
  planName: string
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const createProduct = useProductStore((s) => s.createProduct)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const archiveProduct = useProductStore((s) => s.archiveProduct)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const products = useProductStore((s) => s.products)

  const isEditing = product !== null
  // Archived products can't be edited (the API refuses), so the form only shows them.
  const readOnly = product?.status === 'Archived'

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? formatPriceInput(product.priceCents) : '')
  const [type, setType] = useState<ProductType>(product?.type ?? 'Digital')
  const [accessUrl, setAccessUrl] = useState(product?.accessUrl ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnailUrl ?? '')
  // New products start as a draft; the status card is where "Active" is chosen.
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'Draft')
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const upload = useImageUpload({ slug, purpose: 'ProductThumbnail', onUploaded: setThumbnailUrl })

  // Creating needs room under the plan's product limit (archived products don't count).
  const maxProducts = creatorPlans.find((plan) => plan.code === planCode)?.limits['max_products']
  const liveProductCount = products.filter((candidate) => candidate.status !== 'Archived').length
  const atLimit = !isEditing && maxProducts !== undefined && maxProducts >= 0 && liveProductCount >= maxProducts
  const limitReason = atLimit
    ? maxProducts === 1
      ? `You’ve used your 1 product on the ${planName} plan.`
      : `You’ve used all ${number(maxProducts)} products on the ${planName} plan.`
    : undefined

  // After a failed submit, the errors follow the fields as they are corrected.
  const revalidate = (next: { name?: string; price?: string; accessUrl?: string }) => {
    if (submitted) setErrors(validate(next.name ?? name, next.price ?? price, next.accessUrl ?? accessUrl))
  }

  const goToList = () => navigate(`/app/${slug}/products`)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving || readOnly) return
    setSubmitted(true)
    const found = validate(name, price, accessUrl)
    setErrors(found)
    const parsed = parsePriceInput(price)
    if (Object.keys(found).length > 0 || !parsed.ok) return

    setSaving(true)
    setRequestError(null)
    const fields = {
      name: name.trim(),
      description: description.trim(),
      priceCents: parsed.cents,
      type,
      accessUrl: accessUrl.trim(),
      thumbnailUrl,
    }
    // Archiving is its own endpoint: save the fields first, with the status the product has (or, new, Draft).
    const archiveAfter = status === 'Archived'
    const writableStatus: WritableProductStatus = status === 'Archived' ? (product?.status === 'Active' ? 'Active' : 'Draft') : status

    const state = useProductStore.getState
    const saved = product
      ? await updateProduct(slug, product.publicId, { ...fields, status: writableStatus })
      : await createProduct(slug, { ...fields, status: writableStatus })
    if (!saved) {
      const message = (product ? state().updateError : state().createError) ?? 'We couldn’t save the product. Please try again.'
      state().resetUpdateFeedback()
      state().resetCreateFeedback()
      setSaving(false)
      setRequestError(message)
      return
    }

    if (archiveAfter && !(await archiveProduct(slug, saved.publicId))) {
      const message = state().archiveError ?? 'Please try again.'
      state().resetArchiveFeedback()
      setSaving(false)
      toast({ tone: 'danger', title: 'Saved, but the product couldn’t be archived', message })
      // A product that was just created now exists: stay on its edit page so another Save doesn't create a duplicate.
      if (!product) navigate(`/app/${slug}/products/${saved.publicId}/edit`, { replace: true })
      else setRequestError(message)
      return
    }

    toast({ tone: 'success', title: 'Product saved' })
    goToList()
  }

  return (
    <>
      <PageHeader
        eyebrow="Products"
        title={
          isEditing ? (
            <>
              Edit <em>product</em>
            </>
          ) : (
            <>
              New <em>product</em>
            </>
          )
        }
        actions={
          <>
            <Button variant="ghost" to={`/app/${slug}/products`}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Check}
              type="submit"
              form={FORM_ID}
              loading={saving}
              disabledReason={readOnly ? 'Restore the product to edit it.' : limitReason}
            >
              Save product
            </Button>
          </>
        }
      />

      <div className="stack stack--lg">
        {readOnly && (
          <Alert tone="info" icon={CircleAlert}>
            This product is archived. Restore it from the products list to edit it.
          </Alert>
        )}
        {requestError && (
          <Alert tone="danger" icon={CircleAlert} live>
            {requestError}
          </Alert>
        )}

        <form id={FORM_ID} noValidate onSubmit={(event) => void submit(event)}>
          <fieldset className="form-fieldset" disabled={readOnly}>
            <div className="grid grid--2 grid--gap-lg">
              <Card title="Details">
                <div className="form">
                  <Field label="Name" error={errors.name}>
                    {(control) => (
                      <Input
                        {...control}
                        value={name}
                        maxLength={NAME_MAX_LENGTH}
                        autoComplete="off"
                        onChange={(event) => {
                          setName(event.target.value)
                          revalidate({ name: event.target.value })
                        }}
                      />
                    )}
                  </Field>
                  <Field label="Description">
                    {(control) => (
                      <Textarea
                        {...control}
                        value={description}
                        maxLength={DESCRIPTION_MAX_LENGTH}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    )}
                  </Field>
                  <div className="form-row">
                    <Field label="Price" error={errors.price}>
                      {(control) => (
                        <InputGroup>
                          <InputAddon>{currencySymbol(currency)}</InputAddon>
                          <Input
                            {...control}
                            className="num"
                            inputMode="decimal"
                            autoComplete="off"
                            value={price}
                            onChange={(event) => {
                              setPrice(event.target.value)
                              revalidate({ price: event.target.value })
                            }}
                          />
                        </InputGroup>
                      )}
                    </Field>
                    <Field label="Type">
                      {(control) => (
                        <Select {...control} value={type} onChange={(event) => setType(event.target.value as ProductType)}>
                          {PRODUCT_TYPES.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>
                  <Field label="Access link" hint="Buyers receive this link by email right after payment." error={errors.accessUrl}>
                    {(control) => (
                      <InputGroup>
                        <InputAddon>
                          <LinkIcon />
                        </InputAddon>
                        <Input
                          {...control}
                          type="url"
                          inputMode="url"
                          autoComplete="off"
                          value={accessUrl}
                          onChange={(event) => {
                            setAccessUrl(event.target.value)
                            revalidate({ accessUrl: event.target.value })
                          }}
                        />
                      </InputGroup>
                    )}
                  </Field>
                </div>
              </Card>

              <div className="stack stack--lg">
                <Card title="Thumbnail">
                  <Uploader
                    label="Thumbnail"
                    aspect="wide"
                    value={thumbnailUrl || null}
                    fileName={upload.fileName ?? fileNameOf(thumbnailUrl)}
                    uploading={upload.uploading}
                    progress={upload.progress}
                    error={upload.error}
                    onSelect={(file) => void upload.upload(file)}
                    onRemove={() => {
                      setThumbnailUrl('')
                      upload.clearError()
                    }}
                  />
                </Card>
                <Card title="Status">
                  <div className="stack stack--sm">
                    {STATUS_CHOICES.map(([value, text]) => (
                      <Choice
                        key={value}
                        name="status"
                        value={value}
                        title={value}
                        text={text}
                        checked={status === value}
                        onChange={() => setStatus(value)}
                      />
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </>
  )
}
