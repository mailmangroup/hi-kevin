"use client"

import { ChatInterface } from "@/components/chat/chat-interface"

interface DeepAgentChatInterfaceProps {
  initialMessage?: string
  chatId?: string
  projectId?: string
}

export function DeepAgentChatInterface(props: DeepAgentChatInterfaceProps) {
  return <ChatInterface {...props} conversationMode="deep_agent" />
}
