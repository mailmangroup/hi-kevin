"use client"

import * as React from "react"
import { ChevronDown, CheckCircle2, XCircle, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { MessageContent } from "./message-content"
import type { SubagentToolCall, DeepAgentStreamState, TodoItem } from "@/lib/hooks/use-deep-agent-stream"

// --- Types ---

export interface ResearchTask {
  id: string
  description: string
  status: "in_progress" | "completed" | "failed" | "timed_out"
  // Streaming fields (optional for backward compat with parse-sub-content)
  name?: string
  content?: string
  thinkingContent?: string
  toolCalls?: SubagentToolCall[]
  // Legacy field from old task_running events
  latestMessage?: { content?: string; tool_calls?: Array<{ name: string; args?: Record<string, unknown> }> }
  result?: string
  error?: string
}

export interface DeepAgentData {
  tasks: Record<string, ResearchTask>
  taskOrder: string[]
  isComplete: boolean
  todos?: TodoItem[]
}

// Allow the hook's state to be used directly where DeepAgentData is expected
export type DeepAgentDisplayData = DeepAgentData | DeepAgentStreamState

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

function ToolCallRow({ tc }: { tc: SubagentToolCall }) {
  const label = formatToolCall(tc.tool, tc.input)
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 py-0.5">
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
    <div className="mb-3 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm max-w-2xl">
      <ul className="divide-y divide-gray-100">
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
                <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm truncate",
                done && "line-through text-gray-400",
                active && "text-gray-800 font-medium",
                !done && !active && "text-gray-500",
              )}>
                {todo.description}
              </span>
            </li>
          )
        })}
      </ul>
      {activeItem && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100 bg-gray-50">
          <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{activeItem.description}</span>
        </div>
      )}
    </div>
  )
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

  // Determine live activity label for collapsed header
  const toolCalls = task.toolCalls ?? []
  const latestRunningTool = [...toolCalls].reverse().find(tc => tc.status === "running")
  const latestCompletedTool = [...toolCalls].reverse().find(tc => tc.status === "completed")
  const latestTool = latestRunningTool ?? latestCompletedTool

  // Legacy support: fall back to latestMessage if toolCalls not present
  const legacyToolCall = task.latestMessage?.tool_calls?.[task.latestMessage.tool_calls.length - 1]
  const activityLabel = latestTool
    ? formatToolCall(latestTool.tool, latestTool.input)
    : legacyToolCall
      ? formatToolCall(legacyToolCall.name, legacyToolCall.args)
      : null

  const hasLiveContent = (task.content ?? "").length > 0
  const hasToolCalls = toolCalls.length > 0

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
        {task.name && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium",
            isRunning ? "bg-blue-100 text-blue-600" : isFailed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
          )}>
            {task.name}
          </span>
        )}
        {!isExpanded && isRunning && activityLabel && (
          <span className="text-[10px] text-blue-500 flex-shrink-0 truncate max-w-[120px]">
            {activityLabel}
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
            <div className="text-xs text-gray-600 leading-relaxed">
              <MessageContent content={task.content!} className="prose-xs" />
              {isStreaming && <span className="animate-pulse ml-0.5">▊</span>}
            </div>
          )}

          {/* Fallback: legacy latestMessage content when no toolCalls */}
          {isRunning && !hasLiveContent && !hasToolCalls && task.latestMessage?.content && (
            <div className="text-xs text-gray-600 leading-relaxed">
              <MessageContent content={task.latestMessage.content} className="prose-xs" />
              {isStreaming && <span className="animate-pulse ml-1">▊</span>}
            </div>
          )}

          {/* Idle state */}
          {isRunning && !hasLiveContent && !hasToolCalls && !task.latestMessage?.content && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Researching...</span>
            </div>
          )}

          {/* Completed result */}
          {!isRunning && !isFailed && task.result && (
            <div className="text-xs text-gray-700 leading-relaxed">
              <MessageContent content={task.result} className="prose-xs" />
            </div>
          )}

          {/* Error */}
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

interface DeepAgentDisplayProps {
  data: DeepAgentDisplayData
  isStreaming: boolean
}

export function DeepAgentDisplay({ data, isStreaming }: DeepAgentDisplayProps) {
  const taskCount = data.taskOrder.length
  const completedCount = data.taskOrder.filter(
    (id) => data.tasks[id]?.status === "completed"
  ).length
  const todos = (data as DeepAgentStreamState).todos ?? (data as DeepAgentData).todos ?? []

  if (taskCount === 0) {
    // Only show "Starting deep agent..." while actually streaming; hide once complete.
    if (!isStreaming) return null
    return (
      <div className="space-y-1 max-w-2xl">
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
            <span className="text-xs font-medium text-blue-700">Starting deep agent...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1 max-w-2xl">
      <div className="mb-1 text-[10px] text-gray-500 font-medium px-0.5">
        Research tasks: {completedCount}/{taskCount} completed
      </div>
      {data.taskOrder.map((taskId) => {
        const raw = data.tasks[taskId]
        if (!raw) return null
        // Normalize SubagentState → ResearchTask (both shapes are compatible)
        const task: ResearchTask = raw as ResearchTask
        return <ResearchTaskCard key={taskId} task={task} isStreaming={isStreaming} />
      })}
    </div>
  )
}
