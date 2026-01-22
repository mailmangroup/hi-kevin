import * as React from "react"
import { ExternalLink, BookOpen, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface HelpCenterArticle {
  type: string
  title: string
  description: string
  url: string
  metadata?: {
    full_content_length?: number
    language?: string
    [key: string]: any
  }
}

interface HelpCenterArtifactProps {
  data: HelpCenterArticle[] | { cards?: HelpCenterArticle[]; data?: HelpCenterArticle[]; [key: string]: any }
}

export function HelpCenterArtifact({ data }: HelpCenterArtifactProps) {
  let results: HelpCenterArticle[] = []
  
  const extractArticles = (obj: any): HelpCenterArticle[] => {
    if (!obj) return []
    if (Array.isArray(obj)) {
      return obj.flatMap(extractArticles)
    }
    if (typeof obj === 'object') {
      if (obj.type === "helpcenter_article") {
        return [obj]
      }
      if (obj.cards && Array.isArray(obj.cards)) {
        return obj.cards.flatMap(extractArticles)
      }
      if (obj.data) {
        return extractArticles(obj.data)
      }
      return Object.values(obj).flatMap(extractArticles)
    }
    return []
  }

  let processingData = data
  if (typeof data === 'string') {
    try {
      processingData = JSON.parse(data)
    } catch (e) {
    }
  }

  try {
    results = extractArticles(processingData)
  } catch (e) {
    console.error("Failed to extract help center articles:", e)
  }

  if (!results || !Array.isArray(results) || results.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        <p>No help center articles found.</p>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 pb-2">
        <BookOpen className="h-4 w-4 text-teal-600" />
        <span className="font-medium text-sm text-gray-700">KAWO Help Center</span>
      </div>
      <div className="space-y-2">
        {results.map((result, idx) => (
          <HelpCenterArticleCard key={result.url || `result-${idx}`} result={result} index={idx + 1} />
        ))}
      </div>
    </div>
  )
}

function HelpCenterArticleCard({ result, index }: { result: HelpCenterArticle; index: number }) {
  const title = result.title?.trim() || "Untitled Article"
  const description = result.description?.trim() || ""
  const url = result.url || ""
  const language = result.metadata?.language
  const contentLength = result.metadata?.full_content_length

  return (
    <div className="border border-gray-200 rounded overflow-hidden bg-white shadow-sm hover:shadow transition-shadow group">
      <div className="px-3 py-2 bg-teal-50/50 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-semibold flex-shrink-0">
            {index}
          </div>
          <h3 className="font-semibold text-gray-900 text-xs truncate group-hover:text-teal-700 transition-colors">
            {title}
          </h3>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[10px] text-teal-600 hover:text-teal-700 hover:underline flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="p-3 space-y-2">
        {description && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}
        
        <div className="flex items-center gap-3 pt-1">
            {url && (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-teal-600 hover:text-teal-700 hover:underline truncate max-w-[200px]"
                onClick={(e) => e.stopPropagation()}
                title={url}
            >
                Read article
            </a>
            )}
            
            {(language || contentLength) && (
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    {language && (
                        <span className="uppercase px-1.5 py-0.5 bg-gray-100 rounded">
                            {language}
                        </span>
                    )}
                    {contentLength && (
                        <span>
                            {Math.ceil(contentLength / 200)} min read
                        </span>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
