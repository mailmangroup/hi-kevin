import { Suspense } from "react"
import { DeepAgentChatInterface } from "@/components/chat/deep-agent-chat-interface"
import { LoadingState } from "@/components/ui/loading"

export default function DeepAgentChatPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { q?: string }
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <DeepAgentChatInterface
        chatId={params.id}
        initialMessage={searchParams.q}
      />
    </Suspense>
  )
}
