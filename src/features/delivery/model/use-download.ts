import { useCallback, useState } from 'react'
import { ApiError } from '../../../shared/api/http-client'
import { requestDownloadUrl } from '../api/access-api'

export type DownloadProblem = 'rate-limited' | 'revoked' | 'failed'

/**
 * Starts a download through a personal link: asks for a fresh signed address and opens it (the file comes as an
 * attachment, so the page stays where it is). The server counts it; too many in a short time answers 429.
 */
export function useDownload(token: string) {
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<DownloadProblem | null>(null)

  const download = useCallback(async () => {
    setBusy(true)
    setProblem(null)
    try {
      const url = await requestDownloadUrl(token)
      window.location.assign(url)
      return true
    } catch (error) {
      setProblem(
        error instanceof ApiError && error.status === 429 ? 'rate-limited' : error instanceof ApiError && error.status === 410 ? 'revoked' : 'failed',
      )
      return false
    } finally {
      setBusy(false)
    }
  }, [token])

  return { busy, problem, download }
}
