import { FileDown, FileX, Info, Mail, Upload } from 'lucide-react'
import { Button } from '../../../../shared/ui/ledger'
import { fileMeta } from '../../../products/model/product-file'
import type { Product } from '../../../products/model/types'

/** Said in the page settings when the chosen document can't be downloaded yet (or no document is chosen). */
export function DocumentWarning({ product, slug }: { product: Product | null; slug: string }) {
  if (product && !product.fileName) {
    return (
      <div className="alert alert--warning document-warning" role="status">
        <FileX />
        <div className="alert__body">
          <p>
            “{product.name}” has no file yet, so people who sign up would get nothing to download.{' '}
            <a className="link" href={`/app/${slug}/products/${product.publicId}/edit`}>
              Upload the file
            </a>
          </p>
        </div>
      </div>
    )
  }
  if (!product) {
    return (
      <p className="quiet-note">
        <Info />
        <span>A plain newsletter sign-up: people join your list, and no email is sent.</span>
      </p>
    )
  }
  return null
}

/** In the editor, above the page: what sign-ups of a lead page get, or what's missing before they get anything. */
export function LeadDocumentHint({
  product,
  slug,
  onChange,
}: {
  /** The page's document; null for a newsletter-only page. */
  product: Product | null
  slug: string
  onChange: () => void
}) {
  if (!product) {
    return (
      <div className="alert alert--warning draft-hint" role="status">
        <FileX />
        <div className="alert__body">
          <p className="alert__title">No document — this page is a plain newsletter sign-up</p>
          <p>People who sign up join your list, but get no email. Give away a free document and they get a personal link to download it.</p>
          <div className="cluster cluster--sm">
            <Button variant="secondary" size="sm" icon={FileDown} onClick={onChange}>
              Choose a document
            </Button>
          </div>
        </div>
      </div>
    )
  }
  if (!product.fileName || product.fileSizeBytes === null) {
    return (
      <div className="alert alert--warning draft-hint" role="status">
        <FileX />
        <div className="alert__body">
          <p className="alert__title">“{product.name}” has no file yet</p>
          <p>People who sign up would get an email with nothing to download. Upload the file, or give away another document.</p>
          <div className="cluster cluster--sm">
            <Button variant="primary" size="sm" icon={Upload} to={`/app/${slug}/products/${product.publicId}/edit`}>
              Upload the file
            </Button>
            <Button variant="secondary" size="sm" icon={FileDown} onClick={onChange}>
              Change document
            </Button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <p className="quiet-note lead-document">
      <Mail />
      <span>
        People who sign up get <strong>{product.name}</strong> ({fileMeta({ fileName: product.fileName, fileSizeBytes: product.fileSizeBytes })}) by
        email, with a personal download link.{' '}
        <button className="link" type="button" onClick={onChange}>
          Change
        </button>
      </span>
    </p>
  )
}

