import type { Lead, LeadActivity, ScoreItem } from "@/types"

const generateScoreBreakdown = (score: number): ScoreItem[] => {
  return [
    { factor: "Company size", points: Math.floor(score * 0.3), description: "Matches ICP" },
    { factor: "Job title", points: Math.floor(score * 0.2), description: "Decision maker" },
    { factor: "Engagement", points: Math.floor(score * 0.25), description: "High intent signals" },
    { factor: "Behavior", points: Math.floor(score * 0.25), description: "Active prospect" },
  ]
}

export const mockLeads: Lead[] = [
  {
    id: "lead-001",
    name: "张明",
    title: "Marketing Manager",
    company: "ABC Corp",
    email: "zhang@abc.com",
    phone: "+86 138****1234",
    linkedin: "linkedin.com/in/zhangming",
    wechat: "zhangming_abc",
    stage: "new",
    source: "Webinar signup",
    tags: ["Enterprise", "Tech", "Hot"],
    score: 72,
    fitScore: 40,
    behaviorScore: 32,
    scoreBreakdown: [
      { factor: "Company size 500+", points: 20, description: "Matches ICP" },
      { factor: "Title: Manager", points: 10, description: "Decision influencer" },
      { factor: "Downloaded whitepaper", points: 15, description: "High intent signal" },
      { factor: "Visited pricing page", points: 15, description: "Buying signal" },
      { factor: "Attended webinar", points: 12, description: "Engaged prospect" },
    ],
    activities: [
      {
        id: "act-001",
        type: "email_open",
        description: "Opened nurture email #3",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        id: "act-002",
        type: "page_visit",
        description: "Visited pricing page",
        metadata: { duration: "5m 23s" },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: "act-003",
        type: "form_submit",
        description: "Registered for webinar",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
    lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    nextFollowUpAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
    suggestedFollowUp:
      "Hi 张经理，感谢您参加上周的webinar！注意到您对我们的定价方案很感兴趣，不知道您现在方便聊几分钟吗？我可以给您详细介绍一下我们针对企业客户的专属方案。",
    insights:
      "High-intent lead showing buying signals. Company is in growth phase and likely evaluating solutions. Best approach: Focus on enterprise features and ROI.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: "lead-002",
    name: "李娜",
    title: "Digital Marketing Director",
    company: "XYZ Inc",
    email: "lina@xyz.com",
    phone: "+86 139****5678",
    stage: "contacted",
    source: "LinkedIn outreach",
    tags: ["Enterprise", "Marketing", "Warm"],
    score: 58,
    fitScore: 35,
    behaviorScore: 23,
    scoreBreakdown: generateScoreBreakdown(58),
    activities: [
      {
        id: "act-004",
        type: "email_open",
        description: "Opened initial outreach email",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: "act-005",
        type: "meeting",
        description: "Discovery call scheduled",
        metadata: { scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
    lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    suggestedFollowUp:
      "Hi Lisa, looking forward to our call on Thursday! I've prepared a brief demo focused on the marketing automation features you mentioned. Let me know if there's anything specific you'd like to discuss.",
    insights:
      "Responsive lead, showing genuine interest. Has budget authority and is actively looking for solutions. Meeting scheduled - prepare case studies.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lead-003",
    name: "王伟",
    title: "VP of Marketing",
    company: "MNO Ltd",
    email: "wangwei@mno.com",
    phone: "+86 136****9012",
    stage: "qualified",
    source: "Trade show",
    tags: ["Enterprise", "Decision Maker", "Hot"],
    score: 85,
    fitScore: 45,
    behaviorScore: 40,
    scoreBreakdown: generateScoreBreakdown(85),
    activities: [
      {
        id: "act-006",
        type: "meeting",
        description: "Product demo completed",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        id: "act-007",
        type: "email_click",
        description: "Clicked pricing link in proposal",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      },
      {
        id: "act-008",
        type: "form_submit",
        description: "Requested trial access",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ],
    lastContactedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    nextFollowUpAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    suggestedFollowUp:
      "Hi 王总，感谢您今天参加产品演示！根据您的需求，我整理了一份针对贵公司的定制方案和ROI分析。方便的话，我们明天可以快速过一下这份方案吗？",
    insights:
      "Hot lead with high buying intent. VP-level decision maker who attended demo and requested trial. Strong fit for enterprise package. Push for close.",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: "lead-004",
    name: "陈静",
    title: "Marketing Specialist",
    company: "DEF Company",
    email: "chenjing@def.com",
    stage: "new",
    source: "Content download",
    tags: ["SMB", "Marketing"],
    score: 42,
    fitScore: 20,
    behaviorScore: 22,
    scoreBreakdown: generateScoreBreakdown(42),
    activities: [
      {
        id: "act-009",
        type: "form_submit",
        description: "Downloaded ebook",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
    nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    suggestedFollowUp:
      "Hi 陈静，谢谢下载我们的营销自动化指南！看到您对内容营销很感兴趣，我们正好有一个针对中小企业的解决方案，可以帮助您提升3倍效率。方便的话，我可以给您简单介绍一下吗？",
    insights: "Early-stage lead from SMB segment. Lower priority but worth nurturing with automated sequences.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lead-005",
    name: "赵强",
    title: "CMO",
    company: "GHI Group",
    email: "zhaoqiang@ghi.com",
    phone: "+86 137****3456",
    stage: "contacted",
    source: "Referral",
    tags: ["Enterprise", "C-Level", "Hot"],
    score: 78,
    fitScore: 42,
    behaviorScore: 36,
    scoreBreakdown: generateScoreBreakdown(78),
    activities: [
      {
        id: "act-010",
        type: "call",
        description: "Initial discovery call",
        metadata: { duration: "30 minutes", outcome: "positive" },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: "act-011",
        type: "email_open",
        description: "Opened follow-up email",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
    lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    suggestedFollowUp:
      "Hi 赵总，上次通话后我们整理了几个相关案例，包括同行业的成功实施经验。这周五下午您方便的话，我们可以深入聊聊具体的合作方案？",
    insights:
      "C-level referral with strong buying power. Referred by existing customer. High potential for large deal. Prioritize this lead.",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
]

// API functions
export async function getLeads(filters?: {
  stage?: string
  tags?: string[]
}): Promise<Lead[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  let leads = mockLeads

  if (filters?.stage) {
    leads = leads.filter((lead) => lead.stage === filters.stage)
  }

  if (filters?.tags && filters.tags.length > 0) {
    leads = leads.filter((lead) =>
      filters.tags!.some((tag) => lead.tags.includes(tag))
    )
  }

  return leads
}

export async function getLead(id: string): Promise<Lead | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockLeads.find((lead) => lead.id === id) || null
}

export async function updateLeadStage(
  id: string,
  stage: Lead["stage"]
): Promise<Lead | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const lead = mockLeads.find((l) => l.id === id)
  if (lead) {
    lead.stage = stage
    lead.updatedAt = new Date()
  }
  return lead || null
}

export async function generateFollowUp(leadId: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const lead = mockLeads.find((l) => l.id === leadId)
  return (
    lead?.suggestedFollowUp ||
    "Hi there, following up on our previous conversation. Would love to discuss next steps!"
  )
}
