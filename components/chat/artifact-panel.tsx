"use client"

import * as React from "react"
import { X, Copy, Check, BarChart3, Code, Table2, FileText, ChevronDown, RefreshCw, GripVertical, Eye, Loader2, Download } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useArtifact, ArtifactData } from "./artifact-context"
import { aiService } from "@/lib/api/client"
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
  file: Download,
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  search_web: "Web Search Results",
  web_search: "Web Search Results",
}

const MIN_PANEL_WIDTH = 400
const MAX_PANEL_RATIO = 0.6 // Panel can take at most 60% of the container

export function ArtifactPanel() {
  const { selectedArtifact, isPanelOpen, closePanel, panelWidth, setPanelWidth } = useArtifact()
  const [copied, setCopied] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = panelRef.current?.parentElement
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const maxWidth = containerRect.width * MAX_PANEL_RATIO
      const newWidth = containerRect.right - e.clientX
      setPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, setPanelWidth])

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
      ref={panelRef}
      style={isReportType ? undefined : { width: panelWidth }}
      className={cn(
        "flex flex-col border-l border-border bg-white h-full max-w-full relative",
        isReportType ? "flex-1" : "flex-shrink-0",
        !isResizing && "transition-all duration-300"
      )}
    >
      {/* Resize Handle */}
      {!isReportType && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 group hover:bg-primary/20 active:bg-primary/30"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 -translate-x-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
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

/** Types that support a code/render toggle */
const TOGGLEABLE_TYPES = new Set(["html", "markdown", "mermaid"])

function ArtifactPanelContent({ artifact }: { artifact: ArtifactData }) {
  const isStreaming = artifact.isStreaming ?? false
  const canToggle = TOGGLEABLE_TYPES.has(artifact.type)
  // Default to code view while streaming, render view when complete
  const [viewMode, setViewMode] = React.useState<"code" | "render">(isStreaming ? "code" : "render")

  // Auto-switch to render when streaming completes
  const prevStreamingRef = React.useRef(isStreaming)
  React.useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      setViewMode("render")
    }
    prevStreamingRef.current = isStreaming
  }, [isStreaming])

  // Domain-specific artifacts don't get the toggle
  if (isBrandPosts(artifact.data, artifact.toolName)) {
    return <BrandPostsArtifact data={parseArtifactData(artifact.data)} />
  }
  if (isWebSearch(artifact.data, artifact.toolName)) {
    return <WebSearchArtifact data={parseArtifactData(artifact.data)} />
  }
  if (isHelpCenter(artifact.data, artifact.toolName)) {
    return <HelpCenterArtifact data={parseArtifactData(artifact.data)} />
  }

  // Extract raw content string for code view
  const rawContent = typeof artifact.data === "string"
    ? artifact.data
    : artifact.data?.content ?? artifact.data?.html ?? artifact.data?.code ?? artifact.data?.markdown ?? null

  const showCodeView = canToggle && viewMode === "code" && rawContent !== null

  return (
    <div className="flex flex-col h-full">
      {/* Code / Render toggle */}
      {canToggle && (
        <div className="flex items-center gap-1 mb-3 flex-shrink-0">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              onClick={() => setViewMode("render")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "render"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Eye className="h-3 w-3" />
              Render
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "code"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Code className="h-3 w-3" />
              Code
            </button>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Streaming...
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {showCodeView ? (
        <div className="overflow-x-auto rounded-lg border border-gray-700 overflow-hidden flex-1">
          <pre className="text-sm font-mono overflow-x-auto p-4 bg-gray-900 text-gray-100 m-0 whitespace-pre-wrap">
            <code>{rawContent}</code>
          </pre>
        </div>
      ) : (
        <ArtifactRenderedContent artifact={artifact} />
      )}
    </div>
  )
}

/** Detect renderable file category from filename extension */
function getFileCategory(filename: string): "image" | "pdf" | "html" | "markdown" | "video" | "audio" | "other" {
  const ext = (filename || "").split(".").pop()?.toLowerCase() || ""
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return "image"
  if (ext === "pdf") return "pdf"
  if (["html", "htm"].includes(ext)) return "html"
  if (["md", "markdown"].includes(ext)) return "markdown"
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video"
  if (["mp3", "wav", "ogg", "aac", "flac"].includes(ext)) return "audio"
  return "other"
}

function FileArtifactContent({ data }: { data: any }) {
  const [loading, setLoading] = React.useState(false)
  const [fileUrl, setFileUrl] = React.useState<string | null>(data?.oss_url || null)
  const [fileContent, setFileContent] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const retryCountRef = React.useRef(0)

  const filename: string = data?.filename || "File"
  const category = getFileCategory(filename)

  // Fetch a fresh signed URL (handles expired pre-signed URLs)
  const refreshUrl = React.useCallback(async () => {
    if (!data?.document_id || !data?.conversation_id) return null
    setLoading(true)
    setError(null)
    try {
      const { document_url } = await aiService.getConversationDocumentUrl(data.conversation_id, data.document_id)
      setFileUrl(document_url)

      // For HTML and Markdown, attempt to fetch the raw text so we can render it natively
      if (category === "html" || category === "markdown") {
        try {
          const res = await fetch(document_url)
          if (res.ok) {
            const text = await res.text()
            setFileContent(text)
          }
        } catch (fetchErr) {
          if (process.env.NODE_ENV === "development") console.error("[FileArtifact] Failed to fetch content text:", fetchErr)
        }
      }

      retryCountRef.current = 0
      return document_url
    } catch (err) {
      setError("Failed to load file URL")
      if (process.env.NODE_ENV === "development") console.error("[FileArtifact] Failed to get URL:", err)
      return null
    } finally {
      setLoading(false)
    }
  }, [data?.document_id, data?.conversation_id, category])

  // Auto-retry once on load error (e.g. expired signed URL)
  const handleLoadError = React.useCallback(() => {
    if (retryCountRef.current < 1 && data?.document_id) {
      retryCountRef.current += 1
      refreshUrl()
    } else {
      setError("Failed to load file — the URL may have expired")
    }
  }, [refreshUrl, data?.document_id])

  // Auto-fetch URL on mount if we don't have one and the file is renderable
  React.useEffect(() => {
    if (!fileUrl && category !== "other") {
      refreshUrl()
    } else if (fileUrl && (category === "html" || category === "markdown") && !fileContent) {
      // If we already have the URL but need the content for native rendering
      fetch(fileUrl)
        .then(res => res.ok ? res.text() : null)
        .then(text => { if (text) setFileContent(text) })
        .catch(err => {
          if (process.env.NODE_ENV === "development") console.error("[FileArtifact] Failed to fetch content:", err)
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async () => {
    const url = fileUrl || (await refreshUrl())
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  // --- Inline renderers by category ---
  const renderInlinePreview = () => {
    if (!fileUrl) return null

    switch (category) {
      case "image":
        return (
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={data?.description || filename}
              className="max-w-full max-h-[600px] rounded-lg object-contain"
              onError={handleLoadError}
            />
          </div>
        )

      case "pdf":
        return (
          <div className="rounded-lg border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 400 }}>
            <iframe
              src={fileUrl}
              title={filename}
              className="w-full h-full"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        )

      case "html":
        if (fileContent) {
          return <HtmlContent data={fileContent} />
        }
        return (
          <div className="rounded-lg border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 400 }}>
            <iframe
              src={fileUrl}
              title={filename}
              className="w-full h-full bg-white"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        )

      case "markdown":
        if (fileContent) {
          return (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <MarkdownContent data={fileContent} />
            </div>
          )
        }
        return null

      case "video":
        return (
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-black">
            <video controls className="w-full max-h-[500px]" preload="metadata">
              <source src={fileUrl} />
              Your browser does not support the video tag.
            </video>
          </div>
        )

      case "audio":
        return (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <audio controls className="w-full" preload="metadata">
              <source src={fileUrl} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        )

      default:
        return null
    }
  }

  const inlinePreview = renderInlinePreview()

  return (
    <div className="flex flex-col gap-4">
      {/* Header with filename + download */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{filename}</p>
          {data?.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{data.description}</p>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Download
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
          <button onClick={refreshUrl} className="ml-2 underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && !inlinePreview && (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading preview...</span>
        </div>
      )}

      {/* Inline preview */}
      {inlinePreview}

      {/* Fallback for non-previewable files */}
      {!inlinePreview && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100">
            <Download className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-xs text-gray-400">Preview not available for this file type</p>
        </div>
      )}
    </div>
  )
}

/** The actual rendered output (no toggle logic) */
function ArtifactRenderedContent({ artifact }: { artifact: ArtifactData }) {
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
    case "file":
      return <FileArtifactContent data={artifact.data} />
    default:
      return <DataContent data={artifact.data} />
  }
}
