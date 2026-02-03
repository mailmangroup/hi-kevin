"use client"

import * as React from "react"
import { ChevronDown, Brain } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ThinkingDisplayProps {
  content: string
  isStreaming?: boolean
}

export function ThinkingDisplay({ content, isStreaming = false }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  if (!content) return null

  return (
    <div className="mb-3 rounded-lg border border-purple-200 bg-purple-50/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-100/50 transition-colors"
      >
        <Brain className="h-4 w-4 text-purple-600 flex-shrink-0" />
        <span className="text-xs font-medium text-purple-700 flex-1">
          Thinking{isStreaming ? "..." : ""}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-purple-600 transition-transform flex-shrink-0",
            isExpanded ? "transform rotate-180" : ""
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-purple-100 relative z-10">
          <div className="text-xs text-purple-900/80 whitespace-pre-wrap leading-relaxed">
            {content}
            {isStreaming && (
              <span className="inline-flex ml-1">
                <span className="animate-pulse">▊</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
