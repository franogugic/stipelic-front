import { apiRequest } from '../../../shared/api/http-client'
import type {
  CreateLandingPageRequest,
  LandingPage,
  LandingPageAnalytics,
  LandingPageWithSections,
  SaveEditorRequest,
  SectionTemplate,
} from '../model/types'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

export async function listLandingPages(slug: string): Promise<LandingPage[]> {
  const res = await apiRequest<ApiResponse<LandingPage[]>>(`/api/creators/${slug}/landing-pages`)
  return res.data
}

export async function getLandingPage(slug: string, pageId: string): Promise<LandingPageWithSections> {
  const res = await apiRequest<ApiResponse<LandingPageWithSections>>(`/api/creators/${slug}/landing-pages/${pageId}`)
  return res.data
}

export async function createLandingPage(slug: string, request: CreateLandingPageRequest): Promise<LandingPage> {
  const res = await apiRequest<ApiResponse<LandingPage>>(`/api/creators/${slug}/landing-pages`, { method: 'POST', body: request })
  return res.data
}

export async function publishLandingPage(slug: string, pageId: string): Promise<void> {
  await apiRequest<unknown>(`/api/creators/${slug}/landing-pages/${pageId}/publish`, { method: 'POST' })
}

export async function unpublishLandingPage(slug: string, pageId: string): Promise<void> {
  await apiRequest<unknown>(`/api/creators/${slug}/landing-pages/${pageId}/unpublish`, { method: 'POST' })
}

export async function archiveLandingPage(slug: string, pageId: string): Promise<void> {
  await apiRequest<unknown>(`/api/creators/${slug}/landing-pages/${pageId}`, { method: 'DELETE' })
}

export async function saveEditor(slug: string, pageId: string, request: SaveEditorRequest): Promise<LandingPageWithSections> {
  const res = await apiRequest<ApiResponse<LandingPageWithSections>>(
    `/api/creators/${slug}/landing-pages/${pageId}/editor`,
    { method: 'PUT', body: request },
  )
  return res.data
}

export async function getSectionTemplates(slug: string): Promise<SectionTemplate[]> {
  const res = await apiRequest<ApiResponse<SectionTemplate[]>>(`/api/creators/${slug}/landing-pages/section-templates`)
  return res.data
}

export async function getLandingPageAnalytics(slug: string, pageId: string): Promise<LandingPageAnalytics> {
  const res = await apiRequest<ApiResponse<LandingPageAnalytics>>(`/api/creators/${slug}/landing-pages/${pageId}/analytics`)
  return res.data
}
