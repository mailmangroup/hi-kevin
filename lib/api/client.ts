/**
 * API Client
 *
 * Unified API client that switches between mock and real data based on environment.
 * This allows for easy transition from demo to production.
 */

import { useUserStore } from '@/lib/store/user-store'
import { DEFAULT_KAWO_API_URL } from '@/lib/kawo-config'
import type { ContentItem } from '@/types'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

const SUPPORTED_PLATFORMS = ['xiaohongshu', 'douyin', 'weibo', 'wechat'] as const

function batchToContentItem(batch: any): ContentItem {
  const firstPlatform = batch.platforms?.[0]?.platform
  const platform = SUPPORTED_PLATFORMS.includes(firstPlatform) ? firstPlatform : 'xiaohongshu'
  return {
    id: batch._id || batch.id,
    platform: platform as ContentItem['platform'],
    type: 'post',
    status: 'draft',
    title: batch.inspiration_card_title || batch.query || 'Untitled',
    body: batch.query || '',
    mediaUrls: [],
    hashtags: [],
    complianceStatus: 'pending',
    createdAt: new Date(batch.created_at),
    updatedAt: new Date(batch.created_at),
    createdBy: batch.user_id || '',
  }
}

/**
 * Helper function to get KAWO configuration
 * Checks NEXT_PUBLIC_* env vars first (works in browser)
 * Falls back to Supabase profile (production)
 */
export function getKawoConfig() {
  // Check browser-accessible env vars first
  const token = process.env.NEXT_PUBLIC_KAWO_TOKEN
  const orgId = process.env.NEXT_PUBLIC_KAWO_ORG_ID
  const brandId = process.env.NEXT_PUBLIC_KAWO_BRAND_ID
  const apiUrl = process.env.NEXT_PUBLIC_KAWO_API_URL || DEFAULT_KAWO_API_URL

  if (token && orgId && brandId && apiUrl) {
    return {
      token,
      orgId,
      brandId,
      apiUrl,
    }
  }

  // Fallback to user profile from Supabase
  const { profile } = useUserStore.getState()
  return {
    token: profile?.kawo_token,
    orgId: profile?.kawo_org_id,
    brandId: profile?.kawo_brand_id,
    apiUrl: profile?.kawo_api_url || DEFAULT_KAWO_API_URL,
  }
}

/**
 * Direct API call to KAWO backend.
 * Always calls the backend directly with auth headers.
 */
const DEFAULT_TIMEOUT_MS = 30_000 // 30 seconds

export async function directApiCall<T>(
  endpoint: string,
  options?: RequestInit & { timeoutMs?: number; includeOrgBrandHeaders?: boolean }
): Promise<T> {
  const config = getKawoConfig()

  if (!config.apiUrl || !config.token) {
    throw new Error('KAWO credentials not configured. Please complete setup.')
  }

  if (options?.includeOrgBrandHeaders !== false && (!config.orgId || !config.brandId)) {
    throw new Error('KAWO Organization and Brand IDs not configured. Please complete setup.')
  }

  const targetUrl = `${config.apiUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`

  // Ensure headers are properly set
  const headers = new Headers(options?.headers)
  headers.set('Authorization', `Bearer ${config.token}`)
  if (options?.includeOrgBrandHeaders !== false) {
    headers.set('X-KAWO-Org-Id', config.orgId!)
    headers.set('X-KAWO-Brand-Id', config.brandId!)
  }

  const hasBody = options?.body !== undefined && options?.body !== null
  if (hasBody && !(options?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: options?.signal ?? controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorData: any = {}
      try {
        errorData = await response.json()
      } catch {
        try {
          const text = await response.text()
          errorData = { error: response.statusText, text }
        } catch {
          errorData = { error: response.statusText }
        }
      }

      const error: any = new Error(errorData.error || errorData.message || response.statusText)
      error.status = response.status
      error.code = errorData.code
      error.details = errorData
      throw error
    }

    return response.json()
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request to ${endpoint} timed out`)
    }
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(`Failed to reach ${endpoint}. This is usually a network/CORS/proxy issue, not an auth token issue.`)
    }
    throw err
  }
}


/**
 * Map user-friendly platform names to backend network keys
 */
const PLATFORM_TO_NETWORK_MAP: Record<string, string> = {
  // Chinese platforms
  'weibo': 'sweibo',
  'wechat': 'wechat',
  'douyin': 'douyin',
  'kuaishou': 'kuaishou',
  'bilibili': 'bilibili',
  'xiaohongshu': 'xhs',
  'xhs': 'xhs',
  'red': 'xhs',
  'wechat channels': 'sph',
  'channels': 'sph',
  'sph': 'sph',
  // International platforms
  'instagram': 'instagram',
  'facebook': 'facebook',
  'x': 'x',
  'twitter': 'x',
  'linkedin': 'linkedin',
  'youtube': 'youtube',
  'tiktok': 'tiktok',
}

/**
 * Convert platform name to backend network key
 */
function mapPlatformToNetwork(platform: string): string {
  const key = platform.toLowerCase().trim()
  return PLATFORM_TO_NETWORK_MAP[key] || key
}

export interface Conversation {
  id: string
  title: string
  updated_at: string
  message_count: number
  last_message?: string
  is_favorite: boolean
  conversation_mode?: "agent" | "deep_agent"
  has_report?: boolean
  project_id?: string
}

export interface Message {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  created_at: string
  sub_content_list?: any[]
  report_id?: string
  report?: any
  type?: string
}

export interface ReportFromTemplate {
  name: "brand_report"
  start_date: number  // Unix timestamp in ms
  end_date: number
  prev_start_date?: number
  prev_end_date?: number
  language: "en" | "cn"
}

export interface Project {
  id: string
  name: string
  description?: string
  instructions?: string
  status: 'active' | 'archived'
  retrieval_strategy?: string
  total_tokens: number
  document_count: number
  created_at: string
  updated_at: string
}

export interface ProjectDocument {
  id: string
  filename: string
  file_size: number
  file_type: string
  ingestion_status: 'pending' | 'completed' | 'failed'
  char_count: number
  token_count: number
  chunk_count: number
  document_summary?: string
  has_contextual_enrichment: boolean
  created_at: string
  processed_at?: string
}

export interface Skill {
  id: string
  name: string
  description: string
  content: string
  is_enabled: boolean
  created_at: string
  updated_at: string
  files: string[]
}

export interface MemoryFact {
  id: string
  content: string
  category: string
  created_at: string
  updated_at: string
  source_conversation_id?: string
}

export interface GlobalMemoryResponse {
  user_id: string
  facts: MemoryFact[]
  last_extraction_at?: string
  extraction_count: number
}

export interface ProjectMemoryResponse {
  project_id: string
  user_id: string
  facts: MemoryFact[]
  last_extraction_at?: string
  extraction_count: number
}

export interface EditMemoryWithLLMResponse {
  success: boolean
  action: string
  fact_id?: string
  new_content?: string
  explanation?: string
  message?: string
}

/**
 * AI Service
 * Handles all AI-related operations
 */
export const aiService = {
  /**
   * Get list of conversations
   */
  async getConversations(
    limit = 20,
    skip = 0,
    conversationMode?: "agent" | "deep_agent"
  ): Promise<{ conversations: Conversation[], total: number }> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        return {
            conversations: [
                { id: '1', title: 'Content Strategy Q1', updated_at: new Date().toISOString(), message_count: 5, is_favorite: false },
                { id: '2', title: 'Lead Scoring Analysis', updated_at: new Date(Date.now() - 86400000).toISOString(), message_count: 3, is_favorite: true },
            ],
            total: 2
        }
    }
    const params = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    })
    if (conversationMode) {
      params.set("conversation_mode", conversationMode)
    }
    return directApiCall(`agent/conversations?${params.toString()}`)
  },

  /**
   * Get a single conversation
   */
  async getConversation(conversationId: string): Promise<Conversation> {
      if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
          return { id: conversationId, title: 'Mock Conversation', updated_at: new Date().toISOString(), message_count: 5, is_favorite: false }
      }
      return directApiCall(`agent/conversations/${conversationId}`)
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit = 50, skip = 0): Promise<{ messages: Message[], total: number }> {
      if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
          return {
              messages: [
                  { id: '1', role: 'assistant', content: 'Hello! I am Kevin.', created_at: new Date().toISOString() }
              ],
              total: 1
          }
      }
      return directApiCall(`agent/conversations/${conversationId}/messages?limit=${limit}&skip=${skip}`)
  },

  /**
   * Get report details
   */
  async getReport(conversationId: string, reportId: string): Promise<any> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        return {
            id: reportId,
            title: 'Mock Report',
            pages: []
        }
    }
    return directApiCall(`agent/conversations/${conversationId}/report/${reportId}`)
  },

  /**
   * Export a report as a downloadable HTML file
   */
  async exportReport(reportId: string): Promise<void> {
    const config = getKawoConfig()
    if (!config.apiUrl || !config.token) {
      throw new Error('KAWO credentials not configured.')
    }
    const url = `${config.apiUrl.replace(/\/$/, '')}/agent/reports/${reportId}/export`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        'X-KAWO-Org-Id': config.orgId ?? '',
        'X-KAWO-Brand-Id': config.brandId ?? '',
      },
    })
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }
    const disposition = response.headers.get('Content-Disposition') ?? ''
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i)
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : `report-${reportId}.html`
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(objectUrl)
  },

  /**
   * Update report section insights
   */
  async updateReportInsights(
    reportId: string,
    pageNumber: number,
    sectionIdx: number,
    insights: string[]
  ): Promise<any> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        return { success: true }
    }
    return directApiCall(`agent/reports/${reportId}/pages/${pageNumber}/sections/${sectionIdx}/insights`, {
        method: 'PUT',
        body: JSON.stringify({ insights })
    })
  },



  /**
   * Update conversation favorite status
   */
  async updateConversationFavorite(conversationId: string, isFavorite: boolean): Promise<Conversation> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        return { 
            id: conversationId, 
            title: 'Mock Conversation', 
            updated_at: new Date().toISOString(), 
            message_count: 5, 
            is_favorite: isFavorite 
        }
    }
    return directApiCall(`agent/conversations/${conversationId}/favorite`, {
        method: 'POST',
        body: JSON.stringify({ favorite: isFavorite })
    })
  },

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<{ success: boolean, conversation_id: string, title: string }> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        return { 
            success: true, 
            conversation_id: conversationId, 
            title: title 
        }
    }
    return directApiCall(`agent/conversations/${conversationId}/update-title`, {
        method: 'POST',
        body: JSON.stringify({ title })
    })
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, hard: boolean = false): Promise<{ message: string, conversation_id: string }> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        return { message: "Deleted successfully", conversation_id: conversationId }
    }
    const query = hard ? '?hard=true' : ''
    return directApiCall(`agent/conversations/${conversationId}${query}`, {
        method: 'DELETE'
    })
  },

  /**
   * Stream chat response
   */
  async *chatStream(
    message: string,
    options: {
        conversationId?: string,
        projectId?: string,
        orgId?: string,
        brandId?: string,
        model?: string,
        includeWebSearch?: boolean,
        thinkingEnabled?: boolean,
        toolSelectionEnabled?: boolean,
        images?: Array<{ image_url: string; filename?: string; file_type?: string }>,
        documentIds?: string[],
        reportFromTemplate?: ReportFromTemplate,
        reportContext?: {
            report_id: string,
            report_page_number?: number,
            report_section_indexes?: number[]
        },
        fastPath?: string,
        deepAgent?: boolean,
        sqlEnabled?: boolean
    }
  ): AsyncGenerator<any, void, unknown> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        yield { type: 'chunk', content: 'This is a ' }
        await new Promise(r => setTimeout(r, 100))
        yield { type: 'chunk', content: 'mock streamed ' }
        await new Promise(r => setTimeout(r, 100))
        yield { type: 'chunk', content: 'response.' }
        return
    }

    const model = options.model || "qwen-max"

    const payload: any = {
        query: message,
        conversation_id: options.conversationId,
        project_id: options.projectId,
        org_id: options.orgId,
        brand_id: options.brandId,
        stream: true,
        model: model,
        include_web_search: options.includeWebSearch ?? true,
        thinking_enabled: options.thinkingEnabled ?? true,
        tool_selection_enabled: options.toolSelectionEnabled ?? true,
        images: options.images,
        document_ids: options.documentIds,
        report_from_template: options.reportFromTemplate,
        report_context: options.reportContext,
        fast_path: options.fastPath,
        query_database: options.sqlEnabled ?? false
    }

    // Direct backend call for better streaming performance
    const config = getKawoConfig()

    if (!config.apiUrl || !config.token || !config.orgId || !config.brandId) {
      throw new Error('KAWO credentials not configured. Please complete setup.')
    }

    // Inject org_id and brand_id if not provided in options
    const orgId = payload.org_id || config.orgId
    const brandId = payload.brand_id || config.brandId
    
    // Ensure payload has these values
    payload.org_id = orgId
    payload.brand_id = brandId

    let targetUrl = `${config.apiUrl.replace(/\/$/, '')}/agent/query`
    let finalPayload = payload
    
    // Switch to Deep Agent router if requested
    if (options.deepAgent) {
      targetUrl = `${config.apiUrl.replace(/\/$/, '')}/deep-agent/query`
      
      // Filter payload to only include DeepAgentRequest fields
      finalPayload = {
        query: message,
        conversation_id: options.conversationId,
        org_id: orgId,
        brand_id: brandId,
        project_id: options.projectId,
        model: model,
        thinking_enabled: options.thinkingEnabled ?? true,
        include_web_search: options.includeWebSearch ?? true,
        images: options.images,
        document_ids: options.documentIds,
      }
    }

    const payloadString = JSON.stringify(finalPayload)

    let response
    try {
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.token}`,
            'X-KAWO-Org-Id': config.orgId,
            'X-KAWO-Brand-Id': config.brandId,
          },
          body: payloadString,
        })
    } catch (fetchError) {
        if (process.env.NODE_ENV === 'development') console.error('[API] Fetch failed:', fetchError)
        throw new Error(`Network error: ${fetchError}`)
    }

    if (!response.ok) {
        const errorText = await response.text()
        if (process.env.NODE_ENV === 'development') console.error('[API] Response not OK:', response.status, errorText)
        throw new Error(`Chat request failed: ${response.statusText} - ${errorText}`)
    }

    if (!response.body) throw new Error("No response body")

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') return
                try {
                    const parsed = JSON.parse(data)
                    yield parsed
                } catch (e) {
                    if (process.env.NODE_ENV === 'development') console.error('Error parsing SSE data:', e)
                }
            }
        }
    }
  },

  /**
   * Stop chat stream
   */
  async stopChat(conversationId: string): Promise<void> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        return
    }
    return directApiCall(`agent/conversations/${conversationId}/stop`, {
        method: 'POST'
    })
  },

  /**
   * Generate content based on brief
   */
  async generateContent(brief: string, platform: string): Promise<string> {
    if (USE_MOCK) {
      // Import mock implementation
      const { generateContentDraft } = await import('@/lib/mock/content')
      // Construct a mock ContentBrief from the string input
      const mockBrief = {
        topic: brief,
        goal: "Generated from string input",
        keyPoints: [brief],
        tone: "Neutral",
        targetAudience: "General"
      }
      return generateContentDraft(mockBrief, platform)
    }

    // Map to backend schema (ContentGenerationRequest)
    const payload = {
      query: brief,
      network: mapPlatformToNetwork(platform),
      action: "generate",
      target_field: "content",
      original_text: "<title></title><content></content>", // Required structure
      content_type: "post", // Default
      // brand_id will be injected by the proxy if not present, or we can fetch it here if we had the user context
    }

    const response = await directApiCall<{ text: string; language: string }>('content/write', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return response.text
  },

  /**
   * Localize content for different platforms
   */
  async localizeContent(
    content: string,
    sourcePlatform: string,
    targetPlatform: string
  ): Promise<string> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return `[Localized for ${targetPlatform}]\n${content}`
    }

    return directApiCall<string>('ai/localize', {
      method: 'POST',
      body: JSON.stringify({ content, sourcePlatform, targetPlatform }),
    })
  },

  /**
   * Check content compliance
   */
  async analyzeCompliance(content: string): Promise<any[]> {
    if (USE_MOCK) {
      const { checkCompliance } = await import('@/lib/mock/content')
      return checkCompliance(content)
    }

    return directApiCall<any[]>('ai/compliance', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },

  /**
   * Get a single content item by ID (maps from /content/batches/{id})
   */
  async getContentItem(id: string): Promise<ContentItem | null> {
    if (USE_MOCK) {
      const { getContentItem } = await import('@/lib/mock/content')
      return getContentItem(id)
    }

    try {
      const response = await directApiCall<{ batch: any; posts_by_platform: Record<string, any[]> }>(`content/batches/${id}`)
      return batchToContentItem(response.batch)
    } catch {
      return null
    }
  },

  /**
   * Get list of content items with optional filters (maps from /content/batches)
   */
  async getContentItems(filters?: { platform?: string; status?: string }): Promise<ContentItem[]> {
    if (USE_MOCK) {
      const { getContentItems } = await import('@/lib/mock/content')
      return getContentItems(filters)
    }

    const response = await directApiCall<{ data: any[]; total: number }>('content/batches')
    const items = (response.data || []).map(batchToContentItem)
    if (filters?.platform) return items.filter(item => item.platform === filters.platform)
    if (filters?.status) return items.filter(item => item.status === filters.status)
    return items
  },

  /**
   * Generate follow-up message for lead
   */
  async generateFollowUp(leadId: string): Promise<string> {
    if (USE_MOCK) {
      // Mock implementation without external dependencies
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "Hi there, following up on our previous conversation. I noticed you checked out our pricing page. Do you have any questions I can answer?";
    }

    return directApiCall<string>('ai/follow-up', {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    })
  },

  /**
   * Generate analytics report
   */
  async generateReport(dateRange: any): Promise<string> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return `This week saw strong performance on Xiaohongshu (+12% engagement) driven by skincare content. Douyin showed slight decline (-3%) due to algorithm changes affecting video reach.`
    }

    return directApiCall<string>('ai/report', {
      method: 'POST',
      body: JSON.stringify({ dateRange }),
    })
  },

  /**
   * Chat with Kevin
   */
  async chat(message: string, context?: any): Promise<any> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
          message: `I'd be happy to help with "${message}". In the full version, I'll provide detailed assistance based on your data and context.`
      }
    }

    return directApiCall<any>('ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    })
  },

  /**
   * Sign presigned URL for document upload
   */
  async signDocumentUpload(filename: string, filetype: string, conversationId?: string, conversationMode?: string): Promise<{
    upload_url: string
    object_key: string
    document_id: string
  }> {
    if (conversationId) {
        return directApiCall(`conversations/${conversationId}/documents/sign`, {
          method: 'POST',
          body: JSON.stringify({ filename, filetype }),
        })
    }
    return directApiCall(`documents/sign`, {
      method: 'POST',
      body: JSON.stringify({ filename, filetype, conversation_mode: conversationMode }),
    })
  },

  /**
   * Trigger document processing after upload
   */
  async processDocument(documentId: string, conversationId?: string): Promise<{
    success: boolean
    document_id: string
    filename: string
    processing_status: string
    chunk_strategy?: string
    char_count?: number
    error?: string
  }> {
    if (conversationId) {
        return directApiCall(`conversations/${conversationId}/documents/${documentId}/process`, {
          method: 'POST',
        })
    }
    return directApiCall(`documents/${documentId}/process`, {
      method: 'POST',
    })
  },


  /**
   * List documents in a conversation
   */
  async listDocuments(conversationId: string): Promise<{
    documents: any[]
    total: number
  }> {
    return directApiCall(`conversations/${conversationId}/documents`)
  },

  /**
   * Get document details (standalone, no conversation required)
   */
  async getDocumentStandalone(documentId: string): Promise<{
    document: any
  }> {
    return directApiCall(`documents/${documentId}`)
  },

  /**
   * Get document details (requires conversation)
   */
  async getDocument(conversationId: string, documentId: string): Promise<{
    document: any
  }> {
    return directApiCall(`conversations/${conversationId}/documents/${documentId}`)
  },

  /**
   * Get fresh signed URL for a conversation document
   *
   * Useful when a document URL has expired and you need a new one,
   * or when you want a custom expiration time.
   *
   * @param conversationId Conversation ID
   * @param documentId Document ID
   * @param expiration URL expiration time in seconds (60-3600, default 300)
   * @returns Fresh presigned URL with specified expiration
   */
  async getConversationDocumentUrl(conversationId: string, documentId: string, expiration: number = 300): Promise<{
    document_id: string
    document_url: string
    expires_in: number
    oss_key: string
  }> {
    return directApiCall(`conversations/${conversationId}/documents/${documentId}/url?expiration=${expiration}`)
  },



  // =========================================================================
  // Project Management
  // =========================================================================

  /**
   * Get list of projects
   */
  async getProjects(limit = 50, offset = 0): Promise<{ projects: Project[], total: number }> {
    return directApiCall(`projects?limit=${limit}&offset=${offset}`)
  },

  /**
   * Get a single project
   */
  async getProject(projectId: string): Promise<Project> {
    return directApiCall(`projects/${projectId}`)
  },

  /**
   * Create a new project
   */
  async createProject(data: { name: string; description?: string; instructions?: string }): Promise<Project> {
    return directApiCall('projects', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Update a project
   */
  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    return directApiCall(`projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    return directApiCall(`projects/${projectId}`, {
      method: 'DELETE'
    })
  },

  // =========================================================================
  // Project Documents
  // =========================================================================

  /**
   * Sign project document upload
   */
  async signProjectDocumentUpload(projectId: string, filename: string, filetype: string): Promise<{
    upload_url: string
    object_key: string
    document_id: string
  }> {
    return directApiCall(`projects/${projectId}/documents/sign`, {
      method: 'POST',
      body: JSON.stringify({ filename, filetype })
    })
  },

  /**
   * Ingest project document
   */
  async ingestProjectDocument(projectId: string, documentId: string): Promise<{
    success: boolean
    document_id: string
    filename: string
    ingestion_status: string
    char_count: number
    token_count: number
    chunk_count: number
    document_summary?: string
    error?: string
  }> {
    return directApiCall(`projects/${projectId}/documents/${documentId}/ingest`, {
      method: 'POST'
    })
  },

  /**
   * Get project documents
   */
  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return directApiCall(`projects/${projectId}/documents`)
  },

  /**
   * Get fresh signed URL for a project document
   *
   * Useful when a document URL has expired and you need a new one,
   * or when you want a custom expiration time.
   *
   * @param projectId Project ID
   * @param documentId Document ID
   * @param expiration URL expiration time in seconds (60-3600, default 300)
   * @returns Fresh presigned URL with specified expiration
   */
  async getProjectDocumentUrl(projectId: string, documentId: string, expiration: number = 300): Promise<{
    document_id: string
    document_url: string
    expires_in: number
    oss_key: string
  }> {
    return directApiCall(`projects/${projectId}/documents/${documentId}/url?expiration=${expiration}`)
  },

  /**
   * Delete project document
   */
  async deleteProjectDocument(projectId: string, documentId: string): Promise<{ success: boolean }> {
    return directApiCall(`projects/${projectId}/documents/${documentId}`, {
      method: 'DELETE'
    })
  },

  // =========================================================================
  // Project Conversations
  // =========================================================================

  /**
   * Get project conversations
   */
  async getProjectConversations(projectId: string, limit = 20, skip = 0): Promise<{ conversations: Conversation[], total: number, limit: number, skip: number }> {
    return directApiCall(`projects/${projectId}/conversations?limit=${limit}&offset=${skip}`)
  },

  /**
   * Create project conversation
   */
  async createProjectConversation(projectId: string): Promise<{ conversation_id: string }> {
    return directApiCall(`projects/${projectId}/conversations`, {
      method: 'POST'
    })
  },

  // =========================================================================
  // Memory
  // =========================================================================

  async getGlobalMemory(): Promise<GlobalMemoryResponse> {
    return directApiCall('memory/me')
  },

  async clearGlobalMemory(): Promise<{ success: boolean; message: string }> {
    return directApiCall('memory/me', {
      method: 'DELETE'
    })
  },

  async clearGlobalMemoryCategory(category: string): Promise<{ success: boolean; message: string }> {
    return directApiCall(`memory/me/category/${category}`, {
      method: 'DELETE'
    })
  },

  async getProjectMemory(projectId: string): Promise<ProjectMemoryResponse> {
    return directApiCall(`memory/projects/${projectId}`)
  },

  async clearProjectMemory(projectId: string): Promise<{ success: boolean; message: string }> {
    return directApiCall(`memory/projects/${projectId}`, {
      method: 'DELETE'
    })
  },

  // =========================================================================
  // Canvas / Simple Agent
  // =========================================================================

  /**
   * Generate Canvas content (HTML, code, visualizations)
   * Uses the simple agent with Canvas flag for on-demand generation
   */
  async generateCanvas(
    query: string,
    options: {
      orgId?: string
      brandId?: string
    }
  ): Promise<{
    response: string
    artifacts?: Array<{
      type?: string
      artifact_type?: 'html' | 'markdown' | 'code' | 'mermaid'
      title?: string
      content: string
      data?: string
      language?: string
    }>
  }> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
      return {
        response: 'Here is your visualization:',
        artifacts: [{
          type: 'html',
          content: '<div class="p-8"><h1>Mock Dashboard</h1><p>This is a mock canvas artifact.</p></div>'
        }]
      }
    }

    const config = getKawoConfig()
    if (!config.apiUrl || !config.token || !config.orgId || !config.brandId) {
      throw new Error('KAWO credentials not configured. Please complete setup.')
    }

    const payload = {
      query,
      flag: { CANVAS: true },
      org_id: options.orgId || config.orgId,
      brand_id: options.brandId || config.brandId
    }

    return directApiCall('agent/simple/query', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  /**
   * Generate Command Center analysis
   * Uses command_center fast path for specialized workflows
   */
  /**
   * Get all skills for the current user
   */
  async getSkills(): Promise<{ skills: Skill[] }> {
    return directApiCall('agent/skills', { includeOrgBrandHeaders: false })
  },

  /**
   * Create a new skill
   */
  async createSkill(data: { name: string; description: string; content: string }): Promise<Skill> {
    return directApiCall('agent/skills', {
      method: 'POST',
      body: JSON.stringify(data),
      includeOrgBrandHeaders: false
    })
  },

  /**
   * Update a skill
   */
  async updateSkill(id: string, data: Partial<Pick<Skill, 'name' | 'description' | 'content' | 'is_enabled'>>): Promise<Skill> {
    return directApiCall(`agent/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      includeOrgBrandHeaders: false
    })
  },

  /**
   * Delete a skill
   */
  async deleteSkill(id: string): Promise<{ message: string }> {
    return directApiCall(`agent/skills/${id}`, {
      method: 'DELETE',
      includeOrgBrandHeaders: false
    })
  },

  /**
   * Generate Command Center analysis
   * Uses command_center fast path for specialized workflows
   */
  async generateCommandCenterAnalysis(
    query: string,
    options: {
      orgId?: string
      brandId?: string
    }
  ): Promise<{
    response: string
    artifacts?: any[]
  }> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
      return {
        response: 'Here is your Command Center analysis:',
        artifacts: []
      }
    }

    const config = getKawoConfig()
    if (!config.apiUrl || !config.token || !config.orgId || !config.brandId) {
      throw new Error('KAWO credentials not configured. Please complete setup.')
    }

    const payload = {
      query,
      fast_path: 'command_center',
      org_id: options.orgId || config.orgId,
      brand_id: options.brandId || config.brandId
    }

    return directApiCall('agent/query', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },
}
