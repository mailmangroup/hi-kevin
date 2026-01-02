import { StatsCards } from "@/components/dashboard/stats-cards"
import { SuggestionsList } from "@/components/dashboard/suggestions-list"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { getDashboardData } from "@/lib/mock"

export default async function DashboardPage() {
  const dashboardData = await getDashboardData()

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Good morning, Jeremy 👋</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Here&apos;s what needs your attention today
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={dashboardData.stats} />

      {/* Kevin's Suggestions */}
      <SuggestionsList suggestions={dashboardData.suggestions} />

      {/* This Week's Performance */}
      <PerformanceChart data={dashboardData.weeklyPerformance} />
    </div>
  )
}
