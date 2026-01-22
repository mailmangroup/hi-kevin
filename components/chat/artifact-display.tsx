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
      console.error("Failed to copy:", err)
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

  // Check for web search results
  const isWebSearch = (data: any, toolName?: string) => {
    // Explicitly check for specific tools
    if (toolName === 'search_web' || toolName === 'web_search') return true

    if (!data) return false
    // Check if it's the web search structure
    if (Array.isArray(data)) {
      // Check if array elements are web search results
      if (data.length > 0 && data[0]?.type === "web_search_result") return true
      // Check if array contains objects with cards property
      if (data.length > 0 && data[0]?.cards && Array.isArray(data[0].cards)) {
        return data[0].cards.some((card: any) => card?.type === "web_search_result")
      }
    }
    if (data.cards && Array.isArray(data.cards)) {
      return data.cards.some((card: any) => card?.type === "web_search_result")
    }
    if (data.type === "web_search_result") return true
    // Check if string and looks like web search
    if (typeof data === 'string' && (data.includes('web_search_result') || data.includes('"cards"'))) {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              if (parsed.length > 0 && parsed[0]?.type === "web_search_result") return true;
              if (parsed.length > 0 && parsed[0]?.cards) {
                return parsed[0].cards.some((card: any) => card?.type === "web_search_result");
              }
            }
            if (parsed.cards && Array.isArray(parsed.cards)) {
              return parsed.cards.some((card: any) => card?.type === "web_search_result");
            }
            if (parsed.type === "web_search_result") return true;
        } catch (e) {
            return false;
        }
    }
    return false
  }

  if (isBrandPosts(artifact.data, (artifact as any).toolName)) {
    let data = artifact.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse brand posts data", e)
      }
    }
    return <BrandPostsArtifact data={data} />
  }

  if (isWebSearch(artifact.data, (artifact as any).toolName)) {
    let data = artifact.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse web search data", e)
      }
    }
    return <WebSearchArtifact data={data} />
  }

  // Check for help center articles
  const isHelpCenter = (data: any, toolName?: string) => {
    // Explicitly check for specific tools
    if (toolName === 'kawo_website_search') return true

    if (!data) return false
    
    // Check for standard render data structure (nested sections)
    if (data.data && Array.isArray(data.data)) {
       // Check if any section contains helpcenter cards
       const hasHelpCenterCards = data.data.some((section: any) => 
         section.cards && Array.isArray(section.cards) && 
         section.cards.some((card: any) => card.type === "helpcenter_article")
       )
       if (hasHelpCenterCards) return true
    }

    // Check if it's the help center structure (direct array)
    if (Array.isArray(data)) {
      // Check if array elements are help center articles
      if (data.length > 0 && data[0]?.type === "helpcenter_article") return true
      // Check if array contains objects with cards property
      if (data.length > 0 && data[0]?.cards && Array.isArray(data[0].cards)) {
        return data[0].cards.some((card: any) => card?.type === "helpcenter_article")
      }
    }
    if (data.cards && Array.isArray(data.cards)) {
      return data.cards.some((card: any) => card?.type === "helpcenter_article")
    }
    if (data.type === "helpcenter_article") return true
    
    try {
        const str = JSON.stringify(data);
        if (str.includes('"type":"helpcenter_article"')) return true;
    } catch (e) {}

    // Check if string and looks like help center
    if (typeof data === 'string' && (data.includes('helpcenter_article'))) {
        try {
            const parsed = JSON.parse(data);
             if (Array.isArray(parsed)) {
              if (parsed.length > 0 && parsed[0]?.type === "helpcenter_article") return true;
              if (parsed.length > 0 && parsed[0]?.cards) {
                return parsed[0].cards.some((card: any) => card?.type === "helpcenter_article");
              }
            }
            if (parsed.cards && Array.isArray(parsed.cards)) {
              return parsed.cards.some((card: any) => card?.type === "helpcenter_article");
            }
            if (parsed.type === "helpcenter_article") return true;
        } catch (e) {
            return false;
        }
    }
    return false
  }

  if (isHelpCenter(artifact.data, (artifact as any).toolName)) {
    let data = artifact.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse help center data", e)
      }
    }
    return <HelpCenterArtifact data={data} />
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
