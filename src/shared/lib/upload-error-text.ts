import { ApiError } from '../api/http-client'

/** The daily budget of uploads a creator has (409 `UPLOAD_LIMIT_REACHED`, details `{ used, limit }`). */
function uploadLimitText(error: ApiError) {
  const details = (error.details ?? {}) as { used?: number; limit?: number }
  return typeof details.used === 'number' && typeof details.limit === 'number'
    ? `You’ve used ${details.used} of ${details.limit} uploads for the last 24 hours. Try again later.`
    : 'You’ve reached the upload limit for the last 24 hours. Try again later.'
}

/** What to tell the creator when an upload (SAS request, confirm) was refused. */
export function uploadErrorText(error: unknown, fallback = 'Upload failed. Please try again.') {
  if (!(error instanceof ApiError)) return fallback
  if (error.status === 409 && error.code === 'UPLOAD_LIMIT_REACHED') return uploadLimitText(error)
  if (error.status === 429) return 'Too many uploads in a short time. Wait a minute and try again.'
  // A refusal (a fake file, a size over the limit) names what was wrong; a server fault gets the generic text.
  return error.status < 500 ? error.message : fallback
}
