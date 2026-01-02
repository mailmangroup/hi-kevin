import type { ComplianceAlert, SensitiveDate, BrandGuidelines, ComplianceIssue } from "@/types"

export const mockComplianceAlerts: ComplianceAlert[] = [
  {
    id: "alert-001",
    contentId: "draft-001",
    contentTitle: "春季护肤必备好物分享",
    platform: "xiaohongshu",
    issues: [
      {
        type: "prohibited_word",
        severity: "error",
        message: '广告法禁用词："最好的" - 不得使用绝对化用语',
        location: { start: 45, end: 48 },
        suggestedFix: "深受好评的",
      },
      {
        type: "claim_needs_evidence",
        severity: "warning",
        message: '"3天见效" - 功效宣称需要提供证据支持',
        location: { start: 120, end: 127 },
        suggestedFix: "效果显著",
      },
    ],
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "alert-002",
    contentId: "draft-002",
    contentTitle: "产品开箱视频脚本",
    platform: "douyin",
    issues: [
      {
        type: "brand_violation",
        severity: "error",
        message: "品牌色调使用不符合规范 - 使用了竞品主色调",
        location: { start: 0, end: 0 },
        suggestedFix: "使用品牌主色 #6366F1",
      },
    ],
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "alert-003",
    contentId: "draft-003",
    contentTitle: "品牌活动预告",
    platform: "weibo",
    issues: [
      {
        type: "sensitive_topic",
        severity: "warning",
        message: "内容可能涉及敏感日期 - 3月1日临近敏感纪念日",
        location: { start: 0, end: 0 },
        suggestedFix: "建议调整活动时间或避免敏感话题",
      },
    ],
    status: "pending",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

export const mockSensitiveDates: SensitiveDate[] = [
  {
    date: new Date(2026, 2, 1), // March 1
    name: "敏感纪念日",
    description: "历史纪念日，建议避免发布商业推广内容",
    avoidTopics: ["促销活动", "产品推广", "品牌宣传"],
    recommendations: [
      "暂停商业推广内容",
      "可发布公益或教育类内容",
      "保持低调的品牌形象",
    ],
  },
  {
    date: new Date(2026, 3, 4), // April 4
    name: "清明节",
    description: "传统节日，建议避免过于欢快的营销内容",
    avoidTopics: ["庆祝活动", "狂欢促销"],
    recommendations: [
      "使用庄重的语调",
      "可发布文化传承相关内容",
      "避免过度商业化",
    ],
  },
  {
    date: new Date(2026, 4, 1), // May 1
    name: "劳动节",
    description: "法定节假日，适合发布相关主题内容",
    avoidTopics: [],
    recommendations: [
      "可发布致敬劳动者的内容",
      "适合品牌价值观传播",
      "避免纯促销内容",
    ],
  },
  {
    date: new Date(2026, 5, 1), // June 1
    name: "儿童节",
    description: "适合发布面向家庭和儿童的内容",
    avoidTopics: ["成人产品推广"],
    recommendations: [
      "可发布家庭友好内容",
      "适合亲子产品推广",
      "注意内容适宜性",
    ],
  },
  {
    date: new Date(2026, 8, 18), // September 18
    name: "九一八事变纪念日",
    description: "历史纪念日，建议避免发布商业内容",
    avoidTopics: ["所有商业推广"],
    recommendations: [
      "暂停所有商业推广",
      "可发布历史教育内容",
      "保持肃穆的品牌形象",
    ],
  },
  {
    date: new Date(2026, 9, 1), // October 1
    name: "国庆节",
    description: "重要节日，适合发布爱国主题内容",
    avoidTopics: ["负面话题"],
    recommendations: [
      "可发布爱国主题内容",
      "适合品牌价值观传播",
      "注意内容正面性",
    ],
  },
]

export const mockBrandGuidelines: BrandGuidelines = {
  primaryColor: "#6366F1",
  secondaryColor: "#8B5CF6",
  fonts: ["Inter", "PingFang SC"],
  toneOfVoice: [
    "专业但友好",
    "简洁明了",
    "避免过度营销",
    "尊重用户",
  ],
  prohibitedWords: [
    "最好",
    "第一",
    "最大",
    "最强",
    "100%",
    "绝对",
    "唯一",
    "独家",
  ],
}

// API functions
export async function getComplianceAlerts(
  filters?: {
    status?: "pending" | "resolved" | "ignored"
    platform?: string
  }
): Promise<ComplianceAlert[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  let alerts = mockComplianceAlerts

  if (filters?.status) {
    alerts = alerts.filter((alert) => alert.status === filters.status)
  }

  if (filters?.platform) {
    alerts = alerts.filter((alert) => alert.platform === filters.platform)
  }

  return alerts
}

export async function getSensitiveDates(
  startDate?: Date,
  endDate?: Date
): Promise<SensitiveDate[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  let dates = mockSensitiveDates

  if (startDate) {
    dates = dates.filter((date) => date.date >= startDate)
  }

  if (endDate) {
    dates = dates.filter((date) => date.date <= endDate)
  }

  return dates
}

export async function getBrandGuidelines(): Promise<BrandGuidelines> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockBrandGuidelines
}

export async function checkBrandGuidelines(
  content: string
): Promise<ComplianceIssue[]> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  const issues: ComplianceIssue[] = []
  const guidelines = mockBrandGuidelines

  // Check for prohibited words
  guidelines.prohibitedWords.forEach((word) => {
    const index = content.indexOf(word)
    if (index !== -1) {
      issues.push({
        type: "prohibited_word",
        severity: "error",
        message: `品牌规范禁用词："${word}"`,
        location: { start: index, end: index + word.length },
        suggestedFix: "请使用符合品牌调性的替代词汇",
      })
    }
  })

  return issues
}

export async function updateAlertStatus(
  alertId: string,
  status: "pending" | "resolved" | "ignored"
): Promise<ComplianceAlert> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const alert = mockComplianceAlerts.find((a) => a.id === alertId)
  if (!alert) {
    throw new Error("Alert not found")
  }

  alert.status = status
  return alert
}


