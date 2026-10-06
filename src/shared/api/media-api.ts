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
export async function uploadImage(
  slug: string,
  purpose: MediaUploadPurpose,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { uploadUrl, blobUrl } = await requestUploadUrl(slug, purpose, file.type)

  await putBlob(uploadUrl, file, onProgress)

  const { url } = await confirmUpload(slug, blobUrl)
  return url
}

const UPLOAD_FAILED = 'Upload to storage failed. Please try again.'

// fetch cannot report upload progress, so a caller that wants it gets an XMLHttpRequest; everyone else keeps fetch.
function putBlob(uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
  if (!onProgress) {
    return fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
      body: file,
    }).then((response) => {
      if (!response.ok) throw new Error(UPLOAD_FAILED)
    })
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', uploadUrl)
    request.setRequestHeader('x-ms-blob-type', 'BlockBlob')
    request.setRequestHeader('Content-Type', file.type)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onload = () => (request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(UPLOAD_FAILED)))
    request.onerror = () => reject(new Error(UPLOAD_FAILED))
    request.onabort = () => reject(new Error(UPLOAD_FAILED))
    request.send(file)
  })
}
