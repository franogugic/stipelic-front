import { PencilLine } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Field, Input, InputAddon, InputGroup, Modal, Select } from '../../../../shared/ui/ledger'
import { fileFormatOf } from '../../../products/model/product-file'
import type { Product } from '../../../products/model/types'
import type { LandingPageType } from '../../model/types'
import { DocumentWarning } from './LeadDocument'

const FORM_ID = 'page-settings-form'
const MAX_LENGTH = 100
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type PageSettingsValues = {
  title: string
  slug: string
  /** A lead page's document; null = newsletter only. Always null for a sales page. */
  productId: string | null
}

/**
 * The editor's page settings: the title and the address; for a lead page also "Document people get" — its Active free
 * products (and the page's current one, whatever its state), or "No document — newsletter only". Mount it with a new
 * `key` per opening.
 */
export function PageSettingsModal({
  open,
  creatorSlug,
  host,
  pageType,
  published,
  initial,
  products,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean
  creatorSlug: string
  /** "luma.app/p/acme/" — the fixed start of the address. */
  host: string
  pageType: LandingPageType
  published: boolean
  initial: PageSettingsValues
  /** Every product of the workspace (the picker filters them). */
  products: Product[]
  busy: boolean
  error: string | null
  onClose: () => void
  onSave: (values: PageSettingsValues) => void
}) {
  const lead = pageType === 'LeadGen'
  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(initial.slug)
  const [productId, setProductId] = useState(initial.productId ?? '')
  const [submitted, setSubmitted] = useState(false)

  const titleError = title.trim() ? undefined : 'Enter a title for the page.'
  const slugError = !slug ? 'Enter the page address.' : SLUG_PATTERN.test(slug) ? undefined : 'Use lowercase letters, numbers and single dashes.'

  // What a lead page can give away: its Active free products, plus the one it has now (so it stays selectable).
  const documents = products.filter(
    (product) => product.priceCents === 0 && (product.status === 'Active' || product.publicId === initial.productId),
  )
  const chosen = documents.find((product) => product.publicId === productId) ?? null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (titleError || slugError || busy) return
    onSave({ title: title.trim(), slug, productId: lead ? productId || null : null })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!busy}
      size="sm"
      title={lead ? 'Page settings' : 'Page title and address'}
      description={
        published ? 'Changing the address breaks links you’ve already shared.' : 'The address comes from the title until you change it yourself.'
      }
      icon={PencilLine}
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <form className="form" id={FORM_ID} noValidate onSubmit={submit}>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <Field label="Title" hint="Shown in the browser tab and when the link is shared." error={submitted ? titleError : undefined}>
          {(control) => <Input {...control} maxLength={MAX_LENGTH} autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} />}
        </Field>
        <Field label="Page address" hint="Lowercase letters, numbers and dashes." error={submitted ? slugError : undefined}>
          {(control) => (
            <InputGroup>
              <InputAddon>{host}</InputAddon>
              <Input
                {...control}
                maxLength={MAX_LENGTH}
                autoComplete="off"
                spellCheck={false}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </InputGroup>
          )}
        </Field>
        {lead && (
          <>
            <Field
              label="Document people get"
              hint="Your free products. Everyone who signs up gets an email with a personal link to download it."
            >
              {(control) => (
                <Select {...control} value={productId} onChange={(event) => setProductId(event.target.value)}>
                  {documents.map((product) => (
                    <option key={product.publicId} value={product.publicId}>
                      {`${product.name} · ${product.fileName ? `Free ${fileFormatOf(product.fileName) ?? 'file'}` : 'no file yet'}`}
                    </option>
                  ))}
                  <option value="">No document — newsletter only</option>
                </Select>
              )}
            </Field>
            <DocumentWarning product={chosen} slug={creatorSlug} />
          </>
        )}
      </form>
    </Modal>
  )
}
