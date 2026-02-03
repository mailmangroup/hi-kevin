/**
 * API Client
 *
 * Unified API client that switches between mock and real data based on environment.
 * This allows for easy transition from demo to production.
 */

import { useUserStore } from '@/lib/store/user-store'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false' // Default to mock

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
  const apiUrl = process.env.NEXT_PUBLIC_KAWO_API_URL

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
    apiUrl: profile?.kawo_api_url,
  }
}

/**
 * Direct API call to KAWO backend.
 * Always calls the backend directly with auth headers.
 */
export async function directApiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const config = getKawoConfig()

  if (!config.apiUrl || !config.token || !config.orgId || !config.brandId) {
    throw new Error('KAWO credentials not configured. Please complete setup.')
  }

  const targetUrl = `${config.apiUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
  console.log('[API] Direct call:', targetUrl, 'Config:', {
    apiUrl: config.apiUrl,
    token: config.token ? '***' : 'missing',
    orgId: config.orgId,
    brandId: config.brandId
  })

  // Ensure headers are properly set
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${config.token}`)
  headers.set('X-KAWO-Org-Id', config.orgId)
  headers.set('X-KAWO-Brand-Id', config.brandId)

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData: any = {}
    try {
      errorData = await response.json()
    } catch (e) {
      // If parsing JSON fails, try text
      try {
        const text = await response.text()
        errorData = { error: response.statusText, text }
      } catch (e2) {
        errorData = { error: response.statusText }
      }
    }

    console.error('[API] Error:', {
      status: response.status,
      endpoint,
      errorData: JSON.stringify(errorData, null, 2)
    })

    const error: any = new Error(errorData.error || errorData.message || response.statusText)
    error.status = response.status
    error.code = errorData.code
    error.details = errorData
    throw error
  }

  return response.json()
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
  async getConversations(limit = 20, skip = 0): Promise<{ conversations: Conversation[], total: number }> {
    if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
        return {
            conversations: [
                { id: '1', title: 'Content Strategy Q1', updated_at: new Date().toISOString(), message_count: 5, is_favorite: false },
                { id: '2', title: 'Lead Scoring Analysis', updated_at: new Date(Date.now() - 86400000).toISOString(), message_count: 3, is_favorite: true },
            ],
            total: 2
        }
    }
    return directApiCall(`agent/conversations?limit=${limit}&skip=${skip}`)
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
   * Create a new conversation
   */
  async createConversation(orgId?: string, brandId?: string): Promise<{ conversation_id: string }> {
      return directApiCall('agent/conversations', {
          method: 'POST',
          body: JSON.stringify({ org_id: orgId, brand_id: brandId })
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
        images?: string[],
        documentIds?: string[],
        reportFromTemplate?: ReportFromTemplate,
        reportContext?: {
            report_id: string,
            report_page_number?: number,
            report_section_indexes?: number[]
        },
        fastPath?: string
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

    // Dynamic model selection based on images
    let model = options.model || "qwen-max"
    if (options.images && options.images.length > 0) {
        if (model === 'qwen-max') {
            model = 'qwen-vl-max'
        } else if (model === 'qwen-plus') {
            model = 'qwen3-vl-plus'
        }
    }

    const payload: any = {
        query: message,
        conversation_id: options.conversationId,
        project_id: options.projectId,
        org_id: options.orgId,
        brand_id: options.brandId,
        stream: true,
        model: model,
        include_web_search: options.includeWebSearch ?? true,
        thinking_enabled: options.thinkingEnabled ?? false,
        tool_selection_enabled: options.toolSelectionEnabled ?? true,
        images: options.images,
        document_ids: options.documentIds,
        report_from_template: options.reportFromTemplate,
        report_context: options.reportContext,
        fast_path: options.fastPath
    }

    const payloadString = JSON.stringify(payload)
    const payloadSizeKB = (payloadString.length / 1024).toFixed(2)

    console.log('[API] Sending chat query payload:', payload)
    console.log(`[API] Payload size: ${payloadSizeKB} KB`)

    // Direct backend call for better streaming performance
    const config = getKawoConfig()

    if (!config.apiUrl || !config.token || !config.orgId || !config.brandId) {
      throw new Error('KAWO credentials not configured. Please complete setup.')
    }

    // Inject org_id and brand_id if not provided in options
    if (!payload.org_id) payload.org_id = config.orgId
    if (!payload.brand_id) payload.brand_id = config.brandId

    const targetUrl = `${config.apiUrl.replace(/\/$/, '')}/agent/query`
    console.log('[API] Direct backend call:', targetUrl)

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
        console.log('[API] Fetch completed, status:', response.status)
    } catch (fetchError) {
        console.error('[API] Fetch failed:', fetchError)
        throw new Error(`Network error: ${fetchError}`)
    }

    if (!response.ok) {
        const errorText = await response.text()
        console.error('[API] Response not OK:', response.status, errorText)
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
                    console.error('Error parsing SSE data:', e)
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
  async signDocumentUpload(filename: string, filetype: string, conversationId?: string): Promise<{
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
      body: JSON.stringify({ filename, filetype }),
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
   * Attach documents to a conversation
   */
  async attachDocuments(conversationId: string, documentIds: string[]): Promise<{
      success: boolean,
      attached_count: number
  }> {
      return directApiCall(`conversations/${conversationId}/documents/attach`, {
          method: 'POST',
          body: JSON.stringify({ document_ids: documentIds })
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

  async getProjectMemory(projectId: string): Promise<ProjectMemoryResponse> {
    return directApiCall(`memory/projects/${projectId}`)
  },

  async clearProjectMemory(projectId: string): Promise<{ success: boolean; message: string }> {
    return directApiCall(`memory/projects/${projectId}`, {
      method: 'DELETE'
    })
  },
}
