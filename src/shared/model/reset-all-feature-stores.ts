import { useAdminPayoutsStore } from '../../features/admin/model/admin-payouts-store'
import { useCreatorStore } from '../../features/creators/model/creator-store'
import { usePayoutStore } from '../../features/creators/model/payout-store'
import { useLandingPageStore } from '../../features/landing-pages/model/landing-page-store'
import { useCampaignStore } from '../../features/marketing/model/campaign-store'
import { useContactsStore } from '../../features/marketing/model/contacts-store'
import { useTemplateStore } from '../../features/marketing/model/template-store'
import { useProductStore } from '../../features/products/model/product-store'

// Every zustand store that holds per-user/per-creator data. auth-store calls this on logout and
// on a discovered-invalid session, so the next login never renders the previous account's data
// while its own fetch is still in flight (each store's loaders guard against refetching once
// status is 'success', so without this reset they'd never refetch at all).
export function resetAllFeatureStores(): void {
  useCreatorStore.getState().reset()
  usePayoutStore.getState().reset()
  useProductStore.getState().reset()
  useLandingPageStore.getState().reset()
  useCampaignStore.getState().reset()
  useContactsStore.getState().reset()
  useTemplateStore.getState().reset()
  useAdminPayoutsStore.getState().reset()
}
