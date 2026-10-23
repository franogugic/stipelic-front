import { Info, Link2Off, MousePointerClick } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { number, plural } from '../../../shared/lib/format'
import { Badge, Card } from '../../../shared/ui/ledger'
import { clickInfoOfDetail, shortUrl } from '../model/clicks'
import type { CampaignDetail } from '../model/types'

function QuietNote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="quiet-note">
      {icon}
      <span>{children}</span>
    </p>
  )
}

/** "Links": every link of a sent campaign with the people who clicked it, most clicked first. */
export function CampaignLinksCard({ campaign }: { campaign: CampaignDetail }) {
  if (campaign.status !== 'Queued') return null
  const info = clickInfoOfDetail(campaign)
  if (info.kind === 'untracked') {
    return (
      <Card title="Links">
        <QuietNote icon={<Info />}>Click tracking wasn’t on when this campaign was sent.</QuietNote>
      </Card>
    )
  }
  if (info.kind === 'nolinks') {
    return (
      <Card title="Links">
        <QuietNote icon={<Link2Off />}>This email had no links, so there was nothing to click.</QuietNote>
      </Card>
    )
  }
  const links = [...campaign.clicks.links].sort((a, b) => b.uniqueClicks - a.uniqueClicks || b.totalClicks - a.totalClicks)
  const top = Math.max(...links.map((link) => link.uniqueClicks), 1)
  return (
    <Card title="Links" subtitle={`${plural(links.length, 'link')} · most clicked first`}>
      {campaign.clicks.uniqueClickers === 0 && (
        <QuietNote icon={<MousePointerClick />}>No clicks yet — they show up here as people click.</QuietNote>
      )}
      <ol className="link-stats" role="list">
        {links.map((link) => (
          <li className="link-stats__row" key={`${link.position}-${link.url}`}>
            <div className="link-stats__main">
              <span className="link-stats__where">
                {link.kind === 'Button' ? (
                  <>
                    <Badge tone="accent" icon={MousePointerClick}>
                      Button
                    </Badge>
                    <span className="link-stats__text">“{link.label}”</span>
                  </>
                ) : (
                  <Badge tone="outline">Text link</Badge>
                )}
              </span>
              <a
                className="link-stats__url"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                data-tooltip={link.url}
                aria-label={`${link.url} (opens in a new tab)`}
              >
                {shortUrl(link.url)}
              </a>
              <span className="link-stats__bar" aria-hidden="true">
                <span style={{ '--w': `${((link.uniqueClicks / top) * 100).toFixed(1)}%` } as CSSProperties} />
              </span>
            </div>
            <div className="link-stats__nums">
              <span className="link-stats__people">
                <strong>{number(link.uniqueClicks)}</strong> {link.uniqueClicks === 1 ? 'person' : 'people'}
              </span>
              <span className="text-xs text-muted">{plural(link.totalClicks, 'click')}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="link-stats__foot">People counts everyone who clicked a link at least once; clicks include repeats.</p>
    </Card>
  )
}
