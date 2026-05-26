import { BarChart3, LayoutTemplate, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-md">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur">
              <Sparkles size={15} />
              Creator Platform
            </div>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal text-neutral-950">
              Your landing pages and stats, ready when you are.
            </h1>
            <div className="mt-8 grid gap-3">
              <div className="flex items-center gap-3 text-sm font-medium text-neutral-700">
                <span className="grid size-9 place-items-center rounded-xl bg-white shadow-sm">
                  <LayoutTemplate size={18} />
                </span>
                Manage creator landing pages
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-neutral-700">
                <span className="grid size-9 place-items-center rounded-xl bg-white shadow-sm">
                  <BarChart3 size={18} />
                </span>
                Watch visits and performance
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[500px] rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-neutral-500">Creator Platform</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-neutral-950">
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Sign in to continue building your creator workspace.
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 border-t border-neutral-200 pt-5 text-center text-sm text-neutral-500">
            New here?{' '}
            <button
              className="font-semibold text-neutral-950 transition hover:text-neutral-600"
              type="button"
              onClick={() => navigate('/register')}
            >
              Create an account
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
