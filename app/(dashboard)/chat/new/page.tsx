import { Suspense } from "react"
import { ChatInterface } from "@/components/chat/chat-interface"
import { LoadingState } from "@/components/ui/loading"

export default function NewChatPage({
  searchParams,
}: {
  searchParams: { q?: string; projectId?: string }
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ChatInterface
        initialMessage={searchParams.q}
        projectId={searchParams.projectId}
      />
    </Suspense>
  )
}
