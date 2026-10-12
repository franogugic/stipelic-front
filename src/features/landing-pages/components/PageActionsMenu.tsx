import { Archive, ArchiveRestore, ChartColumn, ExternalLink, Link as LinkIcon, Pencil, Rocket } from 'lucide-react'
import { Menu } from '../../../shared/ui/ledger'
import type { MenuItem } from '../../../shared/ui/ledger'
import type { LandingPage } from '../model/types'

/** The actions of one landing page, in its tile and in the list. */
export function PageActionsMenu({
  page,
  creatorSlug,
  busy,
  onTogglePublish,
  onArchive,
  onRestore,
  onCopyLink,
}: {
  page: LandingPage
  creatorSlug: string
  /** An action on this page is running: its actions are disabled until it settles. */
  busy: boolean
  onTogglePublish: () => void
  onArchive: () => void
  onRestore: () => void
  onCopyLink: () => void
}) {
  const analyticsUrl = `/app/${creatorSlug}/landing-pages/${page.publicId}`
  const archived = page.status === 'Archived'

  const items: MenuItem[] = [
    { label: 'Edit', icon: Pencil, to: `${analyticsUrl}/edit` },
    { label: 'Analytics', icon: ChartColumn, to: analyticsUrl },
    {
      label: 'Open public page',
      icon: ExternalLink,
      href: `/p/${creatorSlug}/${page.slug}`,
      external: true,
      disabledReason: page.status === 'Published' ? undefined : 'Publish the page to open it.',
    },
    { label: 'Copy link', icon: LinkIcon, onSelect: onCopyLink },
    'separator',
    ...(archived
      ? [{ label: 'Restore', icon: ArchiveRestore, onSelect: onRestore, disabled: busy } satisfies MenuItem]
      : [
          {
            label: page.status === 'Published' ? 'Unpublish' : 'Publish',
            icon: Rocket,
            onSelect: onTogglePublish,
            disabled: busy,
          } satisfies MenuItem,
          { label: 'Archive', icon: Archive, onSelect: onArchive, tone: 'danger', disabled: busy } satisfies MenuItem,
        ]),
  ]
  return <Menu label={`Actions for ${page.title}`} items={items} />
}
