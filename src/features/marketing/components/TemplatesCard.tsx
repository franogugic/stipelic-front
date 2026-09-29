import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Card, GhostBtn, StatusBadge } from '../../../shared/ui/figma'
import type { CreatorSettings } from '../../creators/model/types'
import { useTemplateStore } from '../model/template-store'
import type { EmailTemplate } from '../model/types'
import { TemplateEditorPanel } from './TemplateEditorPanel'

export function TemplatesCard({
  slug,
  templates,
  templatesStatus,
  creatorSettings,
  className = '',
}: {
  slug: string
  templates: EmailTemplate[]
  templatesStatus: 'idle' | 'loading' | 'success' | 'error'
  creatorSettings: CreatorSettings | null
  className?: string
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  const currentTemplate = useTemplateStore((s) => s.currentTemplate)
  const loadTemplate = useTemplateStore((s) => s.loadTemplate)
  const clearCurrentTemplate = useTemplateStore((s) => s.clearCurrentTemplate)

  const openCreate = () => {
    clearCurrentTemplate()
    setEditingTemplateId(null)
    setIsEditorOpen(true)
  }

  const openEdit = (templatePublicId: string) => {
    void loadTemplate(slug, templatePublicId)
    setEditingTemplateId(templatePublicId)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setIsEditorOpen(false)
    setEditingTemplateId(null)
    clearCurrentTemplate()
  }

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.2rem' }}>
          Templates
        </p>
        <GhostBtn onClick={openCreate}>+ New Template</GhostBtn>
      </div>

      {templatesStatus === 'loading' || (templatesStatus === 'idle' && templates.length === 0) ? (
        <div className="flex h-32 items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={16} />
          Loading templates…
        </div>
      ) : templatesStatus === 'error' && templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Could not load your templates. Please try again.</p>
      ) : templates.length === 0 && !isEditorOpen ? (
        <p className="text-sm text-muted-foreground">
          No templates yet. Templates are reusable — write the content once, then start any campaign from it.
        </p>
      ) : (
        <div className="flex gap-4 h-[560px]">
          {/* Left list */}
          <div className="flex w-[38%] flex-col">
            <div className="flex-1 overflow-y-auto rounded-lg border border-border">
              {templates.map((template) => {
                const isSelected = isEditorOpen && editingTemplateId === template.publicId
                return (
                  <button
                    key={template.publicId}
                    type="button"
                    onClick={() => openEdit(template.publicId)}
                    className="w-full text-left px-4 py-3 transition-all border-b border-border last:border-b-0"
                    style={{
                      backgroundColor: isSelected
                        ? 'color-mix(in srgb, var(--color-chart-1) 10%, transparent)'
                        : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--color-chart-1)' : '2px solid transparent',
                    }}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{template.name}</p>
                      <StatusBadge status={template.status} />
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{template.subject}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right edit panel */}
          <div className="flex-1 min-w-0">
            {!isEditorOpen ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a template or create a new one</p>
              </div>
            ) : editingTemplateId && currentTemplate?.publicId !== editingTemplateId ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-border">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : (
              <TemplateEditorPanel
                key={editingTemplateId ?? 'new'}
                slug={slug}
                template={editingTemplateId ? currentTemplate ?? undefined : undefined}
                creatorSettings={creatorSettings}
                onClose={closeEditor}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
