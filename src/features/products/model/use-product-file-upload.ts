import { useCallback, useState } from 'react'
import { uploadErrorText } from '../../../shared/lib/upload-error-text'
import { uploadProductFile } from '../../../shared/api/media-api'
import type { ConfirmedProductFile } from '../../../shared/api/media-api'
import { contentTypeOf, validateProductFile } from './product-file'

/**
 * The product's document upload as component state: it is checked here (PDF, EPUB or ZIP, up to 100 MB), sent straight to
 * private storage and confirmed — the server then reads the real file and answers with the reference the product save
 * takes. `pending` is the file chosen in this session; nothing is attached to the product until it is saved.
 */
export function useProductFileUpload({ slug }: { slug: string }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState(0)
  const [pending, setPending] = useState<ConfirmedProductFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      const invalid = validateProductFile(file)
      if (invalid) {
        setError(invalid)
        return
      }
      setUploading(true)
      setProgress(0)
      setSelectedName(file.name)
      setSelectedSize(file.size)
      setError(null)
      try {
        setPending(await uploadProductFile(slug, file, contentTypeOf(file.name), setProgress))
      } catch (failure) {
        // The server's message names what was wrong with the real file (a fake PDF, a file over the limit).
        setError(uploadErrorText(failure))
      } finally {
        setUploading(false)
      }
    },
    [slug],
  )

  const clearError = useCallback(() => setError(null), [])

  return { uploading, progress, selectedName, selectedSize, pending, error, upload, clearError }
}
