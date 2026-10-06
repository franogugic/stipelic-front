import { ApiError } from './http-client'
import type { ApiErrorPayload } from './http-client'

const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? ''

/** The file name of a Content-Disposition header: the RFC 5987 `filename*=` form first, then `filename=`. */
function fileNameFrom(header: string | null): string | null {
  if (!header) return null
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(header)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim())
    } catch {
      /* fall through to the plain form */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/.exec(header)
  return plain ? plain[1].trim() : null
}

/**
 * Downloads a file from the API with the session cookie and hands it to the browser as a save. The name comes from
 * the response's Content-Disposition (`fallbackName` when it is missing). A failed request throws an `ApiError`
 * built from the JSON error body, like `apiRequest`.
 */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { credentials: 'include' })

  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json')
    throw new ApiError(response.status, isJson ? ((await response.json()) as ApiErrorPayload) : null)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileNameFrom(response.headers.get('content-disposition')) ?? fallbackName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
