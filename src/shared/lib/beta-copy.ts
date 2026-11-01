import { ApiError } from '../api/http-client'

/**
 * The closed beta's refusals in plain language (DESIGN_SYSTEM.md, "Beta copy"). The API answers with a code; this is what a
 * person reads. `null` for any other error, so callers keep their own message for it.
 */
export function betaErrorText(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  switch (error.code) {
    case 'PAYMENTS_DISABLED':
      return 'Payments are switched off while Luma is in private beta, so this isn’t available yet.'
    case 'PAID_PRODUCTS_DISABLED':
      return 'Luma is in private beta: every product is free for now, so it can’t have a price.'
    case 'REGISTRATION_CLOSED':
      return 'Luma is in private beta. Sign-up is by invitation only.'
    default:
      return null
  }
}
