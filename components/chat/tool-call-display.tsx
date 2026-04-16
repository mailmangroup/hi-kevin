"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, AlertCircle, Database } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { MessageContent } from "./message-content"
import { ArtifactSnippet } from "./artifact-snippet"

// Tool icons mapping
const TOOL_ICONS: Record<string, string> = {
  get_account_insights: "📊",
  get_content_performance: "📈",
  search_web: "🔍",
  analyze_competitors: "🎯",
  generate_content: "✍️",
  schedule_post: "📅",
  get_audience_data: "👥",
  list_available_documents: "📂",
  retrieve_document: "📄",
  extract_post_analysis: "✨",
  crawl_url: "🌐",
  python_execute: "🐍",
  execute: "💻",
  default: "⚡",
}

// Tool display names
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_account_insights: "Getting Account Insights",
  get_content_performance: "Analyzing Content Performance",
  search_web: "Searching the Web",
  analyze_competitors: "Analyzing Competitors",
  generate_content: "Generating Content",
  schedule_post: "Scheduling Post",
  get_audience_data: "Getting Audience Data",
  list_available_documents: "Checking Documents",
  retrieve_document: "Reading Document",
  extract_post_analysis: "Extracting Post Analysis",
  crawl_url: "Crawling Web Page",
  python_execute: "Running Python Code",
  execute: "Running Command",
}

export interface ToolCall {
  id: string
  name: string
  input: any
  output?: any
  artifact?: any
  state: "running" | "completed" | "failed"
  executeStatus?: "executing" | "done" | "error"
  command?: string
  exitCode?: number
  errorMessage?: string
}

interface ToolCallDisplayProps {
  tool: ToolCall
  defaultExpanded?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export function ToolCallDisplay({ tool, defaultExpanded = false, isFirst = false, isLast = false }: ToolCallDisplayProps) {
  // Use a ref to track if user has manually toggled, otherwise auto-collapse when complete
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const [userToggled, setUserToggled] = React.useState(false)
  const prevStateRef = React.useRef(tool.state)

  // Auto-collapse when tool completes (unless user has manually expanded)
  React.useEffect(() => {
    if (prevStateRef.current === "running" && tool.state === "completed" && !userToggled) {
      setIsExpanded(false)
    }
    prevStateRef.current = tool.state
  }, [tool.state, userToggled])

  const handleToggle = () => {
    setUserToggled(true)
    setIsExpanded(!isExpanded)
  }

  const icon = TOOL_ICONS[tool.name] || TOOL_ICONS.default
  const displayName = TOOL_DISPLAY_NAMES[tool.name] || formatToolName(tool.name)

  // Extract summary from tool output if it contains markdown_summary
  const outputSummary = extractSummary(tool.output)

  return (
    <div className="group relative pl-6 pb-2">
      {/* Timeline Line */}
      <div 
        className={cn(
          "absolute left-[11px] top-0 bottom-0 w-px bg-border",
          isFirst && "top-3",
          isLast && "bottom-auto h-3"
        )} 
      />
      
      {/* Header */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-3 w-full text-left group/btn"
      >
        <div className={cn(
          "absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background transition-colors shadow-sm",
          tool.state === "running" ? "border-primary text-primary" : 
          tool.state === "failed" ? "border-destructive text-destructive" : 
          "border-muted-foreground/30 text-muted-foreground group-hover/btn:border-primary/50 group-hover/btn:text-primary"
        )}>
          {tool.state === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : tool.state === "failed" ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
        </div>
        
        <div className="flex flex-1 items-center justify-between min-w-0 py-1.5 pl-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm flex-shrink-0">{icon}</span>
            <span className="text-sm font-medium text-foreground truncate">
              {displayName}
            </span>
            {tool.state === "running" && tool.name === "execute" && tool.executeStatus === "executing" && (
              <span className="text-[10px] text-blue-500 dark:text-blue-400 flex-shrink-0 animate-pulse">
                Running in sandbox...
              </span>
            )}
            <span className="text-xs text-muted-foreground hidden sm:inline-block opacity-0 group-hover/btn:opacity-100 transition-opacity truncate ml-1">
              {tool.name}
            </span>
          </div>
          <ChevronDown className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200 ml-2 flex-shrink-0",
            isExpanded ? "rotate-180" : ""
          )} />
        </div>
      </button>

      {/* Expanded Content */}
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
      )}>
        <div className="overflow-hidden pl-7 pr-2 min-w-0">
          <div className="rounded-md border border-border bg-muted/30 text-xs overflow-hidden min-w-0">
            {/* Input Section */}
            <div className="border-b border-border/50 px-3 py-2">
              <div className="font-mono text-[10px] font-medium text-muted-foreground uppercase mb-1">Input</div>
              <ToolInputDisplay input={tool.input} />
            </div>

            {/* Output Section */}
            {tool.output && (
              <div className="px-3 py-2 bg-background/50">
                <div className="font-mono text-[10px] font-medium text-muted-foreground uppercase mb-1">Output</div>
                <ToolOutputDisplay output={tool.output} />
              </div>
            )}

            {/* Artifact Section */}
            {tool.artifact && (
              <div className="border-t border-border/50 px-3 py-2 bg-background">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium text-muted-foreground uppercase mb-1">
                  <Database className="h-3 w-3" />
                  Generated Data
                </div>
                <ArtifactSnippet artifact={tool.artifact} toolName={tool.name} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Summary (when collapsed) */}
      {!isExpanded && outputSummary && (
        <div className="pl-7 mt-1 text-xs text-muted-foreground line-clamp-2">
          <MessageContent content={outputSummary} className="prose-xs" />
        </div>
      )}
      
      {/* Artifact snippet (when collapsed) */}
      {!isExpanded && tool.artifact && (
        <div className="pl-7 mt-2 pr-2">
          <ArtifactSnippet artifact={tool.artifact} toolName={tool.name} />
        </div>
      )}
    </div>
  )
}

function ToolInputDisplay({ input }: { input: any }) {
  if (!input) return <span className="text-xs text-gray-400">No input</span>

  // Handle common input patterns
  if (typeof input === "string") {
    return <span className="text-xs text-gray-600 break-all">{input}</span>
  }

  // Format structured input nicely
  const entries = Object.entries(input)
  if (entries.length === 0) {
    return <span className="text-xs text-gray-400">No input</span>
  }

  return (
    <div className="space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2 text-xs min-w-0">
          <span className="text-gray-500 font-medium min-w-[80px] flex-shrink-0">{formatKey(key)}:</span>
          <span className="text-gray-700 break-all min-w-0">{formatValue(value)}</span>
        </div>
      ))}
    </div>
  )
}

function ToolOutputDisplay({ output }: { output: any }) {
  if (!output) return <span className="text-xs text-gray-400">No output</span>

  // Handle string output
  if (typeof output === "string") {
    return <MessageContent content={output} className="prose-xs text-gray-600" />
  }

  // Handle array of items
  if (Array.isArray(output)) {
    return (
      <div className="space-y-2">
        {output.map((item, idx) => (
          <div key={idx} className="bg-gray-50 rounded p-2 text-xs">
            {typeof item === "string" ? (
              <MessageContent content={item} />
            ) : (
              <pre className="overflow-x-auto text-gray-600 max-w-full">
                {JSON.stringify(item, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Handle object with markdown_summary (like account insights)
  if (output && typeof output === "object") {
    // Check if any nested object has markdown_summary
    const summaries = extractAllSummaries(output)
    if (summaries.length > 0) {
      return (
        <div className="space-y-3">
          {summaries.map((summary, idx) => (
            <div key={idx}>
              {summary.accountName && (
                <div className="text-xs font-medium text-gray-700 mb-1">
                  {summary.accountName}
                </div>
              )}
              <MessageContent content={summary.markdown} className="prose-xs" />
            </div>
          ))}
        </div>
      )
    }

    // Fallback to JSON display
    return (
      <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto text-gray-600 max-h-[200px] max-w-full">
        {JSON.stringify(output, null, 2)}
      </pre>
    )
  }

  return (
    <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto text-gray-600 max-w-full">
      {JSON.stringify(output, null, 2)}
    </pre>
  )
}

// Helper functions
function formatToolName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(", ")
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value)
  }
  return String(value)
}

function extractSummary(output: any): string | null {
  if (!output || typeof output !== "object") return null

  // Direct markdown_summary
  if (output.markdown_summary) {
    return output.markdown_summary
  }

  // Check nested objects (e.g., output.xhs.markdown_summary)
  for (const key of Object.keys(output)) {
    if (output[key]?.markdown_summary) {
      return output[key].markdown_summary
    }
  }

  return null
}

interface Summary {
  accountName?: string
  markdown: string
}

function extractAllSummaries(output: any): Summary[] {
  const summaries: Summary[] = []

  if (!output || typeof output !== "object") return summaries

  // Check each key in the output
  for (const [network, data] of Object.entries(output)) {
    if (data && typeof data === "object" && (data as any).markdown_summary) {
      summaries.push({
        accountName: (data as any).account?.name,
        markdown: (data as any).markdown_summary,
      })
    }
  }

  return summaries
}

// Component for displaying multiple tool calls
interface ToolCallListProps {
  toolCalls: ToolCall[]
}

export function ToolCallList({ toolCalls }: ToolCallListProps) {
  if (!toolCalls || toolCalls.length === 0) return null

  return (
    <div className="mb-4 flex flex-col">
      {toolCalls.map((tool, index) => (
        <ToolCallDisplay 
          key={tool.id} 
          tool={tool} 
          isFirst={index === 0}
          isLast={index === toolCalls.length - 1}
        />
      ))}
    </div>
  )
}
