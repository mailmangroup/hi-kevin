import { SuggestionsList } from "@/components/dashboard/suggestions-list"
import { getDashboardData } from "@/lib/mock"
import { ChatInput } from "@/components/dashboard/chat-input"

export default async function DashboardPage() {
  const dashboardData = await getDashboardData()

  return (
    <div className="space-y-10">
      {/* Chat Input Section */}
      <ChatInput />

      {/* Kevin's Suggestions */}
      <SuggestionsList suggestions={dashboardData.suggestions} />
    </div>
  )
}
