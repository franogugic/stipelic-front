import { FieldInput, GhostBtn, Modal, PrimaryBtn, SelectInput, TextArea } from '../../../shared/ui/figma'
import type { CampaignComposer } from '../model/use-campaign-composer'
import {
  BODY_MAX_LENGTH,
  CTA_LABEL_MAX_LENGTH,
  CTA_URL_MAX_LENGTH,
  SUBJECT_MAX_LENGTH,
} from '../model/mail-content-rules'

const ALL_SELECTION = 'all'

/**
 * The fields of the new-campaign form, driven by `useCampaignComposer`. `hideAudience` drops the
 * audience select for screens whose audience is fixed (the composer is then `lockedToAll`).
 */
export function CampaignComposerFields({
  composer,
  hideAudience = false,
}: {
  composer: CampaignComposer
  hideAudience?: boolean
}) {
  const { audiences, audiencesStatus, content, remaining, recipientCount, overLimit } = composer

  const infoText =
    recipientCount === null
      ? audiencesStatus === 'error'
        ? 'Could not load your audiences.'
        : 'Loading audience…'
      : `${recipientCount.toLocaleString()} recipient${recipientCount === 1 ? '' : 's'} · ${
          remaining === null ? 'unlimited' : remaining.toLocaleString()
        } sends left this month`

  return (
    <div className="space-y-3">
      {!hideAudience && (
        <SelectInput
          label="Audience"
          value={composer.selection}
          onChange={composer.setSelection}
          disabled={!audiences}
        >
          {!audiences ? (
            <option value={ALL_SELECTION}>
              {audiencesStatus === 'error' ? 'Could not load audiences' : 'Loading audiences…'}
            </option>
          ) : (
            <>
              <option value={ALL_SELECTION} disabled={audiences.all.recipientCount === 0}>
                All Subscribers ({audiences.all.recipientCount.toLocaleString()} total)
              </option>
              {audiences.landingPages.length > 0 && (
                <optgroup label="Landing pages">
                  {audiences.landingPages.map((page) => (
                    <option
                      key={page.publicId}
                      value={`LandingPage:${page.publicId}`}
                      disabled={page.recipientCount === 0}
                    >
                      {page.title} ({page.recipientCount.toLocaleString()} subscribers)
                    </option>
                  ))}
                </optgroup>
              )}
              {audiences.products.length > 0 && (
                <optgroup label="Products">
                  {audiences.products.map((product) => (
                    <option
                      key={product.publicId}
                      value={`Product:${product.publicId}`}
                      disabled={product.recipientCount === 0}
                    >
                      {product.name} ({product.recipientCount.toLocaleString()} subscribers)
                    </option>
                  ))}
                </optgroup>
              )}
            </>
          )}
        </SelectInput>
      )}

      <SelectInput label="Start from template" value={composer.templateId} onChange={composer.requestTemplate}>
        <option value="">— Blank —</option>
        {composer.templates.map((template) => (
          <option key={template.publicId} value={template.publicId}>
            {template.name}
          </option>
        ))}
      </SelectInput>

      <FieldInput
        label="Subject Line"
        value={content.subject}
        onChange={(value) => composer.setField('subject', value)}
        placeholder="Write a compelling subject…"
        maxLength={SUBJECT_MAX_LENGTH}
      />

      <TextArea
        label="Message"
        rows={7}
        value={content.bodyText}
        onChange={(value) => composer.setField('bodyText', value)}
        placeholder="Write your email content here…"
        maxLength={BODY_MAX_LENGTH}
      />

      <div className="grid grid-cols-2 gap-3">
        <FieldInput
          label="Button label (optional)"
          value={content.ctaLabel}
          onChange={(value) => composer.setField('ctaLabel', value)}
          placeholder="Shop now"
          maxLength={CTA_LABEL_MAX_LENGTH}
        />
        <FieldInput
          label="Button URL (optional)"
          type="url"
          value={content.ctaUrl}
          onChange={(value) => composer.setField('ctaUrl', value)}
          placeholder="https://…"
          maxLength={CTA_URL_MAX_LENGTH}
          error={composer.ctaError ?? undefined}
        />
      </div>

      <p
        className="text-[11px] text-muted-foreground"
        style={overLimit ? { color: 'var(--color-chart-4)' } : undefined}
      >
        {infoText}
        {overLimit ? ' — this exceeds your remaining monthly sends.' : ''}
      </p>

      <Modal open={composer.hasPendingTemplate} title="Replace current content?" onClose={composer.cancelTemplateReplace}>
        <p className="text-sm text-muted-foreground mb-5">
          {composer.pendingIsBlank
            ? 'This clears the subject, message and button you have written.'
            : `This replaces the subject, message and button you have written with the content of “${
                composer.pendingTemplate?.name ?? 'the template'
              }”.`}
        </p>
        <div className="flex gap-2">
          <PrimaryBtn className="flex-1 justify-center" onClick={composer.confirmTemplateReplace}>
            Replace
          </PrimaryBtn>
          <GhostBtn className="px-5" onClick={composer.cancelTemplateReplace}>
            Keep mine
          </GhostBtn>
        </div>
      </Modal>
    </div>
  )
}
