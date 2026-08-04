import {
  Banknote,
  Layers,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { LOGO_GRADIENT } from './brand'

export type NavSection = 'overview' | 'landing-pages' | 'products' | 'orders' | 'emails' | 'subscribers' | 'payouts' | 'settings'

type SidebarProps = {
  slug: string
  activeSection: NavSection
}

const navItems: { section: NavSection; label: string; icon: typeof LayoutDashboard; href: (slug: string) => string }[] = [
  { section: 'overview',       label: 'Dashboard',      icon: LayoutDashboard, href: (s) => `/app/${s}` },
  { section: 'landing-pages',  label: 'Landing Pages',  icon: Layers,          href: (s) => `/app/${s}/landing-pages` },
  { section: 'products',       label: 'Products',       icon: Package,         href: (s) => `/app/${s}/products` },
  { section: 'orders',         label: 'Orders',         icon: ShoppingBag,     href: (s) => `/app/${s}/orders` },
  { section: 'emails',         label: 'Email Marketing', icon: Mail,           href: (s) => `/app/${s}/emails` },
  { section: 'subscribers',    label: 'Subscribers',    icon: Users,           href: (s) => `/app/${s}/subscribers` },
  { section: 'payouts',        label: 'Payouts',        icon: Banknote,        href: (s) => `/app/${s}/payouts` },
  { section: 'settings',       label: 'Settings',       icon: Settings,        href: (s) => `/app/${s}/settings` },
]

export function Sidebar({ slug, activeSection }: SidebarProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const logoutStatus = useAuthStore((s) => s.logoutStatus)
  const isLoggingOut = logoutStatus === 'submitting'

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    : ''

  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
      style={{ backgroundColor: 'var(--color-sidebar)', borderRight: '1px solid var(--color-sidebar-border)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 shrink-0">
        <span
          className="text-xl font-black tracking-tight"
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            background: LOGO_GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          LAUNCHKIT
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ section, label, icon, href }) => {
          const Icon = icon
          const active = activeSection === section
          return (
            <button key={section} onClick={() => navigate(href(slug))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative"
              style={{
                backgroundColor: active ? 'color-mix(in srgb, var(--color-chart-1) 9.4%, transparent)' : 'transparent',
                color: active ? 'var(--color-chart-1)' : 'var(--color-muted-foreground)',
              }}>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ backgroundColor: 'var(--color-chart-1)' }} />}
              <Icon size={15} />
              <span>{label}</span>
            </button>
          );
        })}

        {user?.roles?.includes('platform_admin') && (
          <>
            <div className="my-3 mx-2" style={{ borderTop: '1px solid var(--color-sidebar-border)' }} />
            <button onClick={() => navigate('/admin/payouts')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative"
              style={{ color: 'var(--color-muted-foreground)' }}>
              <ShieldCheck size={15} />
              <span>Admin: Payouts</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-3 pb-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-chart-1) 18.8%, transparent)', color: 'var(--color-chart-1)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-white">{fullName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ''}</p>
          </div>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => void logout()}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            {isLoggingOut ? <Loader2 className="animate-spin" size={13} /> : <LogOut size={13} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
