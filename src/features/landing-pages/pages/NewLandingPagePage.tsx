import { FilePenLine, ImageOff, Layers, ListChecks, Quote, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { useKeyedLoad } from '../../../shared/lib/use-keyed-load'
import { date, number } from '../../../shared/lib/format'
import { useFeatures } from '../../../shared/model/features-store'
import { AppShell } from '../../../shared/ui/AppShell'
import { Button, Card, EmptyState, Meter, PageHeader, PlanLimit, SkeletonCards } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { listProducts } from '../../products/api/products-api'
import type { Product } from '../../products/model/types'
import { generateAiDraft, loadAiUsage } from '../api/ai-draft-api'
import { archiveLandingPage, createLandingPage } from '../api/landing-pages-api'
import { AiBriefCard } from '../components/ai/AiBriefCard'
import { AiGenerating, GIVE_UP_AFTER_SECONDS } from '../components/ai/AiGenerating'
import { AI_STEPS, briefErrors, emptyBrief, failureOf, usageLine } from '../model/ai-draft'
import type { AiBrief, AiFailure, AiUsage, BriefErrors } from '../model/ai-draft'
import { markAiDraft } from '../model/ai-draft-flag'
import { useLandingPageStore } from '../model/landing-page-store'

type ProductsLoad = { status: 'loading' | 'error' } | { status: 'success'; products: Product[] }

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/, '')
}

/** The draft page the AI fills: created with the creator's title (the URL can be changed in the editor). */
async function createDraftPage(slug: string, brief: AiBrief): Promise<string> {
  const base = slugify(brief.title) || 'page'
  for (let attempt = 1; ; attempt++) {
    try {
      const page = await createLandingPage(slug, {
        title: brief.title.trim(),
        slug: attempt === 1 ? base : `${base}-${attempt}`,
        type: 'LeadGen',
        ...(brief.goal === 'free_product' && brief.productId ? { productId: brief.productId } : {}),
      })
      return page.publicId
    } catch (error) {
      // 409 on create = the URL is taken: try the next one.
      if (error instanceof ApiError && error.status === 409 && error.code !== 'PLAN_LIMIT_REACHED' && attempt < 6) continue
      throw error
    }
  }
}

/** "New landing page": generate a draft with AI (three guided steps), or build one from scratch. */
export function NewLandingPagePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  return (
    <AppShell slug={slug} activeSection="landing-pages" documentTitle="New landing page · Luma">
      <NewLandingPage slug={slug} />
    </AppShell>
  )
}

function NewLandingPage({ slug }: { slug: string }) {
  const navigate = useNavigate()
  const { paymentsOn } = useFeatures()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)
  const pages = useLandingPageStore((s) => s.pages)
  const listStatus = useLandingPageStore((s) => s.listStatus)
  const loadPages = useLandingPageStore((s) => s.loadPages)

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])
  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])
  useEffect(() => {
    if (slug) void loadPages(slug, true)
  }, [slug, loadPages])

  const usageLoad = useKeyedLoad(`ai-usage|${slug}`, () => loadAiUsage(slug))
  const usage = usageLoad.load.status === 'success' ? usageLoad.load.data : null

  const [products, setProducts] = useState<ProductsLoad>({ status: 'loading' })
  useEffect(() => {
    let active = true
    listProducts(slug)
      .then((list) => active && setProducts({ status: 'success', products: list.filter((product) => product.priceCents === 0 && product.status !== 'Archived') }))
      .catch(() => active && setProducts({ status: 'error' }))
    return () => {
      active = false
    }
  }, [slug])

  const [brief, setBrief] = useState<AiBrief | null>(null)
  // The brand starts as the workspace name, once the workspace is known.
  const current = brief ?? (creator ? emptyBrief(creator.name) : null)
  const [step, setStep] = useState(1)
  const [showErrors, setShowErrors] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [failure, setFailure] = useState<AiFailure | null>(null)

  // What a leave or a cancel must undo: the request in flight, and the empty draft page it was creating or filling.
  const controllerRef = useRef<AbortController | null>(null)
  const draftRef = useRef<{ pageId: string; title: string } | null>(null)
  const leftRef = useRef(false)

  const archiveDraft = () => {
    const draft = draftRef.current
    draftRef.current = null
    if (draft) void archiveLandingPage(slug, draft.pageId).catch(() => undefined)
  }

  useEffect(() => {
    leftRef.current = false
    return () => {
      // Leaving the page cancels the request: nothing is saved and nothing is used.
      leftRef.current = true
      controllerRef.current?.abort()
      archiveDraft()
    }
    // archiveDraft only reads refs and the (stable per page) slug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (creatorLoading || (!creator && currentCreatorStatus !== 'error' && currentCreatorStatus !== 'success')) return <SkeletonCards count={3} />
  if (!creator || !current) return <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />

  const plan = creatorPlans.find((candidate) => candidate.code === creator.planCode)
  const maxPages = plan?.limits['max_landing_pages']
  const pagesUsed = pages.filter((page) => page.status !== 'Archived').length
  const pageFull = listStatus === 'success' && maxPages !== undefined && maxPages >= 0 && pagesUsed >= maxPages
  const pageFullReason = pageFull && plan ? `You’re using all ${number(maxPages ?? 0)} pages on ${creator.planName}` : null
  const outOfGenerations = usage !== null && usage.used >= usage.limit

  const freeProducts = products.status === 'success' ? products.products : []
  const documentName = current.productId ? (freeProducts.find((product) => product.publicId === current.productId)?.name ?? null) : null

  const errors: BriefErrors = showErrors ? briefErrors(current, step) : {}
  const change = (patch: Partial<AiBrief>) => {
    setBrief({ ...current, ...patch })
    // A new answer clears what the last try said about the old one.
    if (failure && failure.kind !== 'limit') setFailure(null)
  }
  const goToStep = (target: number) => {
    setStep(target)
    setShowErrors(false)
  }
  const next = () => {
    if (Object.keys(briefErrors(current, step)).length > 0) {
      setShowErrors(true)
      return
    }
    goToStep(step + 1)
  }

  const ensureDraft = async (): Promise<string> => {
    const title = current.title.trim()
    if (draftRef.current && draftRef.current.title === title) return draftRef.current.pageId
    archiveDraft()
    const pageId = await createDraftPage(slug, current)
    draftRef.current = { pageId, title }
    return pageId
  }

  const generate = async () => {
    if (generating) return
    for (let at = 1; at <= AI_STEPS.length; at++) {
      if (Object.keys(briefErrors(current, at)).length > 0) {
        setStep(at)
        setShowErrors(true)
        return
      }
    }
    if (pageFull || outOfGenerations) return

    setFailure(null)
    setGenerating(true)
    const controller = new AbortController()
    controllerRef.current = controller
    let timedOut = false
    const giveUp = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, GIVE_UP_AFTER_SECONDS * 1000)
    try {
      const pageId = await ensureDraft()
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      await generateAiDraft(slug, pageId, current, controller.signal)
      markAiDraft(pageId)
      draftRef.current = null
      navigate(`/app/${slug}/landing-pages/${pageId}/edit`)
    } catch (error) {
      if (leftRef.current) return
      const aborted = error instanceof DOMException && error.name === 'AbortError'
      if (aborted && !timedOut) {
        // Cancel: back to the last step with every answer in place.
        setStep(AI_STEPS.length)
        setGenerating(false)
        return
      }
      const found: AiFailure = timedOut ? { kind: 'failed' } : failureOf(error)
      if (found.kind === 'limit') void usageLoad.reload()
      setFailure(found)
      setStep(AI_STEPS.length)
      setGenerating(false)
    } finally {
      window.clearTimeout(giveUp)
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }

  const cancel = () => controllerRef.current?.abort()

  const header = (
    <PageHeader
      eyebrow="Landing pages"
      title={
        <>
          New landing <em>page</em>
        </>
      }
      subtitle="Let Luma write a draft, or build the page yourself."
      actions={
        generating ? null : (
          <Button variant="ghost" to={`/app/${slug}/landing-pages`}>
            Cancel
          </Button>
        )
      }
    />
  )

  if (generating) {
    return (
      <>
        {header}
        <div className="reveal">
          <AiGenerating brief={current} documentName={documentName} onCancel={cancel} />
        </div>
      </>
    )
  }

  return (
    <>
      {header}
      <div className="stack stack--lg reveal">
        {pageFull && plan && maxPages !== undefined && (
          <PlanLimit noun="landing pages" planName={creator.planName} limit={maxPages} upgradeTo={`/app/${slug}/settings?tab=billing`} />
        )}
        <nav className="new-paths" aria-label="How to start">
          <span className="new-path is-current" aria-current="page">
            <span className="new-path__icon">
              <Sparkles />
            </span>
            <span className="new-path__text">
              <span className="new-path__title">Generate with AI</span>
              <span className="new-path__desc">Three short steps — Luma writes the first draft.</span>
            </span>
            <span className="new-path__meta">{usage ? (outOfGenerations ? `All ${number(usage.limit)} used this month` : usageLine(usage)) : 'Takes 20–60 seconds'}</span>
          </span>
          <Link className={`new-path${pageFull ? ' is-blocked' : ''}`} to={`/app/${slug}/landing-pages?create=1`} aria-disabled={pageFull || undefined} data-tooltip={pageFullReason ?? undefined}>
            <span className="new-path__icon">
              <Layers />
            </span>
            <span className="new-path__text">
              <span className="new-path__title">Start from scratch</span>
              <span className="new-path__desc">An empty page you build section by section.</span>
            </span>
            <span className="new-path__meta">Opens the editor</span>
          </Link>
        </nav>
        <div className="dash">
          <div className="span-8">
            <AiBriefCard
              step={step}
              brief={current}
              errors={errors}
              showMissing={showErrors && Object.keys(errors).length > 0}
              usage={usage}
              pageFullReason={pageFullReason}
              failure={failure}
              products={freeProducts}
              productsStatus={products.status}
              paymentsOn={paymentsOn}
              settingsPath={`/app/${slug}/settings`}
              newProductPath={`/app/${slug}/products/new`}
              onChange={change}
              onStep={goToStep}
              onNext={next}
              onGenerate={() => void generate()}
              onExample={() =>
                setBrief({
                  ...current,
                  title: 'Free colour grading guide',
                  audience: 'Hobby photographers who shoot on the coast while travelling',
                  offer: 'Monthly studio notes: one technique, one story from a client project and one free preset.',
                  benefits: ['A five-step grading routine', 'Natural skin tones in strong sun', 'Before-and-after examples'],
                  cta: current.goal === 'capture' ? 'Get the notes' : 'Send me the guide',
                })
              }
            />
          </div>
          <div className="span-4">
            <AiAside usage={usage} pagesUsed={pagesUsed} maxPages={maxPages} />
          </div>
        </div>
      </div>
    </>
  )
}

function AiAside({ usage, pagesUsed, maxPages }: { usage: AiUsage | null; pagesUsed: number; maxPages: number | undefined }) {
  return (
    <Card title="What you get">
      <div className="fill-stack">
        <ul className="ai-facts" role="list">
          <li>
            <ListChecks />
            <span>A complete page that collects emails: headline, your three benefits, questions and the sign-up form.</span>
          </li>
          <li>
            <ImageOff />
            <span>No images — the image slots wait for your own photos.</span>
          </li>
          <li>
            <Quote />
            <span>No made-up reviews: a testimonial comes back as a placeholder, and publishing is blocked until you replace or remove it.</span>
          </li>
          <li>
            <FilePenLine />
            <span>Saved as a draft. Nothing goes live until you publish.</span>
          </li>
        </ul>
        <div className="fill-stack__foot ai-scratch__foot">
          {usage && <Meter label="AI generations this month" used={usage.used} limit={usage.limit} />}
          <Meter label="Landing pages" used={pagesUsed} limit={maxPages} />
          <p className="field__hint">
            A generation counts only when the draft is saved — a refusal or an error doesn’t use one.
            {usage?.resetsAt ? ` They reset on ${date(usage.resetsAt)}.` : ''}
          </p>
        </div>
      </div>
    </Card>
  )
}
