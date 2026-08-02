import { CheckCircle2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { AuthModeSwitch } from '../components/AuthModeSwitch'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const bannerMessage = (location.state as { message?: string } | null)?.message

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground">Sign in to your creator workspace.</p>
      </div>

      {bannerMessage ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="mt-0.5 shrink-0" size={15} />
          <span>{bannerMessage}</span>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-7">
        <AuthModeSwitch mode="login" />
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        No account?{' '}
        <button type="button" className="font-semibold text-accent hover:opacity-85" onClick={() => navigate('/register')}>
          Register free
        </button>
      </p>
    </AuthLayout>
  )
}
