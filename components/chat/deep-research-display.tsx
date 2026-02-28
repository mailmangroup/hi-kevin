"use client"

import * as React from "react"
import { ChevronDown, CheckCircle2, XCircle, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { MessageContent } from "./message-content"

// --- Types ---

export interface ResearchTask {
  id: string
  description: string
  status: "in_progress" | "completed" | "failed" | "timed_out"
  latestMessage?: { content?: string; tool_calls?: Array<{ name: string; args?: Record<string, unknown> }> }
  result?: string
  error?: string
}

export interface DeepResearchData {
  tasks: Record<string, ResearchTask>  // keyed by task_id for O(1) updates
  taskOrder: string[]                   // insertion order for rendering
  isComplete: boolean
}

// --- Task Status Icon ---

function TaskStatusIcon({ status }: { status: ResearchTask["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
    case "failed":
    case "timed_out":
      return <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
    case "in_progress":
    default:
      return <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin flex-shrink-0" />
  }
}

// Format a tool call into a human-readable label
function formatToolCall(toolCall: { name: string; args?: Record<string, unknown> }): string {
  const name = toolCall.name
  const args = toolCall.args || {}

  if (name === "web_search" || name === "search") {
    const query = args.query || args.q || ""
    return query ? `Searching for "${query}"` : "Searching..."
  }
  if (name === "browse" || name === "visit_url") {
    const url = args.url || ""
    return url ? `Visiting ${url}` : "Browsing..."
  }
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// --- Research Task Card ---

function ResearchTaskCard({
  task,
  isStreaming,
}: {
  task: ResearchTask
  isStreaming: boolean
}) {
  const [isExpanded, setIsExpanded] = React.useState(task.status === "in_progress")
  const [userToggled, setUserToggled] = React.useState(false)
  const prevStatusRef = React.useRef(task.status)

  // Auto-collapse on completion (unless user toggled)
  React.useEffect(() => {
    if (prevStatusRef.current === "in_progress" && task.status !== "in_progress" && !userToggled) {
      setIsExpanded(false)
    }
    prevStatusRef.current = task.status
  }, [task.status, userToggled])

  const handleToggle = () => {
    setUserToggled(true)
    setIsExpanded(!isExpanded)
  }

  const isRunning = task.status === "in_progress"
  const isFailed = task.status === "failed" || task.status === "timed_out"

  const latestToolCall = task.latestMessage?.tool_calls?.[task.latestMessage.tool_calls.length - 1]
  const toolCallLabel = latestToolCall ? formatToolCall(latestToolCall) : null

  return (
    <div
      className={cn(
        "mb-2 rounded-lg border overflow-hidden",
        isRunning
          ? "border-blue-200 bg-blue-50/50"
          : isFailed
            ? "border-red-200 bg-red-50/50"
            : "border-green-200 bg-green-50/50"
      )}
    >
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition-colors"
      >
        <TaskStatusIcon status={task.status} />
        <span
          className={cn(
            "text-xs font-medium flex-1 truncate",
            isRunning ? "text-blue-700" : isFailed ? "text-red-700" : "text-green-700"
          )}
        >
          {task.description}
        </span>
        {!isExpanded && isRunning && toolCallLabel && (
          <span className="text-[10px] text-blue-500 flex-shrink-0 truncate max-w-[120px]">
            {toolCallLabel}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform flex-shrink-0",
            isRunning ? "text-blue-600" : isFailed ? "text-red-500" : "text-green-600",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-opacity-50">
          {isRunning && (
            <div className="text-xs text-gray-600 leading-relaxed">
              {toolCallLabel ? (
                <div className="flex items-center gap-1.5">
                  <Search className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  <span>{toolCallLabel}</span>
                  {isStreaming && <span className="animate-pulse">▊</span>}
                </div>
              ) : task.latestMessage?.content ? (
                <div>
                  <MessageContent content={task.latestMessage.content} className="prose-xs" />
                  {isStreaming && <span className="animate-pulse ml-1">▊</span>}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Researching...</span>
                </div>
              )}
            </div>
          )}

          {!isRunning && !isFailed && task.result && (
            <div className="text-xs text-gray-700 leading-relaxed">
              <MessageContent content={task.result} className="prose-xs" />
            </div>
          )}

          {isFailed && task.error && (
            <div className="text-xs text-red-600 leading-relaxed">{task.error}</div>
          )}

          {isFailed && !task.error && (
            <div className="text-xs text-red-500">
              {task.status === "timed_out" ? "Task timed out." : "Task failed."}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main Component ---

interface DeepResearchDisplayProps {
  data: DeepResearchData
  isStreaming: boolean
}

export function DeepResearchDisplay({ data, isStreaming }: DeepResearchDisplayProps) {
  const taskCount = data.taskOrder.length
  const completedCount = data.taskOrder.filter(
    (id) => data.tasks[id]?.status === "completed"
  ).length

  if (taskCount === 0) {
    return (
      <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/50 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
          <span className="text-xs font-medium text-blue-700">Starting deep research...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="mb-1 text-[10px] text-gray-500 font-medium px-0.5">
        Research tasks: {completedCount}/{taskCount} completed
      </div>
      {data.taskOrder.map((taskId) => {
        const task = data.tasks[taskId]
        if (!task) return null
        return <ResearchTaskCard key={taskId} task={task} isStreaming={isStreaming} />
      })}
    </div>
  )
}
