"use client"

import * as React from "react"
import { ChevronDown, CheckCircle2, XCircle, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { MessageContent } from "./message-content"
import type { DeepAgentStreamState, TodoItem, SubagentStreamInterface } from "@/lib/hooks/use-deep-agent-stream"

// --- Task Status Icon ---

function TaskStatusIcon({ status }: { status: SubagentStreamInterface["status"] }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
    case "error":
      return <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
    case "pending":
      return <Circle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
    case "running":
    default:
      return <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin flex-shrink-0" />
  }
}

// Format a tool call into a human-readable label
function formatToolCall(name: string, args?: Record<string, unknown>): string {
  const a = args || {}
  if (name === "web_search" || name === "search") {
    const query = a.query || a.q || ""
    return query ? `Searching for "${query}"` : "Searching..."
  }
  if (name === "browse" || name === "visit_url" || name === "crawl_url") {
    const url = a.url || ""
    return url ? `Visiting ${url}` : "Browsing..."
  }
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// --- Tool Call Row ---

function ToolCallRow({ tc }: { tc: SubagentStreamInterface["activeTools"][number] }) {
  const label = formatToolCall(tc.tool, tc.input)
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 py-0.5">
      {tc.status === "running" ? (
        <Loader2 className="h-3 w-3 text-blue-500 animate-spin flex-shrink-0" />
      ) : (
        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </div>
  )
}

// --- Todo List (exported for sticky rendering in chat-interface) ---

export function TodoList({ todos }: { todos: TodoItem[] }) {
  const activeItem = todos.find(t => t.status === "in_progress")

  return (
    <div className="mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm max-w-2xl">
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {todos.map(todo => {
          const done = todo.status === "completed"
          const active = todo.status === "in_progress"
          return (
            <li key={todo.id} className="flex items-center gap-3 px-4 py-2.5">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : active ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm truncate",
                done && "line-through text-gray-400 dark:text-gray-600",
                active && "text-gray-800 dark:text-gray-100 font-medium",
                !done && !active && "text-gray-500 dark:text-gray-400",
              )}>
                {todo.content}
              </span>
            </li>
          )
        })}
      </ul>
      {activeItem && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{activeItem.content}</span>
        </div>
      )}
    </div>
  )
}

// --- Research Task Card ---

function ResearchTaskCard({
  subagent,
  isStreaming,
}: {
  subagent: SubagentStreamInterface
  isStreaming: boolean
}) {
  const [isExpanded, setIsExpanded] = React.useState(subagent.status === "running")
  const [userToggled, setUserToggled] = React.useState(false)
  const prevStatusRef = React.useRef(subagent.status)

  // Auto-collapse on completion (unless user toggled)
  React.useEffect(() => {
    if (prevStatusRef.current === "running" && subagent.status !== "running" && !userToggled) {
      setIsExpanded(false)
    }
    prevStatusRef.current = subagent.status
  }, [subagent.status, userToggled])

  const handleToggle = () => {
    setUserToggled(true)
    setIsExpanded(!isExpanded)
  }

  const isRunning = subagent.status === "running"
  const isFailed = subagent.status === "error"

  // Determine live activity label for collapsed header
  const toolCalls = subagent.activeTools ?? []
  const latestRunningTool = [...toolCalls].reverse().find(tc => tc.status === "running")
  const latestCompletedTool = [...toolCalls].reverse().find(tc => tc.status === "completed")
  const latestTool = latestRunningTool ?? latestCompletedTool

  const activityLabel = latestTool ? formatToolCall(latestTool.tool, latestTool.input) : null
  const latestMessage = subagent.messages[subagent.messages.length - 1]
  const hasLiveContent = (latestMessage?.content ?? "").length > 0
  const hasToolCalls = toolCalls.length > 0

  return (
    <div
      className={cn(
        "mb-2 rounded-lg border overflow-hidden",
        isRunning
          ? "border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20"
          : isFailed
            ? "border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20"
            : "border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-950/20"
      )}
    >
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <TaskStatusIcon status={subagent.status} />
        <span
          className={cn(
            "text-xs font-medium flex-1 truncate",
            isRunning ? "text-blue-700 dark:text-blue-400" : isFailed ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"
          )}
        >
          {subagent.toolCall.args.description || "Subagent task"}
        </span>
        {subagent.toolCall.args.subagent_type && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium",
            isRunning ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" : isFailed ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300" : "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
          )}>
            {subagent.toolCall.args.subagent_type}
          </span>
        )}
        {!isExpanded && isRunning && activityLabel && (
          <span className="text-[10px] text-blue-500 dark:text-blue-400 flex-shrink-0 truncate max-w-[120px]">
            {activityLabel}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform flex-shrink-0",
            isRunning ? "text-blue-600 dark:text-blue-400" : isFailed ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-opacity-50 space-y-2">
          {/* Live tool call list */}
          {hasToolCalls && (
            <div className="space-y-0.5">
              {toolCalls.map((tc, i) => (
                <ToolCallRow key={i} tc={tc} />
              ))}
            </div>
          )}

          {/* Live streaming content from subagent LLM */}
          {isRunning && hasLiveContent && (
            <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <MessageContent content={latestMessage?.content || ""} className="prose-xs" />
              {isStreaming && <span className="animate-pulse ml-0.5">▊</span>}
            </div>
          )}

          {isRunning && subagent.thinking && (
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
              <MessageContent content={subagent.thinking} className="prose-xs" />
            </div>
          )}

          {/* Idle state */}
          {isRunning && !hasLiveContent && !hasToolCalls && !subagent.thinking && (
            <div className="text-xs text-gray-600 leading-relaxed">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Researching...</span>
              </div>
            </div>
          )}

          {/* Completed result */}
          {!isRunning && !isFailed && subagent.result && (
            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              <MessageContent content={subagent.result || ""} className="prose-xs" />
            </div>
          )}

          {/* Error */}
          {isFailed && subagent.error && (
            <div className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{subagent.error}</div>
          )}
          {isFailed && !subagent.error && (
            <div className="text-xs text-red-500 dark:text-red-400">Task failed.</div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main Component ---

interface DeepAgentDisplayProps {
  data: DeepAgentStreamState
  isStreaming: boolean
}

export function DeepAgentDisplay({ data, isStreaming }: DeepAgentDisplayProps) {
  const taskCount = data.subagentOrder.length
  const completedCount = data.subagentOrder.filter((id) => data.subagents.get(id)?.status === "complete").length
  const messageOrder = data.messageOrder.length > 0 ? data.messageOrder : ["coordinator"]

  if (taskCount === 0) {
    // Only show "Starting deep agent..." while actually streaming; hide once complete.
    if (!isStreaming) return null
    return (
      <div className="space-y-1 max-w-2xl">
        <div className="mb-3 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2">
            <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Starting Lobster Mode...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1 max-w-2xl">
      <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium px-0.5">
        Research tasks: {completedCount}/{taskCount} completed
      </div>
      {messageOrder.map((messageId) => {
        const subagentIds = data.subagentsByMessage[messageId] ?? []
        if (!subagentIds.length) return null
        return (
          <div key={messageId} className="space-y-2">
            {subagentIds.map((subagentId) => {
              const subagent = data.subagents.get(subagentId)
              if (!subagent) return null
              return <ResearchTaskCard key={subagent.id} subagent={subagent} isStreaming={isStreaming} />
            })}
          </div>
        )
      })}
    </div>
  )
}
