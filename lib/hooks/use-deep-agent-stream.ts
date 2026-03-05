"use client"

import { useCallback, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TodoItem {
  id: string
  description: string
  status: "pending" | "in_progress" | "completed"
}

export interface SubagentToolCall {
  tool: string
  input: any
  output?: string
  status: "running" | "completed"
}

export interface SubagentState {
  id: string
  name: string
  description: string
  status: "in_progress" | "completed" | "failed"
  content: string
  thinkingContent: string
  toolCalls: SubagentToolCall[]
  result?: string
  error?: string
}

export interface DeepAgentStreamState {
  tasks: Record<string, SubagentState>
  taskOrder: string[]
  isComplete: boolean
  todos: TodoItem[]
}

const EMPTY_STATE: DeepAgentStreamState = {
  tasks: {},
  taskOrder: [],
  isComplete: false,
  todos: [],
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDeepAgentStream() {
  const [state, setState] = useState<DeepAgentStreamState>(EMPTY_STATE)
  // Keep a ref in sync for reads inside the stream loop (avoids stale closures)
  const stateRef = useRef<DeepAgentStreamState>(EMPTY_STATE)

  const setAndSync = useCallback((updater: (prev: DeepAgentStreamState) => DeepAgentStreamState) => {
    setState(prev => {
      const next = updater(prev)
      stateRef.current = next
      return next
    })
  }, [])

  /**
   * Process a single SSE chunk. Returns true if this chunk was handled as a
   * deep-agent event (caller should skip normal handling).
   */
  const processEvent = useCallback((chunk: any): boolean => {
    const type: string = chunk.type

    switch (type) {
      // --- New event format ---

      case "subagent_started": {
        const { task_id, subagent_name, description } = chunk
        setAndSync(prev => ({
          ...prev,
          tasks: {
            ...prev.tasks,
            [task_id]: {
              id: task_id,
              name: subagent_name ?? "",
              description: description ?? task_id,
              status: "in_progress",
              content: "",
              thinkingContent: "",
              toolCalls: [],
            },
          },
          taskOrder: prev.taskOrder.includes(task_id)
            ? prev.taskOrder
            : [...prev.taskOrder, task_id],
        }))
        return true
      }

      case "subagent_token": {
        const { task_id, content } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          return {
            ...prev,
            tasks: { ...prev.tasks, [task_id]: { ...task, content: task.content + content } },
          }
        })
        return true
      }

      case "subagent_thinking": {
        const { task_id, content } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          return {
            ...prev,
            tasks: {
              ...prev.tasks,
              [task_id]: { ...task, thinkingContent: task.thinkingContent + content },
            },
          }
        })
        return true
      }

      case "subagent_tool_start": {
        const { task_id, tool, tool_input } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          return {
            ...prev,
            tasks: {
              ...prev.tasks,
              [task_id]: {
                ...task,
                toolCalls: [...task.toolCalls, { tool, input: tool_input ?? {}, status: "running" }],
              },
            },
          }
        })
        return true
      }

      case "subagent_tool_end": {
        const { task_id, tool, output } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          // Update the last running tool call matching the tool name
          const toolCalls = [...task.toolCalls]
          const idx = toolCalls.findLastIndex(tc => tc.tool === tool && tc.status === "running")
          if (idx >= 0) {
            toolCalls[idx] = { ...toolCalls[idx], output: output ?? "", status: "completed" }
          }
          return {
            ...prev,
            tasks: { ...prev.tasks, [task_id]: { ...task, toolCalls } },
          }
        })
        return true
      }

      case "subagent_completed": {
        const { task_id, result } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          return {
            ...prev,
            tasks: {
              ...prev.tasks,
              [task_id]: { ...task, status: "completed", result: result ?? "" },
            },
          }
        })
        return true
      }

      case "subagent_error": {
        const { task_id, error } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          return {
            ...prev,
            tasks: {
              ...prev.tasks,
              [task_id]: { ...task, status: "failed", error: error ?? "Unknown error" },
            },
          }
        })
        return true
      }

      // --- Backward compat: old task_* events ---

      case "task_started": {
        const { task_id, description } = chunk
        setAndSync(prev => ({
          ...prev,
          tasks: {
            ...prev.tasks,
            [task_id]: {
              id: task_id,
              name: chunk.subagent_type ?? "",
              description: description ?? task_id,
              status: "in_progress",
              content: "",
              thinkingContent: "",
              toolCalls: [],
            },
          },
          taskOrder: prev.taskOrder.includes(task_id)
            ? prev.taskOrder
            : [...prev.taskOrder, task_id],
        }))
        return true
      }

      case "task_running": {
        const { task_id, message } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          // Extract content / tool calls from legacy message format
          const content = message?.content ?? ""
          const toolCalls: SubagentToolCall[] = (message?.tool_calls ?? []).map((tc: any) => ({
            tool: tc.name,
            input: tc.args ?? {},
            status: "running" as const,
          }))
          return {
            ...prev,
            tasks: {
              ...prev.tasks,
              [task_id]: {
                ...task,
                content: task.content + content,
                toolCalls: toolCalls.length ? toolCalls : task.toolCalls,
              },
            },
          }
        })
        return true
      }

      case "task_completed": {
        const { task_id, result } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          return {
            ...prev,
            tasks: { ...prev.tasks, [task_id]: { ...task, status: "completed", result: result ?? "" } },
          }
        })
        return true
      }

      case "task_failed":
      case "task_timed_out": {
        const { task_id, error } = chunk
        setAndSync(prev => {
          const task = prev.tasks[task_id]
          if (!task) return prev
          return {
            ...prev,
            tasks: {
              ...prev.tasks,
              [task_id]: {
                ...task,
                status: "failed",
                error: error ?? (type === "task_timed_out" ? "Task timed out." : "Task failed."),
              },
            },
          }
        })
        return true
      }

      default:
        return false
    }
  }, [setAndSync])

  const updateTodos = useCallback((todos: TodoItem[]) => {
    setAndSync(prev => ({ ...prev, todos }))
  }, [setAndSync])

  const reset = useCallback(() => {
    const empty = { ...EMPTY_STATE, tasks: {}, taskOrder: [], todos: [] }
    stateRef.current = empty
    setState(empty)
  }, [])

  const markComplete = useCallback(() => {
    setAndSync(prev => ({ ...prev, isComplete: true }))
  }, [setAndSync])

  /** Read the current state without triggering re-renders (safe inside async loops). */
  const getState = useCallback((): DeepAgentStreamState => stateRef.current, [])

  return { state, processEvent, updateTodos, reset, markComplete, getState }
}
