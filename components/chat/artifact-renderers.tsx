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
        <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.title || "Chart visualization"}
        </p>
        {data.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{data.description}</p>
        )}
      </div>
    )
  }
  return <DataContent data={data} />
}

export function CodeContent({ data }: { data: any }) {
  const code = typeof data === "string" ? data : data?.content ?? data?.code ?? JSON.stringify(data, null, 2)
  const language = typeof data === "object" ? (data?.language || "") : ""

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700 overflow-hidden">
      {language && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">{language}</span>
        </div>
      )}
      <pre className="text-sm font-mono overflow-x-auto p-4 bg-gray-900 text-gray-100 m-0">
        <code className="text-gray-100">{code}</code>
      </pre>
    </div>
  )
}

export function HtmlContent({ data }: { data: any }) {
  const html = typeof data === "string" ? data : data?.content ?? data?.html ?? ""
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = React.useState(500)

  const handleLoad = React.useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    // Give the document a moment to finish rendering before measuring
    requestAnimationFrame(() => {
      if (!iframe.contentDocument?.body) return
      const h = iframe.contentDocument.documentElement.scrollHeight || iframe.contentDocument.body.scrollHeight
      setIframeHeight(Math.max(400, h + 24))
    })
  }, [])

  if (!html) return <p className="text-sm text-gray-500">No HTML content</p>
  return (
    <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      <iframe
        ref={iframeRef}
        title="HTML artifact"
        srcDoc={html}
        style={{ height: iframeHeight }}
        className="w-full border-0 block"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        onLoad={handleLoad}
      />
    </div>
  )
}

export function MarkdownContent({ data }: { data: any }) {
  const md = typeof data === "string" ? data : data?.content ?? data?.markdown ?? ""
  if (!md) return <p className="text-sm text-gray-500">No markdown content</p>
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400">
      <MessageContent content={md} />
    </div>
  )
}

export function MermaidContent({ data }: { data: any }) {
  const code = typeof data === "string" ? data : data?.content ?? data?.code ?? ""
  const [svg, setSvg] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const idRef = React.useRef(`mermaid-${Math.random().toString(36).slice(2)}`)

  React.useEffect(() => {
    if (!code) return
    let cancelled = false

    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" })
      mermaid.render(idRef.current, code)
        .then(({ svg: rendered }) => {
          if (!cancelled) setSvg(rendered)
        })
        .catch((err) => {
          if (!cancelled) setError(String(err?.message || err))
        })
    })

    return () => { cancelled = true }
  }, [code])

  if (!code) return <p className="text-sm text-gray-500">No diagram content</p>

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-500">Failed to render diagram: {error}</p>
        <CodeContent data={code} />
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-400 dark:text-gray-500">
        <span className="animate-spin">⟳</span> Rendering diagram…
      </div>
    )
  }

  return (
    <div
      className="w-full overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export function TableContent({ data }: { data: any }) {
  // Unwrap create_artifact envelope so content-level checks work on the actual payload.
  const tableData = (data?.type === "artifact") ? (data?.content ?? data?.data ?? data) : data

  if (isBrandPosts(tableData)) {
    return <BrandPostsArtifact data={parseArtifactData(tableData)} />
  }

  if (isWebSearch(tableData)) {
    return <WebSearchArtifact data={parseArtifactData(tableData)} />
  }

  if (Array.isArray(tableData) && tableData.length > 0) {
    const headers = Object.keys(tableData[0])

    return (
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {formatHeader(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {headers.map((header) => (
                  <td key={header} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
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
  if (tableData && typeof tableData === 'object' && Array.isArray(tableData.headers) && Array.isArray(tableData.rows)) {
    const { headers, rows } = tableData
    return (
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header: any, idx: number) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {formatCellValue(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row: any[], idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {row.map((cell: any, cIdx: number) => (
                  <td key={cIdx} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
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

  if (typeof tableData === "string" && tableData.includes("|")) {
    return (
      <div className="prose prose-sm max-w-none">
        <MessageContent content={tableData} />
      </div>
    )
  }

  return <DataContent data={tableData} />
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
    return <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{data}</p>
  }

  const summaries = extractAllSummaries(data)
  if (summaries.length > 0) {
    return (
      <div className="space-y-4">
        {summaries.map((summary, idx) => (
          <div key={idx} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0">
            {summary.accountName && (
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
      <pre className="text-sm overflow-x-auto text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
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
