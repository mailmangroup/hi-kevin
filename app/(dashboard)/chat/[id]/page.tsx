import { ChatInterface } from "@/components/chat/chat-interface"

export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatInterface chatId={params.id} />
}
