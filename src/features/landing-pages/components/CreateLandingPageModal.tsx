import { CircleAlert, MailPlus, PanelsTopLeft, ShoppingBag } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../../../shared/lib/format'
import { Alert, Badge, Button, Choice, Field, Input, InputAddon, InputGroup, Modal, Select } from '../../../shared/ui/ledger'
import { listProducts } from '../../products/api/products-api'
import type { Product } from '../../products/model/types'
import { useLandingPageStore } from '../model/landing-page-store'
import type { LandingPage, LandingPageType } from '../model/types'

const MAX_LENGTH = 100
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FORM_ID = 'create-landing-page-form'

type ProductsLoad = { status: 'loading' } | { status: 'error' } | { status: 'success'; products: Product[] }
type Errors = Partial<Record<'title' | 'slug' | 'product', string>>

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, '')
}

function validate(title: string, slug: string, productId: string): Errors {
  const errors: Errors = {}
  if (!title.trim()) errors.title = 'Enter a title for the page.'
  if (!slug) errors.slug = 'Enter the page URL.'
  else if (!SLUG_PATTERN.test(slug)) errors.slug = 'Use lowercase letters, numbers and single dashes.'
  if (!productId) errors.product = 'Choose the product this page is for.'
  return errors
}

/**
 * "New landing page" (not designed in the prototype; composed from its components and the styleguide's
 * "Page type" choice). Mount it with a new `key` per opening so every opening starts from an empty form.
 */
export function CreateLandingPageModal({
  open,
  creatorSlug,
  currency,
  onClose,
  onCreated,
}: {
  open: boolean
  creatorSlug: string
  currency: string
  onClose: () => void
  onCreated: (page: LandingPage) => void
}) {
  const createPage = useLandingPageStore((s) => s.createPage)
  const resetMutateFeedback = useLandingPageStore((s) => s.resetMutateFeedback)

  const [products, setProducts] = useState<ProductsLoad>({ status: 'loading' })
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [type, setType] = useState<LandingPageType>('LeadGen')
  const [productId, setProductId] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const loadProducts = useCallback(() => {
    let active = true
    listProducts(creatorSlug)
      .then((list) => active && setProducts({ status: 'success', products: list.filter((p) => p.status !== 'Archived') }))
      .catch(() => active && setProducts({ status: 'error' }))
    return () => {
      active = false
    }
  }, [creatorSlug])

  // Loads once per opening; the component is re-keyed for every opening.
  useEffect(() => {
    if (open) return loadProducts()
  }, [open, loadProducts])

  const retryProducts = () => {
    setProducts({ status: 'loading' })
    loadProducts()
  }

  // After a failed submit, errors follow the fields as they are corrected.
  const revalidate = (next: { title?: string; slug?: string; productId?: string }) => {
    if (submitted) setErrors(validate(next.title ?? title, next.slug ?? slug, next.productId ?? productId))
  }

  const changeTitle = (value: string) => {
    setTitle(value)
    const nextSlug = slugEdited ? slug : slugify(value)
    if (!slugEdited) setSlug(nextSlug)
    revalidate({ title: value, slug: nextSlug })
  }

  const changeSlug = (value: string) => {
    const next = value.toLowerCase()
    setSlugEdited(true)
    setSlug(next)
    revalidate({ slug: next })
  }

  const changeProduct = (value: string) => {
    setProductId(value)
    revalidate({ productId: value })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitted(true)
    const found = validate(title, slug, productId)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setRequestError(null)
    const page = await createPage(creatorSlug, { title: title.trim(), slug, type, productId })
    const { mutateError, mutateErrorStatus } = useLandingPageStore.getState()
    resetMutateFeedback()
    setSubmitting(false)
    if (page) {
      onCreated(page)
      return
    }
    // 409 is the one field-specific failure: the URL is taken.
    if (mutateErrorStatus === 409) setErrors((current) => ({ ...current, slug: mutateError ?? 'This URL is already taken.' }))
    else setRequestError(mutateError ?? 'We couldn’t create the page. Please try again.')
  }

  const productList = products.status === 'success' ? products.products : []
  const noProducts = products.status === 'success' && productList.length === 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!submitting}
      title="New landing page"
      description="Give it a name and a URL — you can change both later."
      icon={PanelsTopLeft}
      tone="accent"
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={submitting} disabled={noProducts}>
            Create page
          </Button>
        </>
      }
    >
      <form className="form" id={FORM_ID} noValidate onSubmit={(event) => void submit(event)}>
        {requestError && (
          <Alert tone="danger" icon={CircleAlert} live>
            {requestError}
          </Alert>
        )}
        <Field label="Title" error={errors.title}>
          {(control) => (
            <Input
              {...control}
              name="title"
              type="text"
              placeholder="e.g. Autumn Presets"
              maxLength={MAX_LENGTH}
              autoComplete="off"
              data-autofocus
              value={title}
              onChange={(event) => changeTitle(event.target.value)}
            />
          )}
        </Field>
        <Field label="Page URL" hint="Lowercase letters, numbers and dashes." error={errors.slug}>
          {(control) => (
            <InputGroup>
              <InputAddon>{`${window.location.host}/p/${creatorSlug}/`}</InputAddon>
              <Input
                {...control}
                name="slug"
                type="text"
                maxLength={MAX_LENGTH}
                autoComplete="off"
                spellCheck={false}
                value={slug}
                onChange={(event) => changeSlug(event.target.value)}
              />
            </InputGroup>
          )}
        </Field>
        <fieldset className="choice-fieldset">
          <legend className="field__label">Page type</legend>
          <div className="grid grid--2">
            <Choice
              name="page-type"
              value="LeadGen"
              checked={type === 'LeadGen'}
              onChange={() => setType('LeadGen')}
              visual={
                <Badge tone="info" icon={MailPlus}>
                  Lead capture
                </Badge>
              }
              title="Collect emails"
              text="A free offer in exchange for an email address."
            />
            <Choice
              name="page-type"
              value="Sales"
              checked={type === 'Sales'}
              onChange={() => setType('Sales')}
              visual={
                <Badge tone="accent" icon={ShoppingBag}>
                  Sales
                </Badge>
              }
              title="Sell a product"
              text="Card checkout through Stripe, delivered by email."
            />
          </div>
        </fieldset>
        <Field
          label="Product"
          hint={
            noProducts ? (
              <>
                You don’t have any products yet. <Link className="link" to={`/app/${creatorSlug}/products`}>Create a product</Link> first.
              </>
            ) : (
              'The product can’t be changed after the page is created.'
            )
          }
          error={
            products.status === 'error' ? (
              <>
                We couldn’t load your products.{' '}
                <button className="link" type="button" onClick={retryProducts}>
                  Try again
                </button>
              </>
            ) : (
              errors.product
            )
          }
        >
          {(control) => (
            <Select
              {...control}
              name="product"
              value={productId}
              disabled={products.status !== 'success' || noProducts}
              onChange={(event) => changeProduct(event.target.value)}
            >
              <option value="" disabled>
                {products.status === 'loading' ? 'Loading products…' : 'Choose a product'}
              </option>
              {productList.map((product) => (
                <option key={product.publicId} value={product.publicId}>
                  {`${product.name} · ${money(product.priceCents, currency)}`}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  )
}
