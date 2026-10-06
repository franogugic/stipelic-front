import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAudiencePreview } from '../api/campaigns-api'
import { useCampaignStore } from './campaign-store'
import { useTemplateStore } from './template-store'
import type {
  AudiencePreview,
  CampaignAudienceType,
  CampaignAudiences,
  CampaignDetail,
  EmailTemplate,
  SendCampaignRequest,
} from './types'

// Value of the audience select: 'all', or '<LandingPage|Product>:<publicId>'.
const ALL_SELECTION = 'all'

type Content = { subject: string; bodyText: string; ctaLabel: string; ctaUrl: string }
const EMPTY_CONTENT: Content = { subject: '', bodyText: '', ctaLabel: '', ctaUrl: '' }

export type CampaignComposer = ReturnType<typeof useCampaignComposer>

function audienceOptions(audiences: CampaignAudiences | null) {
  if (!audiences) return []
  return [
    { value: ALL_SELECTION, recipientCount: audiences.all.recipientCount },
    ...audiences.landingPages.map((p) => ({ value: `LandingPage:${p.publicId}`, recipientCount: p.recipientCount })),
    ...audiences.products.map((p) => ({ value: `Product:${p.publicId}`, recipientCount: p.recipientCount })),
  ]
}

/** State and rules of the "new campaign" form. */
export function useCampaignComposer({ slug }: { slug: string }) {
  const audiences = useCampaignStore((s) => s.audiences)
  const audiencesStatus = useCampaignStore((s) => s.audiencesStatus)
  const loadAudiences = useCampaignStore((s) => s.loadAudiences)
  const sendCampaignForSlug = useCampaignStore((s) => s.sendCampaignForSlug)
  const sendCampaignStatus = useCampaignStore((s) => s.sendCampaignStatus)
  const sendCampaignError = useCampaignStore((s) => s.sendCampaignError)
  const resetSendCampaignFeedback = useCampaignStore((s) => s.resetSendCampaignFeedback)

  const allTemplates = useTemplateStore((s) => s.templates)
  const loadTemplates = useTemplateStore((s) => s.loadTemplates)
  const templates = useMemo(() => allTemplates.filter((t) => t.status === 'Active'), [allTemplates])

  // `null` = the user has not picked yet, so the first audience that has recipients is used.
  const [pickedSelection, setPickedSelection] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState('')
  const [content, setContent] = useState<Content>(EMPTY_CONTENT)
  // What the fields held right after the last template was applied — edits are measured against it.
  const [baseline, setBaseline] = useState<Content>(EMPTY_CONTENT)
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)

  useEffect(() => {
    void loadAudiences(slug)
    void loadTemplates(slug)
  }, [slug, loadAudiences, loadTemplates])

  const options = useMemo(() => audienceOptions(audiences), [audiences])
  const selection = pickedSelection ?? options.find((o) => o.recipientCount > 0)?.value ?? ALL_SELECTION

  const audienceType: CampaignAudienceType =
    selection === ALL_SELECTION ? 'All' : (selection.split(':')[0] as CampaignAudienceType)
  const targetPublicId = selection === ALL_SELECTION ? null : selection.split(':')[1]
  const recipientCount = options.find((o) => o.value === selection)?.recipientCount ?? null

  // The allowance for the chosen audience; a result belongs to the audience it was fetched for.
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const [previewResult, setPreviewResult] = useState<{ key: string; data: AudiencePreview | null } | null>(null)
  const previewKey = `${slug}|${selection}|${previewAttempt}`
  const audienceReady = audiences !== null

  useEffect(() => {
    if (!audienceReady) return
    let active = true
    getAudiencePreview(slug, audienceType, targetPublicId)
      .then((data) => active && setPreviewResult({ key: previewKey, data }))
      .catch(() => active && setPreviewResult({ key: previewKey, data: null }))
    return () => {
      active = false
    }
  }, [slug, audienceReady, audienceType, targetPublicId, previewKey])

  const previewState = previewResult?.key === previewKey ? previewResult : null
  const preview = previewState?.data ?? null
  const previewStatus: 'loading' | 'ready' | 'error' = previewState === null ? 'loading' : preview ? 'ready' : 'error'
  const retryPreview = useCallback(() => setPreviewAttempt((attempt) => attempt + 1), [])

  // null = unlimited (or not known yet).
  const remaining = preview && preview.monthlyLimit >= 0 ? preview.remaining : null
  const overLimit = recipientCount !== null && remaining !== null && recipientCount > remaining

  const ctaLabelSet = content.ctaLabel.trim().length > 0
  const ctaUrlSet = content.ctaUrl.trim().length > 0
  const ctaError =
    ctaLabelSet !== ctaUrlSet ? 'Set both a button label and a button URL, or leave both empty.' : null

  const subjectError = content.subject.trim().length > 0 ? null : 'Add a subject.'
  const bodyError = content.bodyText.trim().length > 0 ? null : 'Write a message.'
  const contentValid = subjectError === null && bodyError === null && ctaError === null

  const isDirty =
    content.subject !== baseline.subject ||
    content.bodyText !== baseline.bodyText ||
    content.ctaLabel !== baseline.ctaLabel ||
    content.ctaUrl !== baseline.ctaUrl

  const setField = useCallback((field: keyof Content, value: string) => {
    setContent((current) => ({ ...current, [field]: value }))
  }, [])

  const applyTemplate = useCallback(
    (id: string) => {
      const template: EmailTemplate | undefined = templates.find((t) => t.publicId === id)
      const next: Content = template
        ? {
            subject: template.subject,
            bodyText: template.bodyText,
            ctaLabel: template.ctaLabel ?? '',
            ctaUrl: template.ctaUrl ?? '',
          }
        : EMPTY_CONTENT
      setTemplateId(template ? id : '')
      setContent(next)
      setBaseline(next)
      setPendingTemplateId(null)
    },
    [templates],
  )

  // Picking a template over content the user has edited asks first; over untouched content it just applies.
  const requestTemplate = useCallback(
    (id: string) => {
      if (isDirty) setPendingTemplateId(id)
      else applyTemplate(id)
    },
    [isDirty, applyTemplate],
  )

  const confirmTemplateReplace = useCallback(() => {
    if (pendingTemplateId !== null) applyTemplate(pendingTemplateId)
  }, [pendingTemplateId, applyTemplate])

  const cancelTemplateReplace = useCallback(() => setPendingTemplateId(null), [])

  const reset = useCallback(() => {
    setTemplateId('')
    setContent(EMPTY_CONTENT)
    setBaseline(EMPTY_CONTENT)
    setPendingTemplateId(null)
    setPickedSelection(null)
  }, [])

  const buildRequest = useCallback(
    (scheduledAt?: string): SendCampaignRequest => ({
      ...(templateId ? { templatePublicId: templateId } : {}),
      subject: content.subject.trim(),
      bodyText: content.bodyText,
      ...(ctaLabelSet ? { ctaLabel: content.ctaLabel.trim(), ctaUrl: content.ctaUrl.trim() } : {}),
      audienceType,
      ...(targetPublicId ? { targetPublicId } : {}),
      ...(scheduledAt ? { scheduledAt } : {}),
    }),
    [templateId, content, ctaLabelSet, audienceType, targetPublicId],
  )

  /** Sends (or schedules) the campaign; on success the form is cleared and usage/audiences refreshed. */
  const send = useCallback(
    async (scheduledAt?: string): Promise<CampaignDetail | null> => {
      const campaign = await sendCampaignForSlug(slug, buildRequest(scheduledAt))
      if (campaign) {
        reset()
        void loadAudiences(slug)
      }
      return campaign
    },
    [slug, sendCampaignForSlug, buildRequest, reset, loadAudiences],
  )

  return {
    audiences,
    audiencesStatus,
    selection,
    setSelection: setPickedSelection,
    audienceType,
    targetPublicId,
    recipientCount,
    templates,
    templateId,
    requestTemplate,
    pendingTemplate: pendingTemplateId === null ? null : (templates.find((t) => t.publicId === pendingTemplateId) ?? null),
    pendingIsBlank: pendingTemplateId === '',
    hasPendingTemplate: pendingTemplateId !== null,
    confirmTemplateReplace,
    cancelTemplateReplace,
    content,
    setField,
    ctaError,
    preview,
    previewStatus,
    retryPreview,
    remaining,
    overLimit,
    subjectError,
    bodyError,
    contentValid,
    buildRequest,
    send,
    isSending: sendCampaignStatus === 'submitting',
    sendError: sendCampaignError,
    resetSendFeedback: resetSendCampaignFeedback,
    reset,
  }
}
