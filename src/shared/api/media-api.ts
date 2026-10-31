import { apiRequest } from './http-client'

export type MediaUploadPurpose = 'ProductThumbnail' | 'CreatorLogo' | 'LandingPageHero' | 'LandingPageProductImage' | 'ProductFile'

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

/** How the browser sends the file to storage. S3: a presigned POST, a form of `fields` with the file last. Azure: a PUT of
 * the file with `headers`. An API from before the S3 change sends neither `method` nor `headers` (an Azure PUT). */
type UploadUrlResponse = {
  uploadUrl: string
  blobUrl: string
  expiresAt: string
  method?: 'POST' | 'PUT'
  fields?: Record<string, string>
  headers?: Record<string, string>
}

type ConfirmUploadResponse = {
  url: string
}

/** What confirming a product file returns: an opaque reference (never a URL) that the product save takes, and what the
 * server found when it read the real blob. */
export type ConfirmedProductFile = {
  fileReference: string
  fileName: string
  fileSizeBytes: number
  contentType: string
}

export function requestUploadUrl(slug: string, purpose: MediaUploadPurpose, contentType: string) {
  return apiRequest<ApiResponse<UploadUrlResponse>>(
    `/api/creators/${encodeURIComponent(slug)}/media/upload-url`,
    { method: 'POST', body: { purpose, contentType } },
  ).then(unwrapApiResponse)
}

export function confirmProductFile(slug: string, blobUrl: string, fileName: string) {
  return apiRequest<ApiResponse<ConfirmedProductFile>>(
    `/api/creators/${encodeURIComponent(slug)}/media/confirm`,
    { method: 'POST', body: { blobUrl, fileName } },
  ).then(unwrapApiResponse)
}

export function confirmUpload(slug: string, blobUrl: string) {
  return apiRequest<ApiResponse<ConfirmUploadResponse>>(
    `/api/creators/${encodeURIComponent(slug)}/media/confirm`,
    { method: 'POST', body: { blobUrl } },
  ).then(unwrapApiResponse)
}

/** Orchestrates the full direct-to-storage flow: request an upload ticket, send the file straight to storage (never
 * through our API — no `credentials: 'include'`, this isn't our origin), then confirm. Returns the final
 * image URL to store in the target field (ThumbnailUrl/LogoUrl/imageUrl). */
export async function uploadImage(
  slug: string,
  purpose: MediaUploadPurpose,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const ticket = await requestUploadUrl(slug, purpose, file.type)

  await sendToStorage(ticket, file, file.type, onProgress)

  const { url } = await confirmUpload(slug, ticket.blobUrl)
  return url
}

/** The product's document: request an upload ticket for the private bucket, send the file straight to storage, then
 * confirm — the server reads the stored file (size and first bytes) and answers with the reference the product save
 * takes. */
export async function uploadProductFile(
  slug: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<ConfirmedProductFile> {
  const ticket = await requestUploadUrl(slug, 'ProductFile', contentType)
  await sendToStorage(ticket, file, contentType, onProgress)
  return confirmProductFile(slug, ticket.blobUrl, file.name)
}

const UPLOAD_FAILED = 'Upload to storage failed. Please try again.'

type StorageRequest = {
  method: 'POST' | 'PUT'
  headers: Record<string, string>
  body: FormData | File
}

/** The request the ticket describes. A POST's policy covers every field, so they go exactly as given and the file last
 * (S3 ignores fields after it); the browser sets the multipart Content-Type itself. */
function storageRequest(ticket: UploadUrlResponse, file: File, contentType: string): StorageRequest {
  if (ticket.method === 'POST') {
    const form = new FormData()
    for (const [name, value] of Object.entries(ticket.fields ?? {})) form.append(name, value)
    form.append('file', file)
    return { method: 'POST', headers: {}, body: form }
  }

  return {
    method: 'PUT',
    headers: ticket.headers ?? { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': contentType },
    body: file,
  }
}

// fetch cannot report upload progress, so a caller that wants it gets an XMLHttpRequest; everyone else keeps fetch.
function sendToStorage(
  ticket: UploadUrlResponse,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const { method, headers, body } = storageRequest(ticket, file, contentType)

  if (!onProgress) {
    return fetch(ticket.uploadUrl, { method, headers, body }).then((response) => {
      if (!response.ok) throw new Error(UPLOAD_FAILED)
    })
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(method, ticket.uploadUrl)
    for (const [name, value] of Object.entries(headers)) request.setRequestHeader(name, value)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onload = () => (request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(UPLOAD_FAILED)))
    request.onerror = () => reject(new Error(UPLOAD_FAILED))
    request.onabort = () => reject(new Error(UPLOAD_FAILED))
    request.send(body)
  })
}
