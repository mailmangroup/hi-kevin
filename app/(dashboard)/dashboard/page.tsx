import { StatsCards } from "@/components/dashboard/stats-cards"
import { SuggestionsList } from "@/components/dashboard/suggestions-list"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { getDashboardData } from "@/lib/mock"
import { ChatInput } from "@/components/dashboard/chat-input"

export default async function DashboardPage() {
  const dashboardData = await getDashboardData()

  return (
    <div className="space-y-8">
      {/* Chat Input Section */}
      <ChatInput />

      {/* Stats Cards */}
      <StatsCards stats={dashboardData.stats} />

      {/* Kevin's Suggestions */}
      <SuggestionsList suggestions={dashboardData.suggestions} />

      {/* This Week's Performance */}
      <PerformanceChart data={dashboardData.weeklyPerformance} />
    </div>
  )
}
