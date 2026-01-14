import * as React from "react"
import { ExternalLink, Search, Globe } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface WebSearchResult {
  type: string
  title: string
  description: string
  url: string
  metadata?: {
    query?: string
    source?: string
  }
}

interface WebSearchArtifactProps {
  data: WebSearchResult[] | { cards?: WebSearchResult[]; data?: WebSearchResult[]; [key: string]: any }
}

export function WebSearchArtifact({ data }: WebSearchArtifactProps) {
  // Handle different data structures
  let results: WebSearchResult[] = []
  
  if (Array.isArray(data)) {
    // Check if array elements are web search results themselves
    if (data.length > 0 && data[0]?.type === "web_search_result") {
      results = data
    } else {
      // Array might contain objects with cards property
      for (const item of data) {
        if (item && typeof item === 'object') {
          if (Array.isArray(item.cards)) {
            results = item.cards.filter((card: any) => card?.type === "web_search_result")
            break
          } else if (Array.isArray(item.data)) {
            results = item.data.filter((card: any) => card?.type === "web_search_result")
            break
          } else if (item.type === "web_search_result") {
            // Single result in array
            results = data.filter((card: any) => card?.type === "web_search_result")
            break
          }
        }
      }
    }
  } else if (data && typeof data === 'object') {
    // Handle nested cards or data property
    if (Array.isArray(data.cards)) {
      results = data.cards.filter((card: any) => card?.type === "web_search_result")
    } else if (data.data && Array.isArray(data.data)) {
      results = data.data.filter((card: any) => card?.type === "web_search_result")
    } else if (data.type === "web_search_result") {
      // Single result object
      results = [data]
    } else {
      // Try to find any array property that might contain results
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]))
      if (arrayKeys.length > 0) {
        const firstArray = data[arrayKeys[0]]
        results = firstArray.filter((item: any) => 
          item?.type === "web_search_result" || 
          (item?.cards && Array.isArray(item.cards))
        )
        // Flatten if nested
        if (results.length > 0 && results[0]?.cards) {
          results = results.flatMap((item: any) => item.cards || [])
        }
      }
    }
  } else if (typeof data === 'string') {
    // Try to parse string data
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        // Check if parsed array elements are web search results
        if (parsed.length > 0 && parsed[0]?.type === "web_search_result") {
          results = parsed
        } else {
          // Look for cards in array elements
          for (const item of parsed) {
            if (item && typeof item === 'object') {
              if (Array.isArray(item.cards)) {
                results = item.cards.filter((card: any) => card?.type === "web_search_result")
                break
              }
            }
          }
        }
      } else if (parsed.cards && Array.isArray(parsed.cards)) {
        results = parsed.cards.filter((card: any) => card?.type === "web_search_result")
      } else if (parsed.type === "web_search_result") {
        results = [parsed]
      }
    } catch (e) {
      console.error("Failed to parse web search data:", e)
    }
  }

  if (!results || !Array.isArray(results) || results.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        <p>No web search results found.</p>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  // Extract query from first result's metadata if available
  const query = results[0]?.metadata?.query

  return (
    <div className="space-y-2">
      {query && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs">
          <Search className="h-3 w-3 text-blue-600 flex-shrink-0" />
          <span className="font-medium text-blue-900">Query:</span>
          <span className="text-blue-700 truncate">{query}</span>
        </div>
      )}
      <div className="space-y-2">
        {results.map((result, idx) => (
          <WebSearchResultCard key={result.url || `result-${idx}`} result={result} index={idx + 1} />
        ))}
      </div>
    </div>
  )
}

function WebSearchResultCard({ result, index }: { result: WebSearchResult; index: number }) {
  const title = result.title?.trim() || "Untitled Result"
  const description = result.description?.trim() || ""
  const url = result.url || ""
  
  // Extract domain from URL
  const domain = url ? new URL(url).hostname.replace('www.', '') : ''

  return (
    <div className="border border-gray-200 rounded overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
      {/* Header */}
      <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold flex-shrink-0">
            {index}
          </div>
          {domain && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Globe className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] text-gray-500 truncate max-w-[150px]" title={domain}>
                {domain}
              </span>
            </div>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-700 hover:underline flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5">
        <h3 className="font-semibold text-gray-900 text-xs leading-tight line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-600 leading-snug line-clamp-2">
            {description}
          </p>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline truncate block"
            onClick={(e) => e.stopPropagation()}
            title={url}
          >
            {url}
          </a>
        )}
        {result.metadata?.source && (
          <div className="pt-1 border-t border-gray-100">
            <span className="text-[10px] text-gray-500">
              Source: <span className="text-gray-700">{result.metadata.source}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
