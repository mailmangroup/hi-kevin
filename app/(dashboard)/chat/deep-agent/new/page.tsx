import { Suspense } from "react"
import { DeepAgentChatInterface } from "@/components/chat/deep-agent-chat-interface"
import { LoadingState } from "@/components/ui/loading"

export default function NewDeepAgentChatPage({
  searchParams,
}: {
  searchParams: { q?: string; projectId?: string }
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <DeepAgentChatInterface
        initialMessage={searchParams.q}
        projectId={searchParams.projectId}
      />
    </Suspense>
  )
}
