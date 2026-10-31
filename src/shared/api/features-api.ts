import { apiRequest } from './http-client'

/** The deployment's switches (backend `Features:*`). Anonymous: the register page needs it before anyone is signed in. */
export type Features = {
  /** False in the closed beta: no checkout, no Connect onboarding, no plan billing, every product is free. */
  paymentsEnabled: boolean
  /** False in the closed beta: the owner creates every account. */
  openRegistration: boolean
}

type FeaturesResponse = Features | { data: Features }

/** `GET /api/features` (never cached). Accepts the bare object or the usual `{ data }` envelope. */
export async function getFeatures(): Promise<Features> {
  const body = await apiRequest<FeaturesResponse>('/api/features')
  const features = 'data' in body ? body.data : body
  return { paymentsEnabled: features.paymentsEnabled === true, openRegistration: features.openRegistration === true }
}
