import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useFeatures } from '../../shared/model/features-store'

/** Screens that only exist while payments are on (orders, payouts). In the closed beta the address leads to the dashboard. */
export function PaymentsOnlyRoute() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { ready, paymentsEnabled } = useFeatures()

  if (ready && !paymentsEnabled) return <Navigate to={`/app/${slug}`} replace />
  return <Outlet />
}
