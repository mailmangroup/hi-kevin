"use client"

import * as React from "react"
import { cn } from "@/lib/utils/cn"
import {
  BarChart3,
  Code,
  Table2,
  FileText,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { MessageContent } from "./message-content"
import { BrandPostsArtifact } from "./brand-posts-artifact"
import { WebSearchArtifact } from "./web-search-artifact"
import { HelpCenterArtifact } from "./help-center-artifact"
import { isBrandPosts, isWebSearch, isHelpCenter, parseArtifactData } from "@/lib/utils/artifact-types"

export interface Artifact {
  type: "chart" | "code" | "table" | "report" | "data"
  title?: string
  data: any
}

interface ArtifactDisplayProps {
  artifact: Artifact
  className?: string
}

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

export function ArtifactDisplay({ artifact, className }: ArtifactDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  const Icon = ARTIFACT_ICONS[artifact.type] || FileText
  const colorClasses = ARTIFACT_COLORS[artifact.type] || ARTIFACT_COLORS.data
  const title = artifact.title || getDefaultTitle(artifact.type)

  const handleCopy = async () => {
    try {
      const content = typeof artifact.data === "string"
        ? artifact.data
        : JSON.stringify(artifact.data, null, 2)
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error("Failed to copy:", err)
    }
  }

  return (
    <div className={cn("mt-3 rounded-lg border overflow-hidden", colorClasses, className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-inherit bg-inherit">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-medium hover:opacity-80 transition-opacity"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <Icon className="h-4 w-4" />
          <span className="uppercase tracking-wide">{title}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/50 transition-colors"
            title="Copy content"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 bg-white">
          <ArtifactContent artifact={artifact} />
        </div>
      )}
    </div>
  )
}

function ArtifactContent({ artifact }: { artifact: Artifact }) {
  const toolName = (artifact as any).toolName

  if (isBrandPosts(artifact.data, toolName)) {
    return <BrandPostsArtifact data={parseArtifactData(artifact.data)} />
  }

  if (isWebSearch(artifact.data, toolName)) {
    return <WebSearchArtifact data={parseArtifactData(artifact.data)} />
  }

  if (isHelpCenter(artifact.data, toolName)) {
    return <HelpCenterArtifact data={parseArtifactData(artifact.data)} />
  }

  switch (artifact.type) {
    case "chart":
      return <ChartArtifact data={artifact.data} />
    case "code":
      return <CodeArtifact data={artifact.data} />
    case "table":
      return <TableArtifact data={artifact.data} />
    case "report":
      return <ReportArtifact data={artifact.data} />
    default:
      return <DataArtifact data={artifact.data} />
  }
}

function ChartArtifact({ data }: { data: any }) {
  // If it's chart config data, show a placeholder or description
  if (data?.chartType || data?.config) {
    return (
      <div className="text-center py-6">
        <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          {data.title || "Chart visualization"}
        </p>
        {data.description && (
          <p className="text-xs text-gray-400 mt-1">{data.description}</p>
        )}
      </div>
    )
  }

  // Fallback to JSON display
  return <DataArtifact data={data} />
}

function CodeArtifact({ data }: { data: any }) {
  const code = typeof data === "string" ? data : data?.code || JSON.stringify(data, null, 2)
  const language = data?.language || "text"

  return (
    <pre className="text-xs font-mono overflow-x-auto p-3 bg-gray-900 text-gray-100 rounded">
      <code>{code}</code>
    </pre>
  )
}

function TableArtifact({ data }: { data: any }) {
  // Handle array of objects
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0])

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 text-left font-semibold text-gray-700">
                  {formatHeader(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                {headers.map((header) => (
                  <td key={header} className="px-3 py-2 text-gray-600">
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

  // Handle markdown table in data
  if (typeof data === "string" && data.includes("|")) {
    return <MessageContent content={data} />
  }

  // Fallback
  return <DataArtifact data={data} />
}

function ReportArtifact({ data }: { data: any }) {
  // Handle report with sections
  if (data?.sections || data?.content) {
    return (
      <div className="space-y-4">
        {data.title && (
          <h3 className="text-sm font-semibold text-gray-800">{data.title}</h3>
        )}
        {data.content && (
          <MessageContent content={data.content} />
        )}
        {data.sections?.map((section: any, idx: number) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <h4 className="text-xs font-semibold text-gray-700">{section.title}</h4>
            )}
            <MessageContent content={section.content} className="text-gray-600" />
          </div>
        ))}
      </div>
    )
  }

  // Handle string content
  if (typeof data === "string") {
    return <MessageContent content={data} />
  }

  // Fallback
  return <DataArtifact data={data} />
}

function DataArtifact({ data }: { data: any }) {
  if (typeof data === "string") {
    // Check if it looks like markdown
    if (data.includes("**") || data.includes("##") || data.includes("- ") || data.includes("|")) {
      return <MessageContent content={data} />
    }
    return <p className="text-sm text-gray-600">{data}</p>
  }

  return (
    <pre className="text-xs overflow-x-auto text-gray-600 max-h-[300px] overflow-y-auto">
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
