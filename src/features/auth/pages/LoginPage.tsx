import { FileText, BarChart3, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'

const features = [
  { icon: FileText,    title: 'Landing pages',  desc: 'Publish in minutes with built-in analytics.' },
  { icon: BarChart3,   title: 'Real-time stats', desc: 'See visits, scroll depth and sources live.' },
  { icon: ShoppingBag, title: 'Sell anything',   desc: 'Products and subscriptions, built in.' },
]

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      {/* Left — dark brand panel */}
      <div className="relative hidden w-[480px] shrink-0 flex-col justify-between overflow-hidden bg-neutral-950 p-10 lg:flex">
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white">
            <span className="text-sm font-black text-neutral-950">CP</span>
          </span>
          <span className="text-base font-semibold text-white">Creator Platform</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-4xl font-semibold leading-[1.2] tracking-tight text-white">
            Everything your
            <br />
            creator business
            <br />
            needs in one place.
          </h1>
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/50">
            Landing pages, analytics, email collection, and payments — managed from a single
            workspace built for creators.
          </p>

          <ul className="mt-10 grid gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white/70">
                  <Icon size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-white/50">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof quote */}
        <figure className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <blockquote className="text-sm leading-6 text-white/70">
            "Went from zero to first sale in under a day. The simplest creator tool I've
            ever used."
          </blockquote>
          <figcaption className="mt-3 flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-white/20 text-[11px] font-bold text-white">
              MK
            </span>
            <span className="text-xs text-white/40">Marko K. — indie creator</span>
          </figcaption>
        </figure>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-50 px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-950">
            <span className="text-xs font-black text-white">CP</span>
          </span>
          <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              Sign in to your creator workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            No account yet?{' '}
            <button
              type="button"
              className="font-semibold text-neutral-950 underline-offset-2 transition hover:underline"
              onClick={() => navigate('/register')}
            >
              Create one free
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
