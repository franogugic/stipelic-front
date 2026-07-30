import {
  Banknote,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { useCreatorStore } from '../../features/creators/model/creator-store'
import { useThemeStore } from '../model/theme-store'

type NavSection = 'overview' | 'landing-pages' | 'products' | 'orders' | 'emails' | 'subscribers' | 'payouts' | 'settings'

type AppShellProps = {
  slug: string
  activeSection: NavSection
  children: ReactNode
}

const navItems: { section: NavSection; label: string; icon: typeof LayoutDashboard; href: (slug: string) => string }[] = [
  { section: 'overview',       label: 'Overview',       icon: LayoutDashboard, href: (s) => `/app/${s}` },
  { section: 'landing-pages',  label: 'Landing Pages',  icon: FileText,        href: (s) => `/app/${s}/landing-pages` },
  { section: 'products',       label: 'Products',       icon: Package,         href: (s) => `/app/${s}/products` },
  { section: 'orders',         label: 'Orders',         icon: ShoppingBag,     href: (s) => `/app/${s}/orders` },
  { section: 'emails',         label: 'Emails',         icon: Mail,            href: (s) => `/app/${s}/emails` },
  { section: 'subscribers',    label: 'Subscribers',    icon: Users,           href: (s) => `/app/${s}/subscribers` },
  { section: 'payouts',        label: 'Payouts',        icon: Banknote,        href: (s) => `/app/${s}/payouts` },
]

export function AppShell({ slug, activeSection, children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const logoutStatus = useAuthStore((s) => s.logoutStatus)
  const isLoggingOut = logoutStatus === 'submitting'
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    : ''

  void location // used implicitly via activeSection

  return (
    <div className="relative flex min-h-screen bg-neutral-950 light:bg-neutral-100">
      {/* Subtle grid texture */}
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-[0.04]" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-white/10 bg-neutral-950">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-5">
          <span className="grid size-7 place-items-center rounded-md bg-white text-neutral-950">
            <span className="text-[11px] font-black tracking-tight">CP</span>
          </span>
          <p className="text-[13px] font-semibold text-white">Creator Platform</p>
        </div>

        {/* Creator identity */}
        {creator && (
          <div className="relative overflow-hidden border-b border-white/10 px-5 py-4">
            <div className="animate-glow-pulse pointer-events-none absolute -left-8 -top-8 size-24 rounded-full bg-accent/25 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-lg shadow-black/20">
                <span className="font-display text-sm font-black tracking-tighter text-neutral-950">
                  {creator.name[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-bold leading-tight text-white">
                  {creator.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <StatusDot status={creator.status} />
                  <span className="truncate font-mono text-[10.5px] text-white/35">/{slug}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Workspace
          </p>
          <ul className="grid gap-0.5">
            {navItems.map(({ section, label, icon: Icon, href }) => {
              const isActive = activeSection === section
              return (
                <li key={section}>
                  <button
                    type="button"
                    onClick={() => navigate(href(slug))}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-accent text-white shadow-lg shadow-accent/25'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="my-4 border-t border-white/10" />

          <ul className="grid gap-0.5">
            <li>
              <button
                type="button"
                onClick={() => navigate(`/app/${slug}/settings`)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeSection === 'settings'
                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings size={16} strokeWidth={activeSection === 'settings' ? 2.2 : 1.8} />
                Settings
              </button>
            </li>
            {user?.roles?.includes('platform_admin') ? (
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/admin/payouts')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/5 hover:text-white"
                >
                  <ShieldCheck size={16} strokeWidth={1.8} />
                  Admin payouts
                </button>
              </li>
            ) : null}
          </ul>
        </nav>

        {/* Footer — user */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent-strong">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{fullName}</p>
              <p className="truncate text-[11px] text-white/40">{user?.email ?? ''}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <span className="relative h-4 w-7 shrink-0 rounded-full bg-white/10 transition-colors">
              <span
                className={`absolute top-0.5 size-3 rounded-full bg-accent transition-all ${
                  theme === 'dark' ? 'left-0.5' : 'left-3.5'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            {isLoggingOut ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <LogOut size={15} />
            )}
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 ml-60 flex min-h-screen flex-1 flex-col">
        {children}
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const s = status.toLowerCase()
  const color =
    s === 'active' ? 'bg-emerald-500' : s === 'pendingpayment' ? 'bg-amber-500' : s === 'suspended' ? 'bg-red-500' : 'bg-white/30'
  return <span className={`size-1.5 shrink-0 rounded-full ${color}`} />
}
