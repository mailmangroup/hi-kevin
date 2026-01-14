"use client"

import * as React from "react"
import { X, Copy, Check, BarChart3, Code, Table2, FileText, ChevronDown, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useArtifact, ArtifactData } from "./artifact-context"
import { MessageContent } from "./message-content"
import { BrandPostsArtifact } from "./brand-posts-artifact"

const ARTIFACT_ICONS = {
  chart: BarChart3,
  code: Code,
  table: Table2,
  report: FileText,
  data: FileText,
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

  if (!isPanelOpen || !selectedArtifact) return null

  const Icon = ARTIFACT_ICONS[selectedArtifact.type] || FileText
  const title = selectedArtifact.title ||
    (selectedArtifact.toolName ? TOOL_DISPLAY_NAMES[selectedArtifact.toolName] : null) ||
    getDefaultTitle(selectedArtifact.type)

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border bg-white transition-all duration-300 h-full w-[600px] max-w-full"
      )}
    >
      {/* Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <ArtifactPanelContent artifact={selectedArtifact} />
        </div>
      </div>
    </div>
  )
}

function ArtifactPanelContent({ artifact }: { artifact: ArtifactData }) {
  // Check for brand posts
  const isBrandPosts = (data: any, toolName?: string) => {
    // Explicitly check for specific tools
    if (toolName === 'analyze_brand_content' || toolName === 'search_post' || toolName === 'get_brand_posts') return true

    if (!data) return false
    // Check if it's the brand posts structure
    if (Array.isArray(data) && data.length > 0 && (data[0].brandId || data[0].publishId)) return true
    if (data.brand_posts && Array.isArray(data.brand_posts)) return true
    // Check if string and looks like brand posts
    if (typeof data === 'string' && (data.includes('brandId') || data.includes('brand_posts'))) {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].brandId || parsed[0].publishId)) return true;
            if (parsed.brand_posts && Array.isArray(parsed.brand_posts)) return true;
        } catch (e) {
            return false;
        }
    }
    return false
  }

  if (isBrandPosts(artifact.data, artifact.toolName)) {
    let data = artifact.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse brand posts data", e)
        return <div className="p-4 text-red-500">Failed to parse brand posts data: {String(e)}</div>
      }
    }
    return <BrandPostsArtifact data={data} />
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
    <div className="overflow-x-auto">
      <pre className="text-sm font-mono overflow-x-auto p-4 bg-gray-900 text-gray-100 rounded-lg border border-gray-700">
        <code className="text-gray-100">{code}</code>
      </pre>
    </div>
  )
}

function TableContent({ data }: { data: any }) {
  // Check if this is brand posts data (using same logic as artifact-display.tsx)
  const isBrandPosts = (data: any) => {
    if (!data) return false
    // Check if it's the brand posts structure
    if (Array.isArray(data) && data.length > 0 && (data[0].brandId || data[0].publishId)) return true
    if (data.brand_posts && Array.isArray(data.brand_posts)) return true
    // Check if string and looks like brand posts
    if (typeof data === 'string' && (data.includes('brandId') || data.includes('brand_posts'))) {
      try {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].brandId || parsed[0].publishId)) return true
        if (parsed.brand_posts && Array.isArray(parsed.brand_posts)) return true
      } catch (e) {
        return false
      }
    }
    return false
  }

  if (isBrandPosts(data)) {
    let brandPostsData = data
    if (typeof data === 'string') {
      try {
        brandPostsData = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse brand posts data in TableContent", e)
        return <div className="p-4 text-red-500">Failed to parse brand posts data: {String(e)}</div>
      }
    }
    return <BrandPostsArtifact data={brandPostsData} />
  }

  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0])

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {formatHeader(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {headers.map((header) => (
                  <td key={header} className="px-4 py-3 text-sm text-gray-600">
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
    return (
      <div className="prose prose-sm max-w-none">
        <MessageContent content={data} />
      </div>
    )
  }

  return <DataContent data={data} />
}

function ReportContent({ data }: { data: any }) {
  if (data?.sections || data?.content) {
    return (
      <div className="space-y-6">
        {data.title && (
          <h3 className="text-lg font-semibold text-gray-800">{data.title}</h3>
        )}
        {data.content && (
          <MessageContent content={data.content} />
        )}
        {data.sections?.map((section: any, idx: number) => (
          <div key={idx} className="space-y-3">
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
    return (
      <div className="prose prose-sm max-w-none">
        <MessageContent content={data} />
      </div>
    )
  }

  return <DataContent data={data} />
}

function DataContent({ data }: { data: any }) {
  if (typeof data === "string") {
    if (data.includes("**") || data.includes("##") || data.includes("- ") || data.includes("|") || data.includes("```")) {
      return (
        <div className="prose prose-sm max-w-none">
          <MessageContent content={data} />
        </div>
      )
    }
    return <p className="text-sm text-gray-600 leading-relaxed">{data}</p>
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
    <div className="overflow-x-auto">
      <pre className="text-sm overflow-x-auto text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
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
