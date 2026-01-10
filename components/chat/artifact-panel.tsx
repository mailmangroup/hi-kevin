"use client"

import * as React from "react"
import { X, Download, Copy, Check, BarChart3, Code, Table2, FileText, ExternalLink, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useArtifact, ArtifactData } from "./artifact-context"
import { MessageContent } from "./message-content"

const ARTIFACT_ICONS = {
  chart: BarChart3,
  code: Code,
  table: Table2,
  report: FileText,
  data: FileText,
}

const ARTIFACT_COLORS = {
  chart: "text-blue-600 bg-blue-50 border-blue-200",
  code: "text-purple-600 bg-purple-50 border-purple-200",
  table: "text-green-600 bg-green-50 border-green-200",
  report: "text-orange-600 bg-orange-50 border-orange-200",
  data: "text-gray-600 bg-gray-50 border-gray-200",
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_account_insights: "Account Insights",
  get_content_performance: "Content Performance",
  search_web: "Web Search Results",
  analyze_competitors: "Competitor Analysis",
  generate_content: "Generated Content",
  schedule_post: "Scheduled Post",
  get_audience_data: "Audience Data",
}

export function ArtifactPanel() {
  const { selectedArtifact, isPanelOpen, closePanel } = useArtifact()
  const [copied, setCopied] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)

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
      console.error("Failed to copy:", err)
    }
  }

  const handleDownload = () => {
    if (!selectedArtifact) return
    const content = typeof selectedArtifact.data === "string"
      ? selectedArtifact.data
      : JSON.stringify(selectedArtifact.data, null, 2)
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedArtifact.title || "artifact"}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isPanelOpen || !selectedArtifact) return null

  const Icon = ARTIFACT_ICONS[selectedArtifact.type] || FileText
  const colorClasses = ARTIFACT_COLORS[selectedArtifact.type] || ARTIFACT_COLORS.data
  const title = selectedArtifact.title ||
    (selectedArtifact.toolName ? TOOL_DISPLAY_NAMES[selectedArtifact.toolName] : null) ||
    getDefaultTitle(selectedArtifact.type)

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border bg-white transition-all duration-300",
        isExpanded ? "w-[50%]" : "w-[400px]"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", colorClasses)}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-white/50 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/50 transition-colors"
            title="Copy content"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-white/50 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={closePanel}
            className="p-1.5 rounded hover:bg-white/50 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Session Info */}
      {selectedArtifact.session && (
        <div className="px-4 py-2 border-b border-border bg-gray-50">
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            {selectedArtifact.session.action && (
              <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                {selectedArtifact.session.action}
              </span>
            )}
            {selectedArtifact.session.date_start && selectedArtifact.session.date_end && (
              <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                {selectedArtifact.session.date_start} - {selectedArtifact.session.date_end}
              </span>
            )}
            {selectedArtifact.session.networks && selectedArtifact.session.networks.length > 0 && (
              <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                {selectedArtifact.session.networks.join(", ")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ArtifactPanelContent artifact={selectedArtifact} />
      </div>
    </div>
  )
}

function ArtifactPanelContent({ artifact }: { artifact: ArtifactData }) {
  switch (artifact.type) {
    case "chart":
      return <ChartContent data={artifact.data} />
    case "code":
      return <CodeContent data={artifact.data} />
    case "table":
      return <TableContent data={artifact.data} />
    case "report":
      return <ReportContent data={artifact.data} />
    default:
      return <DataContent data={artifact.data} />
  }
}

function ChartContent({ data }: { data: any }) {
  if (data?.chartType || data?.config) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          {data.title || "Chart visualization"}
        </p>
        {data.description && (
          <p className="text-xs text-gray-400 mt-2">{data.description}</p>
        )}
      </div>
    )
  }
  return <DataContent data={data} />
}

function CodeContent({ data }: { data: any }) {
  const code = typeof data === "string" ? data : data?.code || JSON.stringify(data, null, 2)

  return (
    <pre className="text-sm font-mono overflow-x-auto p-4 bg-gray-900 text-gray-100 rounded-lg">
      <code>{code}</code>
    </pre>
  )
}

function TableContent({ data }: { data: any }) {
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0])

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {headers.map((header) => (
                <th key={header} className="px-4 py-2 text-left font-semibold text-gray-700">
                  {formatHeader(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                {headers.map((header) => (
                  <td key={header} className="px-4 py-2 text-gray-600">
                    {formatCellValue(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (typeof data === "string" && data.includes("|")) {
    return <MessageContent content={data} />
  }

  return <DataContent data={data} />
}

function ReportContent({ data }: { data: any }) {
  if (data?.sections || data?.content) {
    return (
      <div className="space-y-4">
        {data.title && (
          <h3 className="text-lg font-semibold text-gray-800">{data.title}</h3>
        )}
        {data.content && (
          <MessageContent content={data.content} />
        )}
        {data.sections?.map((section: any, idx: number) => (
          <div key={idx} className="space-y-2">
            {section.title && (
              <h4 className="text-sm font-semibold text-gray-700">{section.title}</h4>
            )}
            <MessageContent content={section.content} className="text-gray-600" />
          </div>
        ))}
      </div>
    )
  }

  if (typeof data === "string") {
    return <MessageContent content={data} />
  }

  return <DataContent data={data} />
}

function DataContent({ data }: { data: any }) {
  if (typeof data === "string") {
    if (data.includes("**") || data.includes("##") || data.includes("- ") || data.includes("|")) {
      return <MessageContent content={data} />
    }
    return <p className="text-sm text-gray-600">{data}</p>
  }

  // Check for markdown_summary in nested objects
  const summaries = extractAllSummaries(data)
  if (summaries.length > 0) {
    return (
      <div className="space-y-4">
        {summaries.map((summary, idx) => (
          <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
            {summary.accountName && (
              <div className="text-sm font-medium text-gray-700 mb-2">
                {summary.accountName}
              </div>
            )}
            <MessageContent content={summary.markdown} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <pre className="text-sm overflow-x-auto text-gray-600 bg-gray-50 p-4 rounded-lg">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

// Helper functions
function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    chart: "Chart",
    code: "Code",
    table: "Table",
    report: "Report",
    data: "Data",
  }
  return titles[type] || "Artifact"
}

function formatHeader(header: string): string {
  return header
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

interface Summary {
  accountName?: string
  markdown: string
}

function extractAllSummaries(output: any): Summary[] {
  const summaries: Summary[] = []
  if (!output || typeof output !== "object") return summaries

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
