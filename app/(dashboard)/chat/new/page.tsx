import { ChatInterface } from "@/components/chat/chat-interface"

export default function NewChatPage({
  searchParams,
}: {
  searchParams: { q?: string; projectId?: string }
}) {
  return (
    <ChatInterface
      initialMessage={searchParams.q}
      projectId={searchParams.projectId}
    />
  )
}
