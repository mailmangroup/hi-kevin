"use client"

import * as React from "react"
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react"
import type { Message } from "@/components/chat/chat-interface"

export function MessageActions({ message }: { message: Message }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    const textToCopy = message.content || ""
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-1 mt-2 -ml-2">
      <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors" title="Like">
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors" title="Dislike">
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handleCopy}
        className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
