import { ApiError } from '../../../shared/api/http-client'

const connectionText = 'We couldn’t check your link. Check your connection and try again.'

/**
 * Text for a link check that could not complete: a rate limit's own message is worth showing; anything
 * else (server or network) is most likely the connection.
 */
export function requestFailedText(status: number | null, message: string | null) {
  return status === 429 && message ? message : connectionText
}

/** `requestFailedText` for a caught error. */
export function requestFailedTextFor(error: unknown) {
  return error instanceof ApiError ? requestFailedText(error.status, error.message) : connectionText
}
