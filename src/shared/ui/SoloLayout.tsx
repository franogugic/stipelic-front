import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { initials } from '../lib/format'
import { HELP_URL, PRIVACY_URL } from '../lib/legal-links'
import { Avatar, Brand, Button, ThemeToggleButton } from './ledger'

/**
 * Platform pages outside the app shell (check inbox, verify email, onboarding…): a slim bar, one centred
 * column and a footer. `user` adds the signed-in user's avatar and a log-out button to the bar.
 */
export function SoloLayout({ wide, user, children }: { wide?: boolean; user?: boolean; children: ReactNode }) {
  return (
    <div className="solo">
      <header className="solo__bar">
        <Brand to="/" />
        <div className="cluster">
          <ThemeToggleButton size="sm" />
          {user && <SoloUser />}
        </div>
      </header>
      <div className="solo__main">
        <div className={['solo__box', wide && 'solo__box--wide'].filter(Boolean).join(' ')}>{children}</div>
      </div>
      <footer className="solo__foot">
        © {new Date().getFullYear()} Luma · <a className="link" href={HELP_URL}>Help</a> ·{' '}
        <a className="link" href={PRIVACY_URL}>Privacy</a>
      </footer>
    </div>
  )
}

function SoloUser() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const isLoggingOut = useAuthStore((s) => s.logoutStatus === 'submitting')
  const fullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : ''

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <Avatar size="sm">{fullName ? initials(fullName) : ''}</Avatar>
      <Button variant="ghost" size="sm" icon={LogOut} loading={isLoggingOut} onClick={() => void handleLogout()}>
        Log out
      </Button>
    </>
  )
}
