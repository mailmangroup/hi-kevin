"use client"

import { ChatInterface } from "@/components/chat/chat-interface"

interface AgentChatInterfaceProps {
  initialMessage?: string
  chatId?: string
  projectId?: string
}

export function AgentChatInterface(props: AgentChatInterfaceProps) {
  return <ChatInterface {...props} conversationMode="agent" />
}
