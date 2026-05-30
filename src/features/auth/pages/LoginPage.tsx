import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-5 py-10 lg:grid-cols-2 lg:items-center lg:px-8">

        {/* Left — brand panel */}
        <section className="hidden lg:flex lg:flex-col lg:justify-center">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-neutral-950 text-white">
              <span className="text-sm font-bold">CP</span>
            </span>
            <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
          </div>

          <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight text-neutral-950">
            Your creator workspace, ready in minutes.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-neutral-500">
            Manage your landing pages, track visits, and handle everything from one clean dashboard.
          </p>

          <ul className="mt-8 grid gap-3">
            {[
              'Landing pages with custom branding',
              'Real-time analytics and stats',
              'Subscription billing built in',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-neutral-600">
                <span className="grid size-5 place-items-center rounded-full bg-neutral-950 text-white">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Right — form */}
        <section className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-neutral-950 text-white">
              <span className="text-xs font-bold">CP</span>
            </span>
            <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Welcome back. Enter your credentials to continue.
            </p>

            <div className="mt-7">
              <LoginForm />
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-5 text-center text-sm text-neutral-500">
              Don't have an account?{' '}
              <button
                className="font-semibold text-neutral-950 transition hover:text-neutral-600"
                type="button"
                onClick={() => navigate('/register')}
              >
                Create one
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
