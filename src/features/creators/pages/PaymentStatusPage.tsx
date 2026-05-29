import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type PaymentStatusPageProps = {
  status: 'success' | 'cancel'
}

export function PaymentStatusPage({ status }: PaymentStatusPageProps) {
  const navigate = useNavigate()
  const isSuccess = status === 'success'
  const Icon = isSuccess ? CheckCircle2 : XCircle

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-8">
        <section className="w-full rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
          <div
            className={`grid size-16 place-items-center rounded-3xl ${
              isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <Icon size={32} strokeWidth={1.8} />
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-normal">
            {isSuccess ? 'Payment completed' : 'Payment canceled'}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
            {isSuccess
              ? 'Your checkout finished. Return home to continue with your creator workspace.'
              : 'Checkout was canceled. You can return home and start payment again when ready.'}
          </p>

          <button
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            type="button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={18} />
            Back home
          </button>
        </section>
      </div>
    </main>
  )
}
