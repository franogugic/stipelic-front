import { useCallback, useState } from 'react'
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  uploadImage,
  type MediaUploadPurpose,
} from '../api/media-api'

function validateImage(file: File): string | null {
  if (!ALLOWED_UPLOAD_CONTENT_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, or WebP images are allowed.'
  }
  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return `Image must be under ${Math.round(MAX_UPLOAD_FILE_SIZE_BYTES / 1_048_576)} MB.`
  }
  return null
}

/**
 * The direct-to-blob image upload (validate → SAS URL → PUT → confirm) as component state: `uploading`,
 * `progress` (0–100), the name of the file being / last uploaded and an `error`. `onUploaded` receives the
 * final blob URL to store in the target field.
 */
export function useImageUpload({
  slug,
  purpose,
  onUploaded,
}: {
  slug: string
  purpose: MediaUploadPurpose
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      const invalid = validateImage(file)
      if (invalid) {
        setError(invalid)
        return
      }

      setUploading(true)
      setProgress(0)
      setFileName(file.name)
      setError(null)
      try {
        onUploaded(await uploadImage(slug, purpose, file, setProgress))
      } catch {
        setError('Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    },
    [slug, purpose, onUploaded],
  )

  const clearError = useCallback(() => setError(null), [])

  return { uploading, progress, fileName, error, upload, clearError }
}
