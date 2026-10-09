import { Archive, ArchiveRestore, ArrowLeft, LayoutTemplate, Pencil, Plus, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { date } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Menu,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  TabPanel,
  Tabs,
  useTabs,
  useToast,
} from '../../../shared/ui/ledger'
import type { MenuItem } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { NewTemplateModal } from '../components/NewTemplateModal'
import { useTemplateStore } from '../model/template-store'
import type { EmailTemplate } from '../model/types'

/** Email templates: the reusable starting points for campaigns, in an Active and an Archived list. */
export function TemplatesPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { slug = '' } = useParams<{ slug: string }>()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  const templates = useTemplateStore((s) => s.templates)
  const templatesStatus = useTemplateStore((s) => s.templatesStatus)
  const templatesSlug = useTemplateStore((s) => s.templatesSlug)
  const loadTemplates = useTemplateStore((s) => s.loadTemplates)
  const starters = useTemplateStore((s) => s.starters)
  const startersStatus = useTemplateStore((s) => s.startersStatus)
  const loadStarters = useTemplateStore((s) => s.loadStarters)
  const archiveTemplateForSlug = useTemplateStore((s) => s.archiveTemplateForSlug)
  const archiveTemplateStatus = useTemplateStore((s) => s.archiveTemplateStatus)
  const archiveTemplateError = useTemplateStore((s) => s.archiveTemplateError)
  const resetArchiveTemplateFeedback = useTemplateStore((s) => s.resetArchiveTemplateFeedback)
  const restoreTemplateForSlug = useTemplateStore((s) => s.restoreTemplateForSlug)

  // `null` = closed; the key remounts the modal so each opening starts fresh.
  const [creating, setCreating] = useState<number | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<EmailTemplate | null>(null)

  const active = templates.filter((template) => template.status === 'Active')
  const archived = templates.filter((template) => template.status === 'Archived')
  const tabs = useTabs({
    items: [
      { key: 'active', label: 'Active', count: active.length },
      { key: 'archived', label: 'Archived', count: archived.length },
    ],
    label: 'Template status',
    defaultValue: 'active',
    paramName: 'tab',
    panelId: 'templates-panel',
  })

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (slug) void loadTemplates(slug)
  }, [slug, loadTemplates])

  useEffect(() => {
    if (slug) void loadStarters(slug)
  }, [slug, loadStarters])

  if (!slug) return null

  const editorPath = (template: EmailTemplate) => `/app/${slug}/emails/templates/${template.publicId}`
  // The store keeps the last workspace's list until the new one has loaded; never show it under another address.
  const listStatus = templatesSlug === slug || templatesStatus === 'error' ? templatesStatus : 'loading'

  const confirmArchive = async () => {
    if (!archiveTarget) return
    if (!(await archiveTemplateForSlug(slug, archiveTarget.publicId))) return
    setArchiveTarget(null)
    toast({ tone: 'success', title: 'Template archived' })
  }

  const restore = async (template: EmailTemplate) => {
    if (await restoreTemplateForSlug(slug, template.publicId)) {
      toast({ tone: 'success', title: 'Template restored', message: 'It’s back in your Active templates.' })
    } else {
      toast({ tone: 'danger', title: useTemplateStore.getState().restoreTemplateError ?? 'We could not restore this template.' })
    }
  }

  const create = (name: string, starter: string | null) => {
    const query = new URLSearchParams({ name })
    if (starter) query.set('starter', starter)
    navigate(`/app/${slug}/emails/templates/new?${query}`)
  }

  const menuItems = (template: EmailTemplate): MenuItem[] =>
    template.status === 'Active'
      ? [
          { label: 'Edit', icon: Pencil, to: editorPath(template) },
          { label: 'Use in a campaign', icon: Send, to: `/app/${slug}/emails/new` },
          'separator',
          {
            label: 'Archive',
            icon: Archive,
            tone: 'danger',
            onSelect: () => {
              resetArchiveTemplateFeedback()
              setArchiveTarget(template)
            },
          },
        ]
      : [{ label: 'Restore', icon: ArchiveRestore, onSelect: () => void restore(template) }]

  const list = (rows: EmailTemplate[], tab: 'active' | 'archived') => {
    if (rows.length === 0) {
      return tab === 'archived' ? (
        <EmptyState
          compact
          icon={Archive}
          title="Nothing archived"
          text="Templates you archive end up here. You can restore them any time."
        />
      ) : (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          text="Save a layout once and reuse it — or start from one of the starter templates."
          action={{ label: 'New template', icon: Plus, variant: 'primary', onClick: () => setCreating(Date.now()) }}
        />
      )
    }
    return (
      <div className="table-wrap">
        <table className="table table--stack">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Subject</th>
              <th scope="col">Last edited</th>
              <th scope="col">Status</th>
              <th scope="col" className="is-actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((template) => (
              <tr key={template.publicId}>
                <td className="is-lead">
                  <Link className="table__primary" to={editorPath(template)}>
                    {template.name}
                  </Link>
                </td>
                <td data-label="Subject" className="text-secondary">
                  {template.subject}
                </td>
                <td data-label="Edited" className="num">
                  {date(template.updatedAt)}
                </td>
                <td data-label="Status">
                  <StatusBadge kind="template" value={template.status.toLowerCase()} />
                </td>
                <td className="is-actions">
                  <Menu label={`Actions for ${template.name}`} items={menuItems(template)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const body = () => {
    if (listStatus === 'idle' || listStatus === 'loading') return <SkeletonRows />
    if (listStatus === 'error') return <ErrorState onRetry={() => void loadTemplates(slug)} />
    return (
      <>
        <Tabs {...tabs.tablistProps} className="templates__tabs" />
        <TabPanel tabs={tabs}>
          <Card>{tabs.active === 'archived' ? list(archived, 'archived') : list(active, 'active')}</Card>
        </TabPanel>
      </>
    )
  }

  return (
    <AppShell slug={slug} activeSection="emails">
      {creatorLoading ? (
        <SkeletonRows />
      ) : !creator ? (
        <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
      ) : (
        <>
          <PageHeader
            eyebrow="Email marketing"
            title={
              <>
                Email <em>templates</em>
              </>
            }
            subtitle="Reusable starting points for your campaigns."
            actions={
              <>
                <Button variant="ghost" icon={ArrowLeft} to={`/app/${slug}/emails`}>
                  Back
                </Button>
                <Button variant="primary" icon={Plus} onClick={() => setCreating(Date.now())}>
                  New template
                </Button>
              </>
            }
          />
          {body()}
          {creating !== null && (
            <NewTemplateModal
              key={creating}
              open
              starters={starters}
              startersStatus={startersStatus}
              onClose={() => setCreating(null)}
              onCreate={create}
            />
          )}
          <ConfirmDialog
            open={archiveTarget !== null}
            title={`Archive “${archiveTarget?.name ?? ''}”?`}
            text="It disappears from the template list in new campaigns. Campaigns that already used it aren’t affected. You can restore it any time."
            confirmLabel="Archive template"
            tone="warning"
            icon={Archive}
            busy={archiveTemplateStatus === 'submitting'}
            onCancel={() => setArchiveTarget(null)}
            onConfirm={() => void confirmArchive()}
          >
            {archiveTemplateError && <p className="field__error">{archiveTemplateError}</p>}
          </ConfirmDialog>
        </>
      )}
    </AppShell>
  )
}
