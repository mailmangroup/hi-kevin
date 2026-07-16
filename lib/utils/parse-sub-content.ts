import type { ContentPart, ToolCall } from "@/components/chat/chat-interface"
import type {
  DeepAgentStreamState,
  SubagentStreamInterface,
} from "@/lib/hooks/use-deep-agent-stream"

export function parseSubContentList(subContentList: any[] = []): {
  toolCalls: ToolCall[],
  content: string,
  images: Array<{ image_url: string; filename?: string; file_type?: string }>,
  documents: any[],
  parts: ContentPart[],
} {
  const toolCalls: ToolCall[] = []
  const images: Array<{ image_url: string; filename?: string; file_type?: string }> = []
  const documents: any[] = []
  const parts: ContentPart[] = []
  const incompleteToolCalls = new Map<string, ToolCall>()
  let lastToolCall: ToolCall | null = null
  let textContent = ""

  if (!Array.isArray(subContentList)) {
    return { toolCalls, content: textContent, images, documents, parts }
  }

  for (const item of subContentList) {
    if (item.type === 'tool_call' || item.type === 'tool_use') {
      const toolCall: ToolCall = {
        id: item.id || Date.now().toString(),
        name: item.name || item.tool,
        input: item.input || item.args || {},
        output: item.output,
        state: item.output ? 'completed' : 'running',
        artifact: item.artifact
      }
      toolCalls.push(toolCall)
      parts.push({ type: 'tool', tool: toolCall })

      if (toolCall.state === 'running') {
         if (toolCall.id) incompleteToolCalls.set(toolCall.id, toolCall)
         lastToolCall = toolCall
      }
    } else if (item.type === 'tool_input') {
      const id = item.tool_call_id || Date.now().toString()
      const toolCall: ToolCall = {
        id: id,
        name: item.tool,
        input: item.tool_input || {},
        state: 'running'
      }
      toolCalls.push(toolCall)
      parts.push({ type: 'tool', tool: toolCall })

      incompleteToolCalls.set(id, toolCall)
      lastToolCall = toolCall
    } else if (item.type === 'tool_output') {
       let toolCall: ToolCall | undefined

       if (item.tool_call_id) {
           toolCall = incompleteToolCalls.get(item.tool_call_id)
       }

       if (!toolCall && lastToolCall && lastToolCall.name === item.tool) {
           toolCall = lastToolCall
       }

       if (toolCall) {
           toolCall.output = item.tool_output
           toolCall.state = 'completed'
           if (item.artifact) {
               toolCall.artifact = item.artifact
           }
           if (toolCall.id) incompleteToolCalls.delete(toolCall.id)
       }
    } else if (item.type === 'ai_message') {
      if (item.content) {
        textContent += item.content
        const lastPart = parts[parts.length - 1]
        if (lastPart && lastPart.type === 'text') {
          lastPart.content = (lastPart.content || '') + item.content
        } else {
          parts.push({ type: 'text', content: item.content })
        }
      }
      if (item.tool_calls && Array.isArray(item.tool_calls)) {
        for (const tc of item.tool_calls) {
          const toolCall: ToolCall = {
            id: tc.id || Date.now().toString(),
            name: tc.name,
            input: tc.args || {},
            state: 'running'
          }
          toolCalls.push(toolCall)
          parts.push({ type: 'tool', tool: toolCall })
          incompleteToolCalls.set(toolCall.id, toolCall)
          lastToolCall = toolCall
        }
      }
    } else if (item.type === 'tool_message') {
       let toolCall: ToolCall | undefined
       if (item.tool_call_id) {
           toolCall = incompleteToolCalls.get(item.tool_call_id)
       }

       if (!toolCall && lastToolCall && lastToolCall.name === item.name) {
           toolCall = lastToolCall
       }

       if (toolCall) {
           toolCall.output = item.content
           toolCall.state = 'completed'
           if (item.artifact) {
               toolCall.artifact = item.artifact
           }
           if (toolCall.id) incompleteToolCalls.delete(toolCall.id)
       }
    } else if (item.type === 'deep_agent_state') {
      const subagentsMap = new Map<string, SubagentStreamInterface>()
      const subagentOrder: string[] = []

      for (const sa of (item.subagents || [])) {
        const saId = sa.id || Date.now().toString()
        subagentsMap.set(saId, {
          id: saId,
          status: sa.status || "complete",
          messages: [],
          thinking: "",
          result: sa.result,
          error: undefined,
          toolCall: {
            id: saId,
            name: "task",
            args: {
              description: sa.description || "",
              subagent_type: sa.subagent_type || "",
            },
          },
          startedAt: undefined,
          completedAt: undefined,
          parentMessageId: "coordinator",
          activeTools: [],
        })
        subagentOrder.push(saId)
      }

      const deepState: DeepAgentStreamState = {
        subagents: subagentsMap,
        subagentOrder,
        messageOrder: ["coordinator"],
        subagentsByMessage: { coordinator: subagentOrder },
        values: {
          todos: (Array.isArray(item.todos) ? item.todos : []).map((todo: any, index: number) => {
            const status = todo?.status === "in_progress" || todo?.status === "completed" ? todo.status : "pending"
            return {
              id: String(todo?.id ?? `todo-${index}`),
              content: String(todo?.content ?? todo?.description ?? todo?.title ?? ""),
              status,
            }
          }),
        },
        isComplete: true,
      }
      parts.push({ type: "deep_agent", deepAgent: deepState })

      if (item.coordinator_content) {
        textContent += item.coordinator_content
      }

      for (const tool of (item.coordinator_tools || [])) {
        const tc: ToolCall = {
          id: tool.id || Date.now().toString(),
          name: tool.name,
          input: tool.input || {},
          output: tool.output,
          state: 'completed',
          artifact: tool.artifact,
        }
        toolCalls.push(tc)
        parts.push({ type: 'tool', tool: tc })
      }
    } else if (item.type === 'image') {
      if (item.url) images.push({ image_url: item.url })
    } else if (item.type === 'user_image') {
      if (item.image_url) images.push({ image_url: item.image_url, filename: item.filename, file_type: item.file_type })
    } else if (item.type === 'document' || item.type === 'user_document') {
      documents.push(item)
    } else if (item.type === 'text' || item.type === 'assistant_message' || item.type === 'user_message') {
      const textVal = item.text || item.content || ""
      textContent += textVal
      const lastPart = parts[parts.length - 1]
      if (lastPart && lastPart.type === 'text') {
        lastPart.content = (lastPart.content || '') + textVal
      } else {
        parts.push({ type: 'text', content: textVal })
      }
    } else if (item.type === 'thinking') {
      parts.push({ type: 'thinking', content: item.thinking || item.content })
    }
  }

  return { toolCalls, content: textContent, images, documents, parts }
}
