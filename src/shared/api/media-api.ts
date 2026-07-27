import { apiRequest } from './http-client'

export type MediaUploadPurpose = 'ProductThumbnail' | 'CreatorLogo' | 'LandingPageHero' | 'LandingPageProductImage'

/// Mirrors backend MediaOptions defaults (Media:MaxFileSizeBytes / Media:AllowedContentTypes) — only for
/// fast client-side feedback before ever calling the API; the backend re-validates both and remains the
/// source of truth.
export const MAX_UPLOAD_FILE_SIZE_BYTES = 5_242_880
export const ALLOWED_UPLOAD_CONTENT_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']

type ApiResponse<TData> = {
  statusCode: number
  message: string
  code: string
  data: TData
}

function unwrapApiResponse<TData>(response: ApiResponse<TData>) {
  return response.data
}

type UploadUrlResponse = {
  uploadUrl: string
  blobUrl: string
  expiresAt: string
}

type ConfirmUploadResponse = {
  url: string
}

export function requestUploadUrl(slug: string, purpose: MediaUploadPurpose, contentType: string) {
  return apiRequest<ApiResponse<UploadUrlResponse>>(
    `/api/creators/${encodeURIComponent(slug)}/media/upload-url`,
    { method: 'POST', body: { purpose, contentType } },
  ).then(unwrapApiResponse)
}

export function confirmUpload(slug: string, blobUrl: string) {
  return apiRequest<ApiResponse<ConfirmUploadResponse>>(
    `/api/creators/${encodeURIComponent(slug)}/media/confirm`,
    { method: 'POST', body: { blobUrl } },
  ).then(unwrapApiResponse)
}

/** Orchestrates the full direct-to-blob flow: request a SAS URL, PUT the file straight to Azure (never
 * through our API — no `credentials: 'include'`, this isn't our origin), then confirm. Returns the final
 * blob URL to store in the target field (ThumbnailUrl/LogoUrl/imageUrl). */
export async function uploadImage(slug: string, purpose: MediaUploadPurpose, file: File): Promise<string> {
  const { uploadUrl, blobUrl } = await requestUploadUrl(slug, purpose, file.type)

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!putResponse.ok) {
    throw new Error('Upload to storage failed. Please try again.')
  }

  const { url } = await confirmUpload(slug, blobUrl)
  return url
}
