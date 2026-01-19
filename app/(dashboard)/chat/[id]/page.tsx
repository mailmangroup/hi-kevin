import { ChatInterface } from "@/components/chat/chat-interface"

export default function ChatPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { q?: string }
}) {
  return <ChatInterface chatId={params.id} initialMessage={searchParams.q} />
}
