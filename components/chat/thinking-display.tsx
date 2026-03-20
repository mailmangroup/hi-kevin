"use client"

import * as React from "react"
import { ChevronDown, Brain } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ThinkingDisplayProps {
  content: string
  isStreaming?: boolean
}

export function ThinkingDisplay({ content, isStreaming = false }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)

  if (!content) return null

  return (
    <div className="mb-4 group">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors select-none"
      >
        <div className={cn(
          "flex items-center justify-center w-4 h-4 rounded-full border border-border bg-background",
          isStreaming && "animate-pulse border-primary/50"
        )}>
          <Brain className="h-2.5 w-2.5" />
        </div>
        <span>
          Thinking Process
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isExpanded ? "transform rotate-180" : ""
          )}
        />
      </button>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
      )}>
        <div className="overflow-hidden">
          <div className="pl-2 border-l-2 border-primary/20 ml-2">
            <div className="pl-4 py-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {content}
              {isStreaming && (
                <span className="inline-block w-1.5 h-3 ml-1 align-baseline bg-primary/40 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
