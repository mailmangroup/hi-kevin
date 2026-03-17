import type { ContentPart, ToolCall } from "@/components/chat/chat-interface"

export function parseSubContentList(subContentList: any[] = []): {
  toolCalls: ToolCall[],
  content: string,
  images: Array<{ image_url: string; filename?: string; file_type?: string }>,
  documents: any[],
  contentParts: ContentPart[]
} {
  const toolCalls: ToolCall[] = []
  const images: Array<{ image_url: string; filename?: string; file_type?: string }> = []
  const documents: any[] = []
  const contentParts: ContentPart[] = []
  const incompleteToolCalls = new Map<string, ToolCall>()
  let lastToolCall: ToolCall | null = null
  let textContent = ""

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
    } else if (item.type === 'ai_message') {
      if (item.content) {
        textContent += item.content
        // Merge consecutive text parts so markdown parses with full context
        const lastPart = contentParts[contentParts.length - 1]
        if (lastPart && lastPart.type === 'text') {
          lastPart.content = (lastPart.content || '') + item.content
        } else {
          contentParts.push({ type: 'text', content: item.content })
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
          contentParts.push({ type: 'tool', tool: toolCall })
          incompleteToolCalls.set(toolCall.id, toolCall)
          lastToolCall = toolCall
        }
      }
    } else if (item.type === 'tool_message') {
       let toolCall: ToolCall | undefined
       if (item.tool_call_id) {
           toolCall = incompleteToolCalls.get(item.tool_call_id)
       }
       
       // Fallback for missing ID if sequential
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
    } else if (item.type === 'image') {
      if (item.url) images.push({ image_url: item.url })
    } else if (item.type === 'user_image') {
      if (item.image_url) images.push({ image_url: item.image_url, filename: item.filename, file_type: item.file_type })
    } else if (item.type === 'document' || item.type === 'user_document') {
      documents.push(item)
    } else if (item.type === 'text' || item.type === 'assistant_message' || item.type === 'user_message') {
      const textVal = item.text || item.content || ""
      textContent += textVal
      // Merge consecutive text parts so markdown parses with full context
      const lastPart = contentParts[contentParts.length - 1]
      if (lastPart && lastPart.type === 'text') {
        lastPart.content = (lastPart.content || '') + textVal
      } else {
        contentParts.push({ type: 'text', content: textVal })
      }
    } else if (item.type === 'thinking') {
      contentParts.push({ type: 'thinking', content: item.thinking || item.content })
    }
  }

  return { toolCalls, content: textContent, images, documents, contentParts }
}
