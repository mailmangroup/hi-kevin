/**
 * Shared artifact type detection utilities.
 * Used by artifact-display, artifact-panel, and artifact-snippet.
 */

// Tool names that map to specific artifact types
const BRAND_POST_TOOLS = new Set([
  'run_skill',
  'extract_post_analysis',
])

const WEB_SEARCH_TOOLS = new Set([
  'search_web',
  'web_search',
])

const HELP_CENTER_TOOLS = new Set([
  'kawo_website_search',
])

/**
 * Check if artifact data represents brand posts.
 */
export function isBrandPosts(data: any, toolName?: string): boolean {
  if (toolName && BRAND_POST_TOOLS.has(toolName)) return true
  if (!data) return false

  const check = (d: any): boolean => {
    if (Array.isArray(d) && d.length > 0 && (d[0].brandId || d[0].publishId || d[0].competitor_posts)) return true
    if (d.brand_posts && Array.isArray(d.brand_posts)) return true
    if (d.competitor_posts && Array.isArray(d.competitor_posts)) return true
    return false
  }

  if (check(data)) return true

  if (typeof data === 'string' && (data.includes('brandId') || data.includes('brand_posts') || data.includes('competitor_posts'))) {
    try {
      return check(JSON.parse(data))
    } catch {
      return false
    }
  }
  return false
}

/**
 * Check if artifact data represents web search results.
 */
export function isWebSearch(data: any, toolName?: string): boolean {
  if (toolName && WEB_SEARCH_TOOLS.has(toolName)) return true
  if (!data) return false

  const check = (d: any): boolean => {
    if (Array.isArray(d)) {
      if (d.length > 0 && d[0]?.type === 'web_search_result') return true
      if (d.length > 0 && d[0]?.cards && Array.isArray(d[0].cards)) {
        return d[0].cards.some((card: any) => card?.type === 'web_search_result')
      }
    }
    if (d.cards && Array.isArray(d.cards)) {
      return d.cards.some((card: any) => card?.type === 'web_search_result')
    }
    if (d.type === 'web_search_result') return true
    return false
  }

  if (check(data)) return true

  if (typeof data === 'string' && (data.includes('web_search_result') || data.includes('"cards"'))) {
    try {
      return check(JSON.parse(data))
    } catch {
      return false
    }
  }
  return false
}

/**
 * Check if artifact data represents help center articles.
 */
export function isHelpCenter(data: any, toolName?: string): boolean {
  if (toolName && HELP_CENTER_TOOLS.has(toolName)) return true
  if (!data) return false

  const check = (d: any): boolean => {
    // Nested sections with cards
    if (d.data && Array.isArray(d.data)) {
      const hasHelpCenterCards = d.data.some((section: any) =>
        section.cards && Array.isArray(section.cards) &&
        section.cards.some((card: any) => card.type === 'helpcenter_article')
      )
      if (hasHelpCenterCards) return true
    }
    // Direct array
    if (Array.isArray(d)) {
      if (d.length > 0 && d[0]?.type === 'helpcenter_article') return true
      if (d.length > 0 && d[0]?.cards && Array.isArray(d[0].cards)) {
        return d[0].cards.some((card: any) => card?.type === 'helpcenter_article')
      }
    }
    if (d.cards && Array.isArray(d.cards)) {
      return d.cards.some((card: any) => card?.type === 'helpcenter_article')
    }
    if (d.type === 'helpcenter_article') return true
    return false
  }

  if (check(data)) return true

  // Deep check via serialization
  try {
    if (JSON.stringify(data).includes('"type":"helpcenter_article"')) return true
  } catch { /* ignore */ }

  if (typeof data === 'string' && data.includes('helpcenter_article')) {
    try {
      return check(JSON.parse(data))
    } catch {
      return false
    }
  }
  return false
}

/**
 * Extract web search results from various data structures.
 */
export function extractWebSearchResults(data: any): any[] {
  if (!data) return []

  if (Array.isArray(data)) {
    if (data.length > 0 && data[0]?.type === 'web_search_result') return data
    if (data.length > 0 && data[0]?.cards && Array.isArray(data[0].cards)) {
      return data[0].cards.filter((card: any) => card?.type === 'web_search_result')
    }
  }

  if (data.cards && Array.isArray(data.cards)) {
    return data.cards.filter((card: any) => card?.type === 'web_search_result')
  }

  if (data.type === 'web_search_result') return [data]

  return []
}

/**
 * Safely parse artifact data that may be a JSON string.
 */
export function parseArtifactData(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
  return data
}
