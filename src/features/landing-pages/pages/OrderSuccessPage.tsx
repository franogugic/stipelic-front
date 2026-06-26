import { CheckCircle2 } from 'lucide-react'
import { useParams } from 'react-router-dom'

export function OrderSuccessPage() {
  const { creatorSlug, pageSlug } = useParams<{ creatorSlug: string; pageSlug: string }>()

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50">
          <CheckCircle2 className="text-emerald-600" size={28} strokeWidth={1.8} />
        </div>
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
          Thank you for your purchase!
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-neutral-500">
          Check your email for your order confirmation and access to your product.
        </p>
        <a
          href={`/p/${creatorSlug}/${pageSlug}`}
          className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Back to page
        </a>
      </div>
    </div>
  )
}
