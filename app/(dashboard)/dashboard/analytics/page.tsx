"use client"

import { PlatformBreakdown } from "@/components/analytics/platform-breakdown"
import { TrendAnalysis } from "@/components/analytics/trend-analysis"
import { ReportGenerator } from "@/components/analytics/report-generator"
import { KOLDatabase } from "@/components/analytics/kol-database"

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics & Research</h1>
        <p className="text-muted-foreground mt-2">
          Track performance across platforms and discover new growth opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 space-y-8">
          <PlatformBreakdown />
          <TrendAnalysis />
        </div>

        {/* Sidebar Tools */}
        <div className="space-y-6">
          <ReportGenerator />
          <KOLDatabase />
        </div>
      </div>
    </div>
  )
}
