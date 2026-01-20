/**
 * API Client
 *
 * Unified API client that switches between mock and real data based on environment.
 * This allows for easy transition from demo to production.
 */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false' // Default to mock

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (USE_MOCK) {
    // Simulate network delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400))

    // In demo mode, we'll call mock functions directly from components
    // This is a placeholder for future real API calls
    // For now, if we are in mock mode but want to test backend, we can comment this out or set USE_MOCK to false
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FORCE_MOCK !== 'true') {
        // fall through to real API call if in dev and not forced mock
    } else {
        throw new Error(`Mock mode: Call mock functions directly for ${endpoint}`)
    }
  }

  // Real API call
  const response = await fetch(`/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let errorData: any = {}
    try {
      errorData = await response.json()
    } catch {
      errorData = { error: response.statusText }
    }

    // Handle specific error codes
    if (errorData.code === 'CREDENTIALS_MISSING' && errorData.redirect && typeof window !== 'undefined') {
      // Only redirect if we're not already on the target page
      if (window.location.pathname !== errorData.redirect) {
        window.location.href = errorData.redirect
      }
    }

    // Log detailed error information for debugging
    console.error('API Error:', {
      status: response.status,
      endpoint,
      errorData
    })

    const error: any = new Error(errorData.error || errorData.message || response.statusText)
    error.status = response.status
    error.code = errorData.code
    error.redirect = errorData.redirect
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
    return apiCall(`proxy/agent/conversations?limit=${limit}&skip=${skip}`)
  },

  /**
   * Get a single conversation
   */
  async getConversation(conversationId: string): Promise<Conversation> {
      if (USE_MOCK && process.env.NEXT_PUBLIC_FORCE_MOCK === 'true') {
          return { id: conversationId, title: 'Mock Conversation', updated_at: new Date().toISOString(), message_count: 5, is_favorite: false }
      }
      return apiCall(`proxy/agent/conversations/${conversationId}`)
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
      return apiCall(`proxy/agent/conversations/${conversationId}/messages?limit=${limit}&skip=${skip}`)
  },

  /**
   * Create a new conversation
   */
  async createConversation(orgId?: string, brandId?: string): Promise<{ conversation_id: string }> {
      return apiCall('proxy/agent/conversations', {
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
        }
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

    const payload: any = {
        query: message,
        conversation_id: options.conversationId,
        org_id: options.orgId,
        brand_id: options.brandId,
        stream: true,
        model: options.model || "qwen-max",
        include_web_search: options.includeWebSearch ?? true,
        thinking_enabled: options.thinkingEnabled ?? false,
        tool_selection_enabled: options.toolSelectionEnabled ?? true,
        images: options.images,
        document_ids: options.documentIds,
        report_from_template: options.reportFromTemplate,
        report_context: options.reportContext
    }

    const payloadString = JSON.stringify(payload)
    const payloadSizeKB = (payloadString.length / 1024).toFixed(2)

    console.log('[API] Sending chat query payload:', payload)
    console.log(`[API] Payload size: ${payloadSizeKB} KB`)
    console.log('[API] Initiating fetch to /api/proxy/agent/query...')

    let response
    try {
        response = await fetch('/api/proxy/agent/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payloadString
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
    return apiCall(`proxy/agent/conversations/${conversationId}/stop`, {
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

    const response = await apiCall<{ text: string; language: string }>('proxy/content/write', {
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

    return apiCall<string>('ai/localize', {
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

    return apiCall<any[]>('ai/compliance', {
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

    return apiCall<string>('ai/follow-up', {
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

    return apiCall<string>('ai/report', {
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

    return apiCall<any>('proxy/ai/chat', {
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
        return apiCall(`proxy/conversations/${conversationId}/documents/sign`, {
          method: 'POST',
          body: JSON.stringify({ filename, filetype }),
        })
    }
    return apiCall(`proxy/documents/sign`, {
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
        return apiCall(`proxy/conversations/${conversationId}/documents/${documentId}/process`, {
          method: 'POST',
        })
    }
    return apiCall(`proxy/documents/${documentId}/process`, {
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
      return apiCall(`proxy/conversations/${conversationId}/documents/attach`, {
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
    return apiCall(`proxy/conversations/${conversationId}/documents`)
  },

  /**
   * Get document details (standalone, no conversation required)
   */
  async getDocumentStandalone(documentId: string): Promise<{
    document: any
  }> {
    return apiCall(`proxy/documents/${documentId}`)
  },

  /**
   * Get document details (requires conversation)
   */
  async getDocument(conversationId: string, documentId: string): Promise<{
    document: any
  }> {
    return apiCall(`proxy/conversations/${conversationId}/documents/${documentId}`)
  },

  /**
   * Delete document
   */
  async deleteDocument(conversationId: string, documentId: string): Promise<{
    success: boolean
    document_id: string
    message: string
  }> {
    return apiCall(`proxy/conversations/${conversationId}/documents/${documentId}`, {
      method: 'DELETE',
    })
  },
}

export default apiCall
