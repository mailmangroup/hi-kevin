import type { DashboardData, Suggestion } from "@/types"

const suggestions: Suggestion[] = [
  {
    id: "sug-001",
    type: "content_review",
    priority: "high",
    title: "Review Xiaohongshu post draft",
    description:
      '春季护肤必备好物分享 - Generated 2 hours ago, waiting for your approval',
    actionUrl: "/dashboard/content/draft-001",
    actionLabel: "Review",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    metadata: {
      platform: "xiaohongshu",
      contentId: "draft-001",
    },
  },
  {
    id: "sug-002",
    type: "lead_followup",
    priority: "medium",
    title: "Lead needs follow-up",
    description:
      "张经理@ABC Corp hasn't been contacted for 3 days. Kevin has prepared a follow-up message.",
    actionUrl: "/dashboard/leads/lead-001",
    actionLabel: "View Lead",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    metadata: {
      leadId: "lead-001",
      leadName: "张经理",
      company: "ABC Corp",
    },
  },
  {
    id: "sug-003",
    type: "competitor_alert",
    priority: "low",
    title: "Competitor viral content detected",
    description:
      "Brand X posted content that got 50K+ engagement yesterday. Analysis available.",
    actionUrl: "/dashboard/research?tab=competitors",
    actionLabel: "See Analysis",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    metadata: {
      competitor: "Brand X",
      engagement: 50000,
    },
  },
]

export const mockDashboardData: DashboardData = {
  suggestions,
  weeklyPerformance: {
    platforms: [
      {
        platform: "小红书",
        color: "#FF2442",
        engagement: 3420,
        change: 12,
      },
      {
        platform: "抖音",
        color: "#000000",
        engagement: 2150,
        change: -3,
      },
      {
        platform: "微博",
        color: "#E6162D",
        engagement: 1890,
        change: 8,
      },
      {
        platform: "微信",
        color: "#07C160",
        engagement: 980,
        change: 0,
      },
    ],
  },
}

// Simulate API delay
export async function getDashboardData(): Promise<DashboardData> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockDashboardData
}
