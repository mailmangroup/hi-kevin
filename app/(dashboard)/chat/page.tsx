import { ConversationList } from "@/components/chat/conversation-list"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Chat History",
  description: "View your past conversations with Kevin.",
}

export default function ChatHistoryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Chat History</h2>
          <Link href="/dashboard" prefetch={false}>
            <Button className="gap-2 shadow-sm hover:shadow-md transition-all">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </Link>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <ConversationList />
        </Suspense>
      </div>
    </div>
  )
}
