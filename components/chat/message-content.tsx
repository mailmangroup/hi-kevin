"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils/cn"
import { Copy, Check, Download } from "lucide-react"

interface MessageContentProps {
  content: string
  className?: string
  isUser?: boolean
}

export function MessageContent({ content, className, isUser = false }: MessageContentProps) {
  if (!content) return null

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className={cn("text-lg font-bold mt-4 mb-2 first:mt-0", isUser && "text-white")}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={cn("text-base font-bold mt-3 mb-2 first:mt-0", isUser && "text-white")}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn("text-sm font-bold mt-2 mb-1 first:mt-0", isUser && "text-white")}>{children}</h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className={cn("mb-2 last:mb-0 leading-relaxed", isUser ? "text-white" : "")}>{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className={cn("list-disc list-inside mb-2 space-y-1", isUser ? "text-white" : "")}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={cn("list-decimal list-inside mb-2 space-y-1", isUser ? "text-white" : "")}>{children}</ol>
          ),
          li: ({ children }) => (
            <li className={cn("leading-relaxed", isUser ? "text-white" : "")}>{children}</li>
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
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-800"
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
          pre: ({ children }) => {
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
                  "p-3 rounded-lg overflow-x-auto text-xs my-2",
                  isUser
                    ? "bg-white/10 text-white"
                    : "bg-gray-50 border border-gray-100"
                )}>
                  {children}
                </pre>
                {!isUser && (
                  <button
                    onClick={onCopy}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white border border-gray-200"
                    title="Copy code"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
                  </button>
                )}
              </div>
            )
          },

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "underline underline-offset-2 hover:opacity-80 break-all",
                isUser ? "text-white" : "text-primary"
              )}
            >
              {children}
            </a>
          ),

          // Tables
          table: ({ children }) => {
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
                    // Get text content and escape quotes
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
              <div className="relative group my-2 border rounded-lg border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table ref={ref} className={cn(
                    "min-w-full text-xs border-collapse",
                    isUser ? "text-white" : "text-gray-700"
                  )}>
                    {children}
                  </table>
                </div>
                {!isUser && (
                  <div className="flex justify-end items-center gap-2 p-1 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={onDownloadCSV}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded transition-colors"
                      title="Download as CSV"
                    >
                      <Download className="h-3 w-3" />
                      CSV
                    </button>
                    <div className="h-3 w-px bg-gray-300" />
                    <button
                      onClick={onCopy}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded transition-colors"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            )
          },
          thead: ({ children }) => (
            <thead className={cn(
              isUser ? "border-b border-white/30" : "border-b border-gray-200 bg-gray-50"
            )}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className={cn(
              "border-b",
              isUser ? "border-white/20" : "border-gray-100"
            )}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className={cn(
              "px-3 py-2 text-left font-semibold",
              isUser ? "text-white" : "text-gray-700"
            )}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={cn(
              "px-3 py-2",
              isUser ? "text-white" : "text-gray-600"
            )}>
              {children}
            </td>
          ),

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className={cn(
              "border-l-2 pl-3 my-2 italic",
              isUser
                ? "border-white/50 text-white/90"
                : "border-gray-300 text-gray-600"
            )}>
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => (
            <hr className={cn(
              "my-3",
              isUser ? "border-white/30" : "border-gray-200"
            )} />
          ),

          // Strong and emphasis
          strong: ({ children }) => (
            <strong className={cn("font-semibold", isUser && "text-white")}>{children}</strong>
          ),
          em: ({ children }) => (
            <em className={cn(isUser && "text-white")}>{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
