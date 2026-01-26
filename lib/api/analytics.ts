import { directApiCall } from './client'

export interface AnalyticsDateRange {
  start: Date
  end: Date
  previousStart?: Date
  previousEnd?: Date
}

export interface PlatformMetrics {
  network: string           // xhs, douyin, sweibo, wechat
  displayName: string       // 小红书, 抖音, 微博, 微信
  platform: string          // Alias for displayName (for compatibility with PerformanceChart)
  posts: number
  likes: number
  comments: number
  shares: number
  views: number
  engagement: number        // Total engagement
  change: number           // % change vs previous period
  color: string            // UI color
}

export interface WeeklyEngagement {
  day: string              // Mon, Tue, Wed, etc
  likes: number
  comments: number
  shares: number
}

export interface GrowthDataPoint {
  month: string
  followers: number | null
  reach: number | null
}

export interface AnalyticsData {
  platformPerformance: PlatformMetrics[]
  weeklyEngagement: WeeklyEngagement[]
  growthTrajectory: GrowthDataPoint[]
}

interface AnalyticsDashboardResponse {
  success: boolean
  data: AnalyticsData
  message?: string
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

export const analyticsService = {
  /**
   * Get comprehensive analytics data for the dashboard
   */
  async getAnalyticsData(
    brandId: string,
    dateRange: AnalyticsDateRange
  ): Promise<AnalyticsData> {
    const { start, end, previousStart, previousEnd } = dateRange

    // Format dates
    const dateStart = formatDate(start)
    const dateEnd = formatDate(end)
    const prevDateStart = previousStart ? formatDate(previousStart) : undefined
    const prevDateEnd = previousEnd ? formatDate(previousEnd) : undefined

    // Build query params
    const params = new URLSearchParams({
      brand_id: brandId,
      date_start: dateStart,
      date_end: dateEnd
    })

    if (prevDateStart) params.append('prev_date_start', prevDateStart)
    if (prevDateEnd) params.append('prev_date_end', prevDateEnd)

    // Call backend analytics endpoint
    const response = await directApiCall<AnalyticsDashboardResponse>(
      `analytics/dashboard?${params.toString()}`
    )

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch analytics')
    }

    // Backend now returns the transformed data directly
    return response.data
  }
}
