export type ApiErrorPayload = {
  statusCode?: number
  message?: string
  code?: string
  errors?: Record<string, string[]>
  /** Extra data for some conflicts, e.g. `{ used, limit }` on PLAN_LIMIT_REACHED. */
  details?: unknown
}

export class ApiError extends Error {
  status: number
  code?: string
  errors?: Record<string, string[]>
  details?: unknown

  constructor(status: number, payload: ApiErrorPayload | null) {
    super(payload?.message ?? 'Something went wrong. Please try again.')
    this.name = 'ApiError'
    this.status = status
    this.code = payload?.code
    this.errors = payload?.errors
    this.details = payload?.details
  }
}

type RequestOptions = Omit<RequestInit, 'body' | 'credentials'> & {
  body?: unknown
}

const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { body, headers, ...requestInit } = options

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...requestInit,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorPayload(response))
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}

async function readErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return null
  }

  return response.json() as Promise<ApiErrorPayload>
}
