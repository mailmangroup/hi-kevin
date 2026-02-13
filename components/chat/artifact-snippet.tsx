"use client"

import * as React from "react"
import { BarChart3, Code, Table2, FileText, ExternalLink, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useArtifact, ArtifactData } from "./artifact-context"

const ARTIFACT_ICONS = {
  chart: BarChart3,
  code: Code,
  table: Table2,
  report: FileText,
  data: FileText,
  html: FileText,
  markdown: FileText,
  mermaid: Code,
}

const ARTIFACT_COLORS = {
  chart: {
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-200 hover:border-blue-300",
    icon: "text-blue-600",
    text: "text-blue-900",
    subtext: "text-blue-600",
  },
  code: {
    bg: "bg-purple-50 hover:bg-purple-100",
    border: "border-purple-200 hover:border-purple-300",
    icon: "text-purple-600",
    text: "text-purple-900",
    subtext: "text-purple-600",
  },
  table: {
    bg: "bg-green-50 hover:bg-green-100",
    border: "border-green-200 hover:border-green-300",
    icon: "text-green-600",
    text: "text-green-900",
    subtext: "text-green-600",
  },
  report: {
    bg: "bg-orange-50 hover:bg-orange-100",
    border: "border-orange-200 hover:border-orange-300",
    icon: "text-orange-600",
    text: "text-orange-900",
    subtext: "text-orange-600",
  },
  data: {
    bg: "bg-gray-50 hover:bg-gray-100",
    border: "border-gray-200 hover:border-gray-300",
    icon: "text-gray-600",
    text: "text-gray-900",
    subtext: "text-gray-600",
  },
  html: {
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-200 hover:border-amber-300",
    icon: "text-amber-600",
    text: "text-amber-900",
    subtext: "text-amber-600",
  },
  markdown: {
    bg: "bg-slate-50 hover:bg-slate-100",
    border: "border-slate-200 hover:border-slate-300",
    icon: "text-slate-600",
    text: "text-slate-900",
    subtext: "text-slate-600",
  },
  mermaid: {
    bg: "bg-cyan-50 hover:bg-cyan-100",
    border: "border-cyan-200 hover:border-cyan-300",
    icon: "text-cyan-600",
    text: "text-cyan-900",
    subtext: "text-cyan-600",
  },
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_account_insights: "Account Insights",
  get_content_performance: "Content Performance",
  search_web: "Web Search Results",
  web_search: "Web Search Results",
  analyze_competitors: "Competitor Analysis",
  generate_content: "Generated Content",
  generate_artifact: "Generated Artifact",
  schedule_post: "Scheduled Post",
  get_audience_data: "Audience Data",
}

interface ArtifactSnippetProps {
  artifact: any
  toolName?: string
  className?: string
}

export function ArtifactSnippet({ artifact, toolName, className }: ArtifactSnippetProps) {
  const { openArtifact, selectedArtifact, isPanelOpen } = useArtifact()

  // Determine artifact type from the artifact data or tool name
  const artifactType = determineArtifactType(artifact, toolName)
  const colors = ARTIFACT_COLORS[artifactType] || ARTIFACT_COLORS.data
  const Icon = ARTIFACT_ICONS[artifactType] || FileText

  // Generate a unique ID for this artifact
  const artifactId = React.useMemo(() => {
    return `${toolName || "artifact"}-${JSON.stringify(artifact).slice(0, 50)}`
  }, [artifact, toolName])

  // Normalize data: backend sends content, frontend often uses data
  const artifactData = artifact?.data ?? artifact?.content ?? artifact

  // Extract title and description
  const title = artifact?.title ||
    (toolName ? TOOL_DISPLAY_NAMES[toolName] : null) ||
    getDefaultTitle(artifactType)

  const description = getArtifactDescription(artifact, toolName)

  // Check if this artifact is currently selected
  const isSelected = isPanelOpen && selectedArtifact?.id === artifactId

  const handleClick = () => {
    openArtifact({
      id: artifactId,
      type: artifactType,
      title,
      data: artifactData,
      toolName,
      session: artifact.session,
    })
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left group glass-premium shadow-[0_4px_16px_rgba(30,58,138,0.06)] hover:shadow-[0_8px_24px_rgba(30,58,138,0.12)] relative overflow-hidden",
        isSelected && "ring-2 ring-primary ring-offset-1",
        className
      )}
    >
      {/* Light Leak */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-[inherit] pointer-events-none z-0">
         <div className="absolute -top-10 -left-10 w-24 h-24 bg-purple-500/10 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Icon */}
      <div className={cn("flex-shrink-0 p-2 rounded-lg bg-white/80 shadow-sm relative z-10", colors.icon)}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="text-sm font-semibold text-foreground truncate">
          {title}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {description}
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 relative z-10">
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  )
}

// Helper to determine artifact type from data or tool name
function determineArtifactType(artifact: any, toolName?: string): "chart" | "code" | "table" | "report" | "data" | "html" | "markdown" | "mermaid" {
  // Backend create_artifact sends { type: "artifact", artifact_type: "html"|"markdown"|"code"|"mermaid" }
  if (artifact?.type === "artifact" && artifact?.artifact_type) {
    return artifact.artifact_type
  }
  if (artifact?.type && artifact.type !== "artifact") {
    return artifact.type
  }

  // Infer from tool name
  if (toolName) {
    if (toolName.includes("chart") || toolName.includes("analytics")) {
      return "chart"
    }
    if (toolName.includes("code") || toolName.includes("generate")) {
      return "code"
    }
    if (toolName.includes("table") || toolName.includes("data")) {
      return "table"
    }
    if (toolName.includes("report") || toolName.includes("insights") || toolName.includes("performance")) {
      return "report"
    }
  }

  // Infer from data structure
  if (artifact?.data) {
    if (Array.isArray(artifact.data)) {
      return "table"
    }
    if (typeof artifact.data === "string" && artifact.data.includes("```")) {
      return "code"
    }
  }

  return "data"
}

function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    chart: "Chart",
    code: "Code",
    table: "Table",
    report: "Report",
    data: "Data",
    html: "HTML",
    markdown: "Markdown",
    mermaid: "Diagram",
  }
  return titles[type] || "Artifact"
}

function getArtifactDescription(artifact: any, toolName?: string): string | null {
  // Check session info
  if (artifact?.session) {
    const parts: string[] = []
    if (artifact.session.networks?.length) {
      parts.push(artifact.session.networks.join(", "))
    }
    if (artifact.session.date_start && artifact.session.date_end) {
      parts.push(`${artifact.session.date_start} - ${artifact.session.date_end}`)
    }
    if (parts.length > 0) {
      return parts.join(" | ")
    }
  }

  // Handle web search results
  const data = artifact?.data || artifact
  if (toolName === 'search_web' || toolName === 'web_search' || isWebSearchData(data)) {
    const results = extractWebSearchResults(data)
    if (results.length > 0) {
      const query = results[0]?.metadata?.query
      return query ? `${results.length} results for "${query}"` : `${results.length} search results`
    }
  }

  // Check data size for arrays
  if (data && Array.isArray(data)) {
    return `${data.length} items`
  }

  // Check for summary
  if (data && typeof data === "object") {
    // Handle report type specifically
    const isReport = toolName === 'report' || data.type === 'report' || data.title === 'Brand Report'
    if (isReport) {
        return "Click to view report"
    }

    const keys = Object.keys(data)
    if (keys.length <= 3) {
      return keys.join(", ")
    }
    return `${keys.length} properties`
  }

  return "Click to view details"
}

// Helper to check if data is web search results
function isWebSearchData(data: any): boolean {
  if (!data) return false
  if (Array.isArray(data)) {
    if (data.length > 0 && data[0]?.type === "web_search_result") return true
    if (data.length > 0 && data[0]?.cards && Array.isArray(data[0].cards)) {
      return data[0].cards.some((card: any) => card?.type === "web_search_result")
    }
  }
  if (data.cards && Array.isArray(data.cards)) {
    return data.cards.some((card: any) => card?.type === "web_search_result")
  }
  if (data.type === "web_search_result") return true
  return false
}

// Helper to extract web search results from various data structures
function extractWebSearchResults(data: any): any[] {
  if (!data) return []
  
  if (Array.isArray(data)) {
    if (data.length > 0 && data[0]?.type === "web_search_result") {
      return data
    }
    if (data.length > 0 && data[0]?.cards && Array.isArray(data[0].cards)) {
      return data[0].cards.filter((card: any) => card?.type === "web_search_result")
    }
  }
  
  if (data.cards && Array.isArray(data.cards)) {
    return data.cards.filter((card: any) => card?.type === "web_search_result")
  }
  
  if (data.type === "web_search_result") {
    return [data]
  }
  
  return []
}
