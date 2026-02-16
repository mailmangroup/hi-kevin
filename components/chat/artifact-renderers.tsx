"use client"

import * as React from "react"
import { BarChart3 } from "lucide-react"
import { MessageContent } from "./message-content"
import { BrandPostsArtifact } from "./brand-posts-artifact"
import { WebSearchArtifact } from "./web-search-artifact"
import { isBrandPosts, isWebSearch, parseArtifactData } from "@/lib/utils/artifact-types"

/** Rule-based detection: string looks like HTML (for fallback when artifact_type is missing). */
export function looksLikeHtml(s: string): boolean {
  if (typeof s !== "string" || !s.trim()) return false
  const trimmed = s.trim()
  if (/^\s*<!DOCTYPE\s+/i.test(trimmed)) return true
  if (/^\s*<html[\s>]/i.test(trimmed)) return true
  if (/^\s*<head[\s>]/i.test(trimmed)) return true
  if (/^\s*<body[\s>]/i.test(trimmed)) return true
  if (/^\s*<div[\s>]/i.test(trimmed) && trimmed.includes("</")) return true
  if (/^\s*<[a-z][a-z0-9]*[\s>]/i.test(trimmed) && trimmed.includes("</")) return true
  return false
}

export function ChartContent({ data }: { data: any }) {
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

export function CodeContent({ data }: { data: any }) {
  const code = typeof data === "string" ? data : data?.code || JSON.stringify(data, null, 2)

  return (
    <div className="overflow-x-auto">
      <pre className="text-sm font-mono overflow-x-auto p-4 bg-gray-900 text-gray-100 rounded-lg border border-gray-700">
        <code className="text-gray-100">{code}</code>
      </pre>
    </div>
  )
}

export function HtmlContent({ data }: { data: any }) {
  const html = typeof data === "string" ? data : data?.content ?? data?.html ?? ""
  if (!html) return <p className="text-sm text-gray-500">No HTML content</p>
  return (
    <div className="w-full min-h-[200px] rounded-lg border border-gray-200 overflow-hidden bg-white">
      <iframe
        title="HTML artifact"
        srcDoc={html}
        className="w-full min-h-[400px] border-0"
        sandbox="allow-same-origin"
      />
    </div>
  )
}

export function MarkdownContent({ data }: { data: any }) {
  const md = typeof data === "string" ? data : data?.content ?? data?.markdown ?? ""
  if (!md) return <p className="text-sm text-gray-500">No markdown content</p>
  return (
    <div className="prose prose-sm max-w-none">
      <MessageContent content={md} />
    </div>
  )
}

export function MermaidContent({ data }: { data: any }) {
  const code = typeof data === "string" ? data : data?.content ?? data?.code ?? ""
  if (!code) return <p className="text-sm text-gray-500">No diagram content</p>
  return <CodeContent data={code} />
}

export function TableContent({ data }: { data: any }) {
  if (isBrandPosts(data)) {
    return <BrandPostsArtifact data={parseArtifactData(data)} />
  }

  if (isWebSearch(data)) {
    return <WebSearchArtifact data={parseArtifactData(data)} />
  }

  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0])

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
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

  // Handle structured table data { headers: [], rows: [] }
  if (data && typeof data === 'object' && Array.isArray(data.headers) && Array.isArray(data.rows)) {
    const { headers, rows } = data
    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header: any, idx: number) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {formatCellValue(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.map((row: any[], idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {row.map((cell: any, cIdx: number) => (
                  <td key={cIdx} className="px-4 py-3 text-sm text-gray-600">
                    {formatCellValue(cell)}
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

export function DataContent({ data }: { data: any }) {
  if (typeof data === "string") {
    if (looksLikeHtml(data)) {
      return <HtmlContent data={data} />
    }
    if (data.includes("**") || data.includes("##") || data.includes("- ") || data.includes("|") || data.includes("```")) {
      return (
        <div className="prose prose-sm max-w-none">
          <MessageContent content={data} />
        </div>
      )
    }
    return <p className="text-sm text-gray-600 leading-relaxed">{data}</p>
  }

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
export function getDefaultTitle(type: string): string {
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

export function formatHeader(header: string): string {
  return header
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatCellValue(value: any): string {
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
