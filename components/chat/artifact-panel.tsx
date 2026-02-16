"use client"

import * as React from "react"
import { X, Copy, Check, BarChart3, Code, Table2, FileText, ChevronDown, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useArtifact, ArtifactData } from "./artifact-context"
import { ReportOutlineSidebar } from "./report-outline-sidebar"
import { isBrandPosts, isWebSearch, isHelpCenter, parseArtifactData } from "@/lib/utils/artifact-types"
import { BrandPostsArtifact } from "./brand-posts-artifact"
import { WebSearchArtifact } from "./web-search-artifact"
import { HelpCenterArtifact } from "./help-center-artifact"
import { ReportContent } from "./report-content"
import {
  looksLikeHtml,
  ChartContent,
  CodeContent,
  HtmlContent,
  MarkdownContent,
  MermaidContent,
  TableContent,
  DataContent,
  getDefaultTitle,
} from "./artifact-renderers"

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

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_account_insights: "Account Insights",
  get_content_performance: "Content Performance",
  search_web: "Web Search Results",
  web_search: "Web Search Results",
  analyze_competitors: "Competitor Analysis",
  generate_content: "Generated Content",
  schedule_post: "Scheduled Post",
  get_audience_data: "Audience Data",
}

export function ArtifactPanel() {
  const { selectedArtifact, isPanelOpen, closePanel } = useArtifact()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!selectedArtifact) return
    try {
      const content = typeof selectedArtifact.data === "string"
        ? selectedArtifact.data
        : JSON.stringify(selectedArtifact.data, null, 2)
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error("Failed to copy:", err)
    }
  }

  if (!isPanelOpen || !selectedArtifact) return null

  const Icon = ARTIFACT_ICONS[selectedArtifact.type] || FileText
  const title = selectedArtifact.title ||
    (selectedArtifact.toolName ? TOOL_DISPLAY_NAMES[selectedArtifact.toolName] : null) ||
    getDefaultTitle(selectedArtifact.type)

  const isReportType = selectedArtifact?.type === 'report' && selectedArtifact?.data?.pages

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border bg-white transition-all duration-300 h-full max-w-full",
        isReportType ? "flex-1" : "w-[600px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <span className="font-medium text-sm text-gray-900 flex-shrink-0">{title}</span>
          {(selectedArtifact.toolName || selectedArtifact.session) && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedArtifact.toolName && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">
                  {selectedArtifact.toolName}
                </span>
              )}
              {selectedArtifact.session?.date_start && selectedArtifact.session?.date_end && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">
                  {selectedArtifact.session.date_start} - {selectedArtifact.session.date_end}
                </span>
              )}
              {selectedArtifact.session?.networks && selectedArtifact.session.networks.length > 0 && (
                selectedArtifact.session.networks.map((network, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200"
                  >
                    {network}
                  </span>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Copy content"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-gray-600" />
            )}
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="More options"
          >
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={closePanel}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content Panel */}
      <div className="flex-1 flex overflow-hidden">
        {isReportType && <ReportOutlineSidebar report={selectedArtifact.data} />}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className={cn("min-h-full", isReportType ? "p-8 max-w-5xl mx-auto" : "p-6")}>
            <ArtifactPanelContent artifact={selectedArtifact} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ArtifactPanelContent({ artifact }: { artifact: ArtifactData }) {
  if (isBrandPosts(artifact.data, artifact.toolName)) {
    return <BrandPostsArtifact data={parseArtifactData(artifact.data)} />
  }

  if (isWebSearch(artifact.data, artifact.toolName)) {
    return <WebSearchArtifact data={parseArtifactData(artifact.data)} />
  }

  if (isHelpCenter(artifact.data, artifact.toolName)) {
    return <HelpCenterArtifact data={parseArtifactData(artifact.data)} />
  }

  const rawData = artifact.data
  if (typeof rawData === "string" && looksLikeHtml(rawData) && artifact.type !== "code" && artifact.type !== "markdown") {
    return <HtmlContent data={rawData} />
  }

  switch (artifact.type) {
    case "chart":
      return <ChartContent data={artifact.data} />
    case "code":
      return <CodeContent data={artifact.data} />
    case "table":
      return <TableContent data={artifact.data} />
    case "report":
      return <ReportContent data={artifact.data} />
    case "html":
      return <HtmlContent data={artifact.data} />
    case "markdown":
      return <MarkdownContent data={artifact.data} />
    case "mermaid":
      return <MermaidContent data={artifact.data} />
    default:
      return <DataContent data={artifact.data} />
  }
}
