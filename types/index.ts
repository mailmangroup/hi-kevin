// ============ User & Organization ============
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'editor' | 'viewer'
  preferences: UserPreferences
  createdAt: Date
}

export interface UserPreferences {
  language: 'en' | 'zh'
  notifications: boolean
  theme: 'light' | 'dark'
}

export interface Organization {
  id: string
  name: string
  logo?: string
  brandGuidelines?: BrandGuidelines
  connectedPlatforms: PlatformConnection[]
  createdAt: Date
}

export interface BrandGuidelines {
  primaryColor: string
  secondaryColor: string
  fonts: string[]
  toneOfVoice: string[]
  prohibitedWords: string[]
}

export interface PlatformConnection {
  platform: 'xiaohongshu' | 'douyin' | 'weibo' | 'wechat'
  accountId: string
  accountName: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: Date
}

// ============ Dashboard ============
export interface DashboardData {
  suggestions: Suggestion[]
  weeklyPerformance: PerformanceData
}

export interface Suggestion {
  id: string
  type: 'content_review' | 'lead_followup' | 'competitor_alert' | 'trend_opportunity'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionUrl: string
  actionLabel: string
  createdAt: Date
  metadata?: Record<string, any>
}

export interface PerformanceData {
  platforms: {
    platform: string
    color: string
    change: number
    engagement: number
  }[]
}

// ============ Content Agent ============
export interface ContentItem {
  id: string
  platform: 'xiaohongshu' | 'douyin' | 'weibo' | 'wechat'
  type: 'post' | 'video' | 'article' | 'story'
  status: 'idea' | 'draft' | 'review' | 'scheduled' | 'published'

  // Content
  title?: string
  body: string
  mediaUrls: string[]
  hashtags: string[]

  // Scheduling
  scheduledAt?: Date
  publishedAt?: Date

  // Brief (for AI generation)
  brief?: ContentBrief

  // Compliance
  complianceStatus: 'pending' | 'passed' | 'failed'
  complianceIssues?: ComplianceIssue[]

  // Performance (after publishing)
  performance?: ContentPerformance

  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ContentBrief {
  topic: string
  goal: string
  keyPoints: string[]
  tone: string
  targetAudience: string
  references?: string[]
}

export interface ComplianceIssue {
  type: 'prohibited_word' | 'claim_needs_evidence' | 'sensitive_topic' | 'brand_violation'
  severity: 'error' | 'warning'
  message: string
  location: { start: number; end: number }
  suggestedFix?: string
}

export interface ContentPerformance {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
}

// ============ Leads Agent ============
export interface Lead {
  id: string

  // Contact Info
  name: string
  title?: string
  company?: string
  email: string
  phone?: string
  linkedin?: string
  wechat?: string

  // Lead Status
  stage: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'won' | 'lost'
  source: string
  tags: string[]

  // Scoring
  score: number
  fitScore: number
  behaviorScore: number
  scoreBreakdown: ScoreItem[]

  // Activity
  activities: LeadActivity[]
  lastContactedAt?: Date
  nextFollowUpAt?: Date

  // AI Suggestions
  suggestedFollowUp?: string
  insights?: string

  // Ownership
  ownerId?: string

  createdAt: Date
  updatedAt: Date
}

export interface ScoreItem {
  factor: string
  points: number
  description: string
}

export interface LeadActivity {
  id: string
  type: 'email_open' | 'email_click' | 'page_visit' | 'form_submit' | 'meeting' | 'note' | 'call'
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}

// ============ Analytics Agent ============
export interface AnalyticsOverview {
  dateRange: { start: Date; end: Date }
  summary: {
    totalReach: number
    reachChange: number
    totalEngagement: number
    engagementChange: number
    followerGrowth: number
    followerChange: number
    postsPublished: number
  }
  platformBreakdown: PlatformMetrics[]
  dailyTrend: DailyMetric[]
  topContent: ContentPerformanceWithMeta[]
  competitorComparison: CompetitorMetric[]
}

export interface PlatformMetrics {
  platform: string
  followers: number
  reach: number
  engagement: number
  engagementRate: number
  change: number
}

export interface DailyMetric {
  date: Date
  platform: string
  reach: number
  engagement: number
}

export interface ContentPerformanceWithMeta extends ContentPerformance {
  id: string
  platform: string
  title: string
}

export interface CompetitorMetric {
  name: string
  shareOfVoice: number
  recentActivity: string
}

// ============ Research Agent ============
export interface Trend {
  id: string
  keyword: string
  platform: string
  rank?: number
  volume: number
  relevance: 'high' | 'medium' | 'low'
  category: string
  insight?: string
  suggestedContent?: string
  detectedAt: Date
}

export interface KOL {
  id: string
  name: string
  platform: string
  category: string[]
  tier: 'top' | 'mid' | 'micro' | 'nano'

  // Metrics
  followers: number
  avgEngagement: number
  engagementRate: number
  estimatedCPE: number

  // Audience
  audienceMatch: number
  audienceBreakdown: {
    gender: { male: number; female: number }
    ageGroups: Record<string, number>
    cities: Record<string, number>
  }

  // Analysis
  strengths: string[]
  recentContent: string[]
  previousBrandCollabs: string[]
  kevinNotes?: string

  // Contact
  contactInfo?: string
  status: 'available' | 'contacted' | 'negotiating' | 'contracted'
}

// ============ Campaign Agent ============
export interface Campaign {
  id: string
  name: string
  status: 'planning' | 'active' | 'paused' | 'completed'

  // Timeline
  startDate: Date
  endDate: Date

  // Goals
  goals: CampaignGoal[]

  // Progress
  progress: number

  // Budget
  budget: number
  spent: number

  // Checklist
  phases: CampaignPhase[]

  // Performance
  performance?: {
    reach: number
    engagement: number
    leads: number
    conversions: number
  }

  // AI Insights
  insights?: string[]
  recommendations?: string[]

  createdAt: Date
  updatedAt: Date
}

export interface CampaignGoal {
  metric: string
  target: number
  current: number
}

export interface CampaignPhase {
  name: string
  status: 'completed' | 'in_progress' | 'upcoming'
  tasks: CampaignTask[]
}

export interface CampaignTask {
  id: string
  title: string
  status: 'done' | 'in_progress' | 'pending'
  dueDate?: Date
  assignee?: string
}

// ============ Brand Safety Agent ============
export interface ComplianceAlert {
  id: string
  contentId: string
  contentTitle: string
  platform: string
  issues: ComplianceIssue[]
  status: 'pending' | 'resolved' | 'ignored'
  createdAt: Date
}

export interface SensitiveDate {
  date: Date
  name: string
  description: string
  avoidTopics: string[]
  recommendations: string[]
}
