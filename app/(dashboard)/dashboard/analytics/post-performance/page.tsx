"use client"

import { useEffect, useState } from "react"
import { PlatformBreakdown } from "@/components/analytics/platform-breakdown"
import { TrendAnalysis } from "@/components/analytics/trend-analysis"
import { ReportGenerator } from "@/components/analytics/report-generator"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { LoadingState } from "@/components/ui/loading"
import { ErrorBanner } from "@/components/ui/error-banner"
import { analyticsService, type AnalyticsData } from "@/lib/api/analytics"
import { DEFAULT_DATE_RANGE_DAYS, COMPARISON_PERIOD_DAYS } from "@/lib/constants/analytics"
import { createClient } from '@/lib/supabase/client'

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Date range state (default: last 7 days)
  const [dateRange] = useState(() => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    
    return {
      start: new Date(now - DEFAULT_DATE_RANGE_DAYS * oneDay),
      end: new Date(now),
      // Shift previous period back by 1 day to avoid overlap with current period start date
      // Current: [now-7, now]
      // Previous: [now-15, now-8] (Both 8 days inclusive)
      previousStart: new Date(now - (DEFAULT_DATE_RANGE_DAYS + COMPARISON_PERIOD_DAYS + 1) * oneDay),
      previousEnd: new Date(now - (DEFAULT_DATE_RANGE_DAYS + 1) * oneDay)
    }
  })

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get user profile to check for brand ID
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
           // Should be handled by middleware, but just in case
           throw new Error("User not authenticated")
        }

        const { data: profile } = await supabase
          .from('user_kawo_credentials')
          .select('kawo_brand_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!profile?.kawo_brand_id) {
          setError(new Error('Brand ID not found. Please configure KAWO credentials.'))
          setIsLoading(false)
          return
        }

        const data = await analyticsService.getAnalyticsData(
          profile.kawo_brand_id,
          dateRange
        )

        setAnalyticsData(data)
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('Analytics error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load analytics'))
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [dateRange])

  if (isLoading) {
    return <LoadingState message="Loading analytics..." />
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorBanner
          title="Analytics Unavailable"
          message={error.message}
          action={{
            label: "Go to Settings",
            onClick: () => window.location.href = '/dashboard/settings'
          }}
        />
      </div>
    )
  }

  if (!analyticsData) {
    return <div className="p-8">No analytics data available</div>
  }

  return (
    <div className="space-y-8 p-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Post Performance Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Track performance across platforms and discover new growth opportunities.
        </p>
      </div>

      {/* Performance Chart */}
      <PerformanceChart data={{
        platforms: analyticsData.platformPerformance
      }} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 space-y-8">
          <PlatformBreakdown 
            engagementData={analyticsData.weeklyEngagement}
          />
          <TrendAnalysis 
            growthData={analyticsData.growthTrajectory}
          />
        </div>

        {/* Sidebar Tools */}
        <div className="space-y-6">
          <ReportGenerator />
        </div>
      </div>
    </div>
  )
}
