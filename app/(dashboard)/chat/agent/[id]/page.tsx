import { Suspense } from "react"
import { AgentChatInterface } from "@/components/chat/agent-chat-interface"
import { LoadingState } from "@/components/ui/loading"

export default function AgentChatPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { q?: string }
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <AgentChatInterface
        chatId={params.id}
        initialMessage={searchParams.q}
      />
    </Suspense>
  )
}
