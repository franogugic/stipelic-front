import { Mails } from 'lucide-react'
import { dateShort, percent, plural } from '../../../shared/lib/format'
import { AreaChart, Card, ChartLegend, EmptyState } from '../../../shared/ui/ledger'
import { campaignDateOf, openRateOf } from '../model/campaign-groups'
import type { CampaignListItem } from '../model/types'

/** "Open rate by campaign": each sent campaign's open rate against your average. */
export function OpenRateChartCard({ sent }: { sent: CampaignListItem[] }) {
  const delivered = sent.reduce((total, campaign) => total + campaign.sentCount, 0)
  const average = delivered > 0 ? (sent.reduce((total, campaign) => total + campaign.uniqueOpenCount, 0) / delivered) * 100 : 0
  const rounded = (value: number) => `${Math.round(value)}%`

  return (
    <Card title="Open rate by campaign" subtitle={sent.length > 0 ? `Your last ${plural(sent.length, 'campaign')}` : undefined}>
      {sent.length === 0 ? (
        <EmptyState compact icon={Mails} title="No campaigns sent yet" text="Each campaign’s open rate shows up here once it’s out." />
      ) : (
        <>
          <ChartLegend
            title="Opened ÷ delivered"
            keys={[{ label: 'Each campaign' }, { label: `Your average ${percent(average)}`, previous: true }]}
          />
          <AreaChart
            labels={sent.map((campaign) => dateShort(campaignDateOf(campaign)))}
            titles={sent.map((campaign) => `${campaign.subject} (${dateShort(campaignDateOf(campaign))})`)}
            values={sent.map(openRateOf)}
            previous={sent.map(() => average)}
            previousLabel="Your average"
            label="Open rate of each sent campaign"
            formatValue={rounded}
            describe={(value) => `${percent(value)} opened`}
            live={false}
          />
        </>
      )}
    </Card>
  )
}
