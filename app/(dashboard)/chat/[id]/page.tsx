import { Suspense } from "react"
import { ChatInterface } from "@/components/chat/chat-interface"
import { LoadingState } from "@/components/ui/loading"

export default function ChatPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { q?: string }
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ChatInterface chatId={params.id} initialMessage={searchParams.q} />
    </Suspense>
  )
}
