export type NavSection =
  | 'overview'
  | 'landing-pages'
  | 'products'
  | 'orders'
  | 'emails'
  | 'subscribers'
  | 'payouts'
  | 'settings'
  | 'admin-payouts'

/** Nav labels, shared by the sidebar and the browser tab title. */
export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  overview: 'Dashboard',
  'landing-pages': 'Landing Pages',
  products: 'Products',
  orders: 'Orders',
  emails: 'Email Marketing',
  subscribers: 'Subscribers',
  payouts: 'Payouts',
  settings: 'Settings',
  'admin-payouts': 'Admin payouts',
}
