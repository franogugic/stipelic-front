import type { ReactNode } from 'react'
import { Brand } from '../../../shared/ui/ledger'

/** Split auth layout: the form panel on the left, the decorative art panel on the right (hidden below 900px). */
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__panel">
        <Brand to="/" />
        {children}
      </div>
      <AuthArt />
    </div>
  )
}

function AuthArt() {
  return (
    <aside className="auth__art" aria-hidden="true">
      <div className="auth__floating">
        <div className="auth__float"><p className="text-xs" style={{ opacity: 0.6 }}>New order</p><p><strong>Adriatic Summer Presets</strong> · €29.00</p></div>
        <div className="auth__float"><p className="text-xs" style={{ opacity: 0.6 }}>This month</p><p className="auth__quote" style={{ fontSize: '2rem' }}>€544.00</p></div>
        <div className="auth__float"><p className="text-xs" style={{ opacity: 0.6 }}>Campaign sent</p><p>September studio notes · 54% opened</p></div>
      </div>
      <p className="auth__quote">Build it, sell it,<br /><em>get paid.</em></p>
      <p style={{ opacity: 0.7 }}>Landing pages, checkout, email and payouts for creators across the Balkans.</p>
    </aside>
  )
}
