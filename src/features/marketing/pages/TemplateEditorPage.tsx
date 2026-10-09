import { MailX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { AppShell } from '../../../shared/ui/AppShell'
import { EmptyState, ErrorState, SkeletonBlock, SkeletonRows } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { getTemplate } from '../api/templates-api'
import { TemplateEditor } from '../components/TemplateEditor'
import { draftOf } from '../model/template-draft'
import type { TemplateDraft } from '../model/template-draft'
import { useTemplateStore } from '../model/template-store'
import type { EmailTemplate } from '../model/types'

const BLANK: TemplateDraft = { name: '', subject: '', bodyText: '', withButton: false, ctaLabel: '', ctaUrl: '' }

type Loaded =
  | { key: string; status: 'ready'; template: EmailTemplate }
  | { key: string; status: 'notfound' }
  | { key: string; status: 'error' }

/** `/emails/templates/:templateId` for a saved template, `/emails/templates/new?name=&starter=` for a new one. */
export function TemplateEditorPage() {
  const { slug = '', templateId } = useParams<{ slug: string; templateId?: string }>()
  const [searchParams] = useSearchParams()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  const starters = useTemplateStore((s) => s.starters)
  const startersStatus = useTemplateStore((s) => s.startersStatus)
  const loadStarters = useTemplateStore((s) => s.loadStarters)

  const isNew = templateId === undefined
  const starterKey = searchParams.get('starter')
  const key = `${slug}|${templateId ?? 'new'}`
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const state = loaded?.key === key ? loaded : null

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (slug) void loadCreatorSettings(slug)
  }, [slug, loadCreatorSettings])

  useEffect(() => {
    if (slug && isNew && starterKey) void loadStarters(slug)
  }, [slug, isNew, starterKey, loadStarters])

  useEffect(() => {
    if (!slug || !templateId) return
    getTemplate(slug, templateId)
      .then((template) => setLoaded({ key, status: 'ready', template }))
      .catch((error) =>
        setLoaded(error instanceof ApiError && error.status === 404 ? { key, status: 'notfound' } : { key, status: 'error' }),
      )
  }, [slug, templateId, key, attempt])

  if (!slug) return null

  const body = () => {
    if (isNew) {
      const starter = starterKey ? starters.find((item) => item.key === starterKey) : undefined
      if (starterKey && (startersStatus === 'idle' || startersStatus === 'loading')) return <SkeletonBlock />
      const name = searchParams.get('name')?.trim() || starter?.name || 'Untitled template'
      const initial: TemplateDraft = starter
        ? {
            name,
            subject: starter.subject,
            bodyText: starter.bodyText,
            withButton: Boolean(starter.ctaLabel || starter.ctaUrl),
            ctaLabel: starter.ctaLabel ?? '',
            ctaUrl: starter.ctaUrl ?? '',
          }
        : { ...BLANK, name }
      return (
        <TemplateEditor
          key={`${key}|${starter?.key ?? 'blank'}`}
          slug={slug}
          template={null}
          initial={initial}
          eyebrow={starter ? `Templates · from the ${starter.name} starter` : 'Templates'}
          creatorSettings={creatorSettings}
          brandFallback={creator?.name ?? ''}
          onChanged={() => undefined}
        />
      )
    }
    if (state === null) return <SkeletonRows />
    if (state.status === 'notfound') {
      return (
        <EmptyState
          icon={MailX}
          title="Template not found"
          text="It may have been removed, or the link is wrong."
          action={{ label: 'Back to templates', variant: 'secondary', to: `/app/${slug}/emails/templates` }}
        />
      )
    }
    if (state.status === 'error') return <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
    return (
      <TemplateEditor
        key={`${key}|${state.template.updatedAt}|${state.template.status}`}
        slug={slug}
        template={state.template}
        initial={draftOf(state.template)}
        eyebrow="Templates"
        creatorSettings={creatorSettings}
        brandFallback={creator?.name ?? ''}
        onChanged={() => setAttempt((n) => n + 1)}
      />
    )
  }

  return (
    <AppShell slug={slug} activeSection="emails">
      {creatorLoading ? (
        <SkeletonRows />
      ) : !creator ? (
        <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
      ) : (
        body()
      )}
    </AppShell>
  )
}
