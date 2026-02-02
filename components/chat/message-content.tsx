"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils/cn"

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
            <p className={cn("mb-2 last:mb-0 leading-relaxed", isUser ? "text-white" : "dark:font-medium dark:text-gray-200")}>{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className={cn("list-disc list-inside mb-2 space-y-1", isUser ? "text-white" : "dark:font-medium dark:text-gray-200")}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={cn("list-decimal list-inside mb-2 space-y-1", isUser ? "text-white" : "dark:font-medium dark:text-gray-200")}>{children}</ol>
          ),
          li: ({ children }) => (
            <li className={cn("leading-relaxed", isUser ? "text-white" : "dark:font-medium dark:text-gray-200")}>{children}</li>
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
          pre: ({ children }) => (
            <pre className={cn(
              "p-3 rounded-lg overflow-x-auto text-xs my-2",
              isUser
                ? "bg-white/10 text-white"
                : "bg-gray-50 border border-gray-100"
            )}>
              {children}
            </pre>
          ),

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
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className={cn(
                "min-w-full text-xs border-collapse",
                isUser ? "text-white" : "text-gray-700 dark:text-gray-200"
              )}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={cn(
              isUser ? "border-b border-white/30" : "border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50"
            )}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className={cn(
              "border-b",
              isUser ? "border-white/20" : "border-gray-100 dark:border-gray-800"
            )}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className={cn(
              "px-3 py-2 text-left font-semibold",
              isUser ? "text-white" : "text-gray-700 dark:text-gray-200"
            )}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={cn(
              "px-3 py-2",
              isUser ? "text-white" : "text-gray-600 dark:text-gray-300"
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
