"use client"

import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { Copy, Check, Download } from "lucide-react"
import { MemoizedMarkdown } from "./memoized-markdown"
import type { Components } from "react-markdown"

interface MessageContentProps {
  content: string
  className?: string
  isUser?: boolean
  id?: string
}

const PreComponent = ({ children, ...props }: any) => {
  const [copied, setCopied] = React.useState(false)
  const ref = React.useRef<HTMLPreElement>(null)

  const onCopy = () => {
    if (ref.current) {
      navigator.clipboard.writeText(ref.current.innerText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative group">
      <pre ref={ref} className={cn(
        "p-3 rounded-lg overflow-x-auto text-xs my-2 bg-muted border border-border"
      )} {...props}>
        {children}
      </pre>
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background border border-border"
        title="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
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
