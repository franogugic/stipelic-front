import { Landmark, LayoutDashboard, LogOut, Mail, Package, PanelsTopLeft, Receipt, Settings, ShieldCheck, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { useCreatorStore } from '../../features/creators/model/creator-store'
import { initials, monogram } from '../lib/format'
import { Avatar, Brand, Button, ThemeSwitch } from './ledger'
import { NAV_SECTION_LABELS } from './nav-sections'
import type { NavSection } from './nav-sections'

export type { NavSection } from './nav-sections'

type SidebarProps = {
  /** The workspace address; empty on a platform page of an admin without a workspace (only the Admin group shows). */
  slug: string
  activeSection: NavSection
  /** Closes the mobile drawer; only the drawer's close button uses it. */
  onCloseDrawer?: () => void
}

type NavItem = { section: NavSection; label: string; icon: LucideIcon; href: (slug: string) => string }
type NavGroup = { id: string; label?: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  { id: 'main', items: [{ section: 'overview', label: NAV_SECTION_LABELS['overview'], icon: LayoutDashboard, href: (s) => `/app/${s}` }] },
  {
    id: 'sell',
    label: 'Sell',
    items: [
      { section: 'landing-pages', label: NAV_SECTION_LABELS['landing-pages'], icon: PanelsTopLeft, href: (s) => `/app/${s}/landing-pages` },
      { section: 'products', label: NAV_SECTION_LABELS['products'], icon: Package, href: (s) => `/app/${s}/products` },
      { section: 'orders', label: NAV_SECTION_LABELS['orders'], icon: Receipt, href: (s) => `/app/${s}/orders` },
    ],
  },
  {
    id: 'audience',
    label: 'Audience',
    items: [
      { section: 'emails', label: NAV_SECTION_LABELS['emails'], icon: Mail, href: (s) => `/app/${s}/emails` },
      { section: 'subscribers', label: NAV_SECTION_LABELS['subscribers'], icon: Users, href: (s) => `/app/${s}/subscribers` },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      { section: 'payouts', label: NAV_SECTION_LABELS['payouts'], icon: Landmark, href: (s) => `/app/${s}/payouts` },
      { section: 'settings', label: NAV_SECTION_LABELS['settings'], icon: Settings, href: (s) => `/app/${s}/settings` },
    ],
  },
]

const ADMIN_GROUP: NavGroup = {
  id: 'admin',
  label: 'Admin',
  items: [{ section: 'admin-payouts', label: 'Payouts', icon: ShieldCheck, href: () => '/admin/payouts' }],
}

function NavGroupList({ group, slug, active }: { group: NavGroup; slug: string; active: string }) {
  const labelId = `nav-label-${group.id}`
  return (
    <div className="nav__group">
      {group.label && (
        <p className="nav__label eyebrow" id={labelId}>
          {group.label}
        </p>
      )}
      <ul className="nav__list" role="list" aria-labelledby={group.label ? labelId : undefined}>
        {group.items.map(({ section, label, icon: Icon, href }) => (
          <li key={section}>
            <Link className="nav__link" to={href(slug)} aria-current={section === active ? 'page' : undefined}>
              <Icon />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Sidebar({ slug, activeSection, onCloseDrawer }: SidebarProps) {
  const user = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const isLoggingOut = useAuthStore((s) => s.logoutStatus === 'submitting')
  const creator = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator : null))
  const settings = useCreatorStore((s) => (s.creatorSettings?.slug === slug ? s.creatorSettings : null))

  const fullName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : ''
  const brandName = settings?.brandName || creator?.name || ''
  const isAdmin = Boolean(user?.roles?.includes('platform_admin'))

  return (
    <div className="sidebar">
      <div className="sidebar__head">
        <Brand to={slug ? `/app/${slug}` : '/'} />
        <Button variant="ghost" iconOnly icon={X} className="sidebar__close" aria-label="Close menu" onClick={onCloseDrawer} />
      </div>
      {slug && (
        <div className="workspace-card">
          <span className="workspace-card__logo" aria-hidden="true">
            {brandName ? monogram(brandName) : ''}
          </span>
          <span className="workspace-card__text">
            <span className="workspace-card__name">{creator?.name ?? ''}</span>
            <span className="workspace-card__url">{`${window.location.host}/p/${slug}`}</span>
          </span>
        </div>
      )}
      <nav className="nav" aria-label="Main">
        {slug && NAV_GROUPS.map((group) => <NavGroupList key={group.id} group={group} slug={slug} active={activeSection} />)}
        {isAdmin && <NavGroupList group={ADMIN_GROUP} slug={slug} active={activeSection} />}
      </nav>
      <div className="sidebar__foot">
        <ThemeSwitch />
        <div className="user-block">
          <Avatar>{fullName ? initials(fullName) : ''}</Avatar>
          <span className="user-block__text">
            <span className="user-block__name">{fullName}</span>
            <span className="user-block__plan">{creator?.planName ? `${creator.planName} plan` : ''}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={LogOut}
            aria-label="Log out"
            data-tooltip="Log out"
            loading={isLoggingOut}
            onClick={() => void logout()}
          />
        </div>
      </div>
    </div>
  )
}
