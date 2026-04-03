import { Suspense } from "react"
import { AgentChatInterface } from "@/components/chat/agent-chat-interface"
import { LoadingState } from "@/components/ui/loading"

export default function NewAgentChatPage({
  searchParams,
}: {
  searchParams: { q?: string; projectId?: string }
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <AgentChatInterface
        key="agent-new"
        initialMessage={searchParams.q}
        projectId={searchParams.projectId}
      />
    </Suspense>
  )
}
