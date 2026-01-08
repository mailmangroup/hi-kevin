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
    throw new Error(`Mock mode: Call mock functions directly for ${endpoint}`)
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
      window.location.href = errorData.redirect
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

/**
 * AI Service
 * Handles all AI-related operations with mock implementations
 */
export const aiService = {
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
      const { generateFollowUp } = await import('@/lib/mock/leads')
      return generateFollowUp(leadId)
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
  async chat(message: string, context?: any): Promise<string> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return `I'd be happy to help with "${message}". In the full version, I'll provide detailed assistance based on your data and context.`
    }

    return apiCall<string>('ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    })
  },
}

export default apiCall
