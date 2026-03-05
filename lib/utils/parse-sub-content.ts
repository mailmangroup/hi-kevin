import type { ContentPart, ToolCall, Message } from "@/components/chat/chat-interface"
import type { DeepAgentData, ResearchTask } from "@/components/chat/deep-agent-display"

export function parseSubContentList(subContentList: any[] = []): {
  toolCalls: ToolCall[],
  content: string,
  images: string[],
  documents: any[],
  contentParts: ContentPart[]
} {
  const toolCalls: ToolCall[] = []
  const images: string[] = []
  const documents: any[] = []
  const contentParts: ContentPart[] = []
  const incompleteToolCalls = new Map<string, ToolCall>()
  let lastToolCall: ToolCall | null = null
  let textContent = ""
  let deepAgentData: DeepAgentData | null = null
  let deepAgentInsertIndex: number | null = null

  if (!Array.isArray(subContentList)) {
    return { toolCalls, content: textContent, images, documents, contentParts }
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
      contentParts.push({ type: 'tool', tool: toolCall })

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
      contentParts.push({ type: 'tool', tool: toolCall })

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
    } else if (item.type === 'image') {
      if (item.url) images.push(item.url)
    } else if (item.type === 'user_image') {
      if (item.image_url) images.push(item.image_url)
    } else if (item.type === 'document' || item.type === 'user_document') {
      documents.push(item)
    } else if (item.type === 'text' || item.type === 'assistant_message' || item.type === 'user_message') {
      textContent += item.text || item.content || ""
      contentParts.push({ type: 'text', content: item.text || item.content })
    } else if (item.type === 'thinking') {
      contentParts.push({ type: 'thinking', content: item.thinking || item.content })
    } else if (item.type === 'research_task') {
      if (!deepAgentData) {
        deepAgentData = { tasks: {}, taskOrder: [], isComplete: true }
        deepAgentInsertIndex = contentParts.length
      }
      const task: ResearchTask = {
        id: item.task_id,
        description: item.description || item.task_id,
        status: item.status || "completed",
        result: item.result,
        error: item.error,
      }
      deepAgentData.tasks[item.task_id] = task
      if (!deepAgentData.taskOrder.includes(item.task_id)) {
        deepAgentData.taskOrder.push(item.task_id)
      }
    }
  }

  if (deepAgentData) {
    const insertAt = deepAgentInsertIndex ?? contentParts.length
    contentParts.splice(insertAt, 0, { type: 'deep_agent', deepAgent: deepAgentData })
  }

  return { toolCalls, content: textContent, images, documents, contentParts }
}
