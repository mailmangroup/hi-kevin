"use client"

import { memo, useMemo } from "react"
import { marked } from "marked"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import type { Components } from "react-markdown"

/**
 * Split markdown into discrete blocks using marked's lexer.
 * Each block is a self-contained markdown element (paragraph, heading,
 * code block, table, list, etc.) that can be independently memoized.
 */
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown)
  return tokens
    .filter((token) => token.type !== "space")
    .map((token) => token.raw)
}

/**
 * A single markdown block that only re-renders when its content changes.
 * During streaming, only the last (actively changing) block re-renders
 * while all previous completed blocks stay cached.
 */
const MemoizedMarkdownBlock = memo(
  ({ content, components }: { content: string; components?: Components }) => {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    )
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content,
)
MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

/**
 * Markdown renderer optimized for streaming content.
 * Splits content into blocks and memoizes each one individually,
 * so only the currently-streaming block re-parses on each token.
 */
export const MemoizedMarkdown = memo(
  ({ content, id, components }: { content: string; id: string; components?: Components }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content])

    return (
      <>
        {blocks.map((block, index) => (
          <MemoizedMarkdownBlock
            content={block}
            components={components}
            key={`${id}-block_${index}`}
          />
        ))}
      </>
    )
  },
)
MemoizedMarkdown.displayName = "MemoizedMarkdown"
