"use client"

import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { Copy, Check, Download, Eye, Code2 } from "lucide-react"
import { MemoizedMarkdown } from "./memoized-markdown"
import type { Components } from "react-markdown"

interface MessageContentProps {
  content: string
  className?: string
  isUser?: boolean
  id?: string
}

/** Languages that support inline preview rendering. */
const RENDERABLE_LANGUAGES = new Set(["svg", "mermaid", "html"])

/** Extract language from <code className="language-xxx"> child inside <pre>. */
function getCodeLanguage(children: React.ReactNode): string | null {
  const child = React.Children.toArray(children)[0] as React.ReactElement | undefined
  if (!child?.props?.className) return null
  const match = String(child.props.className).match(/language-(\w+)/)
  return match ? match[1].toLowerCase() : null
}

/** Recursively extract text content from React children. */
function extractTextFromChildren(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (!node) return ""
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join("")
  if (typeof node === "object" && "props" in node) {
    return extractTextFromChildren((node as React.ReactElement).props.children)
  }
  return ""
}

/** Inline SVG renderer (sanitised: strips <script> tags). */
function SvgPreview({ code }: { code: string }) {
  const sanitised = code.replace(/<script[\s\S]*?<\/script>/gi, "")
  return (
    <div
      className="flex items-center justify-center p-4 bg-white rounded-lg border border-border overflow-auto"
      dangerouslySetInnerHTML={{ __html: sanitised }}
    />
  )
}

/** Mermaid diagram renderer (dynamically imports mermaid). */
function MermaidPreview({ code }: { code: string }) {
  const [svg, setSvg] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const idRef = React.useRef(`mermaid-${Math.random().toString(36).slice(2)}`)

  React.useEffect(() => {
    if (!code) return
    let cancelled = false
    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" })
      mermaid
        .render(idRef.current, code)
        .then(({ svg: rendered }) => { if (!cancelled) setSvg(rendered) })
        .catch((err) => { if (!cancelled) setError(String(err?.message || err)) })
    })
    return () => { cancelled = true }
  }, [code])

  if (error) return <p className="text-xs text-destructive p-2">Diagram error: {error}</p>
  if (!svg) return <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground justify-center"><span className="animate-spin">&#x27F3;</span> Rendering diagram&hellip;</div>
  return (
    <div
      className="w-full overflow-auto rounded-lg border border-border bg-white p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/** Sandboxed HTML renderer. */
function HtmlPreview({ code }: { code: string }) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = React.useState(300)

  const handleLoad = React.useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    requestAnimationFrame(() => {
      if (!iframe.contentDocument?.body) return
      const h = iframe.contentDocument.documentElement.scrollHeight || iframe.contentDocument.body.scrollHeight
      setHeight(Math.max(200, Math.min(h + 24, 600)))
    })
  }, [])

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        title="HTML preview"
        srcDoc={code}
        style={{ height }}
        className="w-full border-0 block"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        onLoad={handleLoad}
      />
    </div>
  )
}

const PreComponent = ({ children, ...props }: any) => {
  const [copied, setCopied] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(true)
  const ref = React.useRef<HTMLPreElement>(null)

  const language = getCodeLanguage(children)
  const codeText = React.useMemo(() => extractTextFromChildren(children), [children])
  // Treat xml blocks that contain SVG as svg
  const effectiveLanguage = (language === "xml" && /^\s*<svg[\s>]/i.test(codeText)) ? "svg" : language
  const isRenderable = effectiveLanguage !== null && RENDERABLE_LANGUAGES.has(effectiveLanguage)

  const onCopy = () => {
    if (ref.current) {
      navigator.clipboard.writeText(ref.current.innerText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative group my-2">
      {/* Language label + action bar */}
      {(isRenderable || language) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/80 border border-b-0 border-border rounded-t-lg">
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
            {language}
          </span>
          <div className="flex items-center gap-1">
            {isRenderable && (
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={showPreview ? "Show code" : "Preview"}
              >
                {showPreview ? <Code2 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            )}
            <button
              onClick={onCopy}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}

      {/* Code block (always mounted so ref stays available for copy) */}
      <pre
        ref={ref}
        className={cn(
          "p-3 overflow-x-auto text-xs bg-muted border border-border",
          (isRenderable || language) ? "rounded-b-lg" : "rounded-lg",
          showPreview && "hidden"
        )}
        {...props}
      >
        {children}
      </pre>

      {/* Preview panel */}
      {showPreview && isRenderable && (
        <div className="my-0">
          {effectiveLanguage === "svg" && <SvgPreview code={codeText} />}
          {effectiveLanguage === "mermaid" && <MermaidPreview code={codeText} />}
          {effectiveLanguage === "html" && <HtmlPreview code={codeText} />}
        </div>
      )}

      {/* Fallback copy button when no language bar is shown */}
      {!isRenderable && !language && (
        <button
          onClick={onCopy}
          className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background border border-border"
          title="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      )}
    </div>
  )
}

const TableComponent = ({ children, ...props }: any) => {
  const [copied, setCopied] = React.useState(false)
  const ref = React.useRef<HTMLTableElement>(null)

  const onCopy = () => {
    if (ref.current) {
      navigator.clipboard.writeText(ref.current.innerText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const onDownloadCSV = () => {
    if (ref.current) {
      const rows = Array.from(ref.current.querySelectorAll('tr'))
      const csvContent = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        return cells.map(cell => {
          const text = (cell as HTMLElement).innerText.replace(/"/g, '""')
          return `"${text}"`
        }).join(',')
      }).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'table_data.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="relative group my-2 border rounded-lg border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table ref={ref} className="min-w-full text-xs border-collapse text-foreground" {...props}>
          {children}
        </table>
      </div>
      <div className="flex justify-end items-center gap-2 p-1 bg-muted/50 border-t border-border">
        <button
          onClick={onDownloadCSV}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          title="Download as CSV"
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
        <div className="h-3 w-px bg-border" />
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}

export function MessageContent({ content, className, isUser = false, id }: MessageContentProps) {
  // Use a stable id for memoization keying
  const fallbackId = React.useId()
  const stableId = id || fallbackId

  const components: Components = React.useMemo(() => ({
    // Headings
    h1: ({ children }) => (
      <h1 className={cn("text-lg font-bold mt-4 mb-2 first:mt-0")}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className={cn("text-base font-bold mt-3 mb-2 first:mt-0")}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className={cn("text-sm font-bold mt-2 mb-1 first:mt-0")}>{children}</h3>
    ),

    // Paragraphs
    p: ({ children }) => (
      <p className={cn("mb-2 last:mb-0 leading-relaxed")}>{children}</p>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className={cn("list-disc list-inside mb-2 space-y-1")}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className={cn("list-decimal list-inside mb-2 space-y-1")}>{children}</ol>
    ),
    li: ({ children }) => (
      <li className={cn("leading-relaxed")}>{children}</li>
    ),

    // Code
    code: ({ className, children, ...props }) => {
      const isInline = !className
      if (isInline) {
        return (
          <code
            className={cn(
              "px-1.5 py-0.5 rounded text-xs font-mono",
              isUser
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
            {...props}
          >
            {children}
          </code>
        )
      }
      return (
        <code className={cn("font-mono text-xs", className)} {...props}>
          {children}
        </code>
      )
    },
    pre: PreComponent,

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80 break-all text-primary"
      >
        {children}
      </a>
    ),

    // Tables
    table: TableComponent,
    thead: ({ children }) => (
      <thead className="border-b border-border bg-muted/30">
        {children}
      </thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-border">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 text-left font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-foreground">
        {children}
      </td>
    ),

    // Blockquote
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 pl-3 my-2 italic border-muted-foreground/30 text-muted-foreground">
        {children}
      </blockquote>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="my-3 border-border" />
    ),

    // Strong and emphasis
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em>{children}</em>
    ),
  }), [isUser])

  if (!content) return null

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <MemoizedMarkdown content={content} id={stableId} components={components} />
    </div>
  )
}
