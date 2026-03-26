"use client"

import { useCallback, useRef, useState } from "react"

export interface TodoItem {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed"
}

export interface SubagentMessage {
  role: "assistant"
  content: string
}

export interface SubagentToolCall {
  id: string
  name: string
  args: {
    description: string
    subagent_type: string
    [key: string]: unknown
  }
}

export interface SubagentStreamInterface {
  id: string
  status: "pending" | "running" | "complete" | "error"
  messages: SubagentMessage[]
  thinking: string
  result: string | undefined
  error: string | undefined
  toolCall: SubagentToolCall
  startedAt: number | undefined
  completedAt: number | undefined
  parentMessageId: string
  activeTools: Array<{
    tool: string
    input: any
    output?: string
    artifact?: any
    status: "running" | "completed"
    executeStatus?: "executing" | "done" | "error"
  }>
}

export interface DeepAgentStreamState {
  subagents: Map<string, SubagentStreamInterface>
  subagentOrder: string[]
  messageOrder: string[]
  subagentsByMessage: Record<string, string[]>
  values: {
    todos: TodoItem[]
  }
  isComplete: boolean
}

const EMPTY_STATE: DeepAgentStreamState = {
  subagents: new Map(),
  subagentOrder: [],
  messageOrder: [],
  subagentsByMessage: {},
  values: { todos: [] },
  isComplete: false,
}

export function useDeepAgentStream() {
  const [state, setState] = useState<DeepAgentStreamState>(EMPTY_STATE)
  const stateRef = useRef<DeepAgentStreamState>(EMPTY_STATE)

  const setAndSync = useCallback((updater: (prev: DeepAgentStreamState) => DeepAgentStreamState) => {
    setState(prev => {
      const next = updater(prev)
      stateRef.current = next
      return next
    })
  }, [])

  const processEvent = useCallback((chunk: any): boolean => {
    const type = chunk?.type
    if (!type) return false

    if (type === "todo_update") {
      const todos = Array.isArray(chunk.todos) ? chunk.todos : []
      setAndSync(prev => ({
        ...prev,
        values: {
          ...prev.values,
          todos: todos.map((todo: any, index: number) => ({
            id: String(todo?.id ?? `todo-${index}`),
            content: String(todo?.content ?? todo?.description ?? ""),
            status: todo?.status ?? "pending",
          })),
        },
      }))
      return true
    }

    // Subagent execute status — update the active tool with execution state
    if (type === "subagent_execute_status") {
      const subagentId = String(chunk.subagent_id ?? "")
      if (!subagentId) return true
      setAndSync(prev => {
        const existing = prev.subagents.get(subagentId)
        if (!existing) return prev
        const subagents = new Map(prev.subagents)
        const next: SubagentStreamInterface = { ...existing }
        const tools = [...next.activeTools]

        if (chunk.status === "started") {
          // Mark the latest running "execute" tool as actively executing
          const idx = tools.findLastIndex(t => t.tool === "execute" && t.status === "running")
          if (idx >= 0) {
            tools[idx] = { ...tools[idx], executeStatus: "executing" }
          }
        } else if (chunk.status === "completed" || chunk.status === "error") {
          const idx = tools.findLastIndex(t => t.tool === "execute" && t.status === "running")
          if (idx >= 0) {
            tools[idx] = { ...tools[idx], executeStatus: chunk.status === "completed" ? "done" : "error" }
          }
        }

        next.activeTools = tools
        subagents.set(subagentId, next)
        return { ...prev, subagents }
      })
      return true
    }

    if (type === "subagent_started") {
      const subagentId = String(chunk.subagent_id ?? "")
      if (!subagentId) return true
      const parentMessageId = String(chunk.parent_message_id ?? "coordinator")
      const args = (chunk.tool_call?.args ?? {}) as Record<string, unknown>
      const nextSubagent: SubagentStreamInterface = {
        id: subagentId,
        status: "running",
        messages: [],
        thinking: "",
        result: undefined,
        error: undefined,
        toolCall: {
          id: String(chunk.tool_call?.id ?? subagentId),
          name: String(chunk.tool_call?.name ?? "task"),
          args: {
            description: String(args.description ?? ""),
            subagent_type: String(args.subagent_type ?? "specialist"),
            ...args,
          },
        },
        startedAt: chunk.started_at,
        completedAt: undefined,
        parentMessageId,
        activeTools: [],
      }

      setAndSync(prev => {
        const subagents = new Map(prev.subagents)
        subagents.set(subagentId, nextSubagent)
        const subagentsByMessage = { ...prev.subagentsByMessage }
        const linked = subagentsByMessage[parentMessageId] ?? []
        subagentsByMessage[parentMessageId] = linked.includes(subagentId)
          ? linked
          : [...linked, subagentId]

        return {
          ...prev,
          subagents,
          subagentOrder: prev.subagentOrder.includes(subagentId)
            ? prev.subagentOrder
            : [...prev.subagentOrder, subagentId],
          messageOrder: prev.messageOrder.includes(parentMessageId)
            ? prev.messageOrder
            : [...prev.messageOrder, parentMessageId],
          subagentsByMessage,
        }
      })
      return true
    }

    if (type === "subagent_token" || type === "subagent_thinking" || type === "subagent_tool_start" || type === "subagent_tool_end" || type === "subagent_completed" || type === "subagent_error") {
      const subagentId = String(chunk.subagent_id ?? "")
      if (!subagentId) return true
      setAndSync(prev => {
        const existing = prev.subagents.get(subagentId)
        if (!existing) return prev
        const subagents = new Map(prev.subagents)
        const next: SubagentStreamInterface = { ...existing }

        if (type === "subagent_token") {
          const text = String(chunk.content ?? "")
          const last = next.messages[next.messages.length - 1]
          if (last?.role === "assistant") {
            next.messages = [
              ...next.messages.slice(0, -1),
              { ...last, content: `${last.content}${text}` },
            ]
          } else {
            next.messages = [...next.messages, { role: "assistant", content: text }]
          }
        } else if (type === "subagent_thinking") {
          next.thinking = `${next.thinking}${String(chunk.content ?? "")}`
        } else if (type === "subagent_tool_start") {
          next.activeTools = [
            ...next.activeTools,
            {
              tool: String(chunk.tool ?? "tool"),
              input: chunk.tool_input ?? {},
              status: "running",
            },
          ]
        } else if (type === "subagent_tool_end") {
          const tool = String(chunk.tool ?? "tool")
          const tools = [...next.activeTools]
          const index = tools.findLastIndex(t => t.tool === tool && t.status === "running")
          if (index >= 0) {
            tools[index] = {
              ...tools[index],
              output: String(chunk.output ?? ""),
              artifact: chunk.artifact ?? undefined,
              status: "completed",
            }
          }
          next.activeTools = tools
        } else if (type === "subagent_completed") {
          next.status = "complete"
          next.result = String(chunk.result ?? "")
          next.completedAt = chunk.completed_at
        } else if (type === "subagent_error") {
          next.status = "error"
          next.error = String(chunk.error ?? "Unknown subagent error")
          next.completedAt = chunk.completed_at
        }

        subagents.set(subagentId, next)
        return { ...prev, subagents }
      })
      return true
    }

    if (type === "stopped") {
      setAndSync(prev => ({ ...prev, isComplete: true }))
      return true
    }

    if (type === "done") {
      setAndSync(prev => ({ ...prev, isComplete: true }))
      return true
    }

    return false
  }, [setAndSync])

  const reset = useCallback(() => {
    const empty: DeepAgentStreamState = {
      subagents: new Map(),
      subagentOrder: [],
      messageOrder: [],
      subagentsByMessage: {},
      values: { todos: [] },
      isComplete: false,
    }
    stateRef.current = empty
    setState(empty)
  }, [])

  const getState = useCallback((): DeepAgentStreamState => stateRef.current, [])

  const getSubagentsByMessage = useCallback((messageId: string): SubagentStreamInterface[] => {
    const current = stateRef.current
    const ids = current.subagentsByMessage[messageId] ?? []
    return ids.map(id => current.subagents.get(id)).filter(Boolean) as SubagentStreamInterface[]
  }, [])

  return { state, processEvent, reset, getState, getSubagentsByMessage }
}
