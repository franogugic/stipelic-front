import { Send } from 'lucide-react'
import { useState } from 'react'
import { Card, GhostBtn, Modal, PrimaryBtn } from '../../../shared/ui/figma'
import type { CreatorSettings } from '../../creators/model/types'
import { useCampaignComposer } from '../model/use-campaign-composer'
import type { CampaignDetail } from '../model/types'
import { CampaignComposerFields } from './CampaignComposerFields'
import { SendCampaignModal } from './SendCampaignModal'
import { MailPreview } from './TemplateEditorPanel'

export function NewCampaignCard({
  slug,
  creatorSettings,
  className = '',
}: {
  slug: string
  creatorSettings: CreatorSettings | null
  className?: string
}) {
  const composer = useCampaignComposer({ slug })
  const [isSendOpen, setIsSendOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSent = (campaign: CampaignDetail) => {
    setIsSendOpen(false)
    setSuccessMessage(
      campaign.status === 'Scheduled' && campaign.scheduledAt
        ? `Campaign scheduled for ${new Date(campaign.scheduledAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}.`
        : 'Campaign queued for sending.',
    )
  }

  const { content } = composer
  const hasCta = content.ctaLabel.trim().length > 0 && content.ctaUrl.trim().length > 0

  return (
    <Card className={`p-5 ${className}`}>
      <p className="font-bold mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.2rem' }}>
        New Campaign
      </p>

      <CampaignComposerFields composer={composer} />

      <div className="flex gap-2 pt-4">
        <PrimaryBtn
          className="flex-1 justify-center py-2.5"
          icon={<Send size={14} />}
          disabled={!composer.canSend}
          onClick={() => {
            composer.resetSendFeedback()
            setSuccessMessage(null)
            setIsSendOpen(true)
          }}
        >
          Send Campaign
        </PrimaryBtn>
        <GhostBtn className="px-5 py-2.5" onClick={() => setIsPreviewOpen(true)}>
          Preview
        </GhostBtn>
      </div>

      {successMessage && (
        <p role="status" className="text-xs mt-3" style={{ color: 'var(--color-chart-1)' }}>
          {successMessage}
        </p>
      )}

      <SendCampaignModal
        open={isSendOpen}
        composer={composer}
        onClose={() => setIsSendOpen(false)}
        onSent={handleSent}
      />

      <Modal open={isPreviewOpen} title="Preview" onClose={() => setIsPreviewOpen(false)}>
        <MailPreview
          subject={content.subject}
          bodyText={content.bodyText}
          ctaLabel={hasCta ? content.ctaLabel : null}
          ctaUrl={hasCta ? content.ctaUrl : null}
          brandName={creatorSettings?.brandName ?? creatorSettings?.creatorName ?? 'Your brand'}
          logoUrl={creatorSettings?.logoUrl ?? null}
          primaryColor={creatorSettings?.primaryColor ?? '#4C7CF0'}
        />
      </Modal>
    </Card>
  )
}
