import type { ContentItem, ContentBrief, ComplianceIssue } from "@/types"

export const mockContentItems: ContentItem[] = [
  {
    id: "draft-001",
    platform: "xiaohongshu",
    type: "post",
    status: "draft",
    title: "春季护肤必备好物分享",
    body: `姐妹们！春天来了，皮肤也要焕新啦～🌸

今天给大家分享我最近超爱的3个护肤小技巧，特别适合换季敏感肌！

1️⃣ 温和清洁是关键
早晚用氨基酸洁面，不要过度清洁哦～

2️⃣ 补水补水再补水
保湿精华+面膜，让皮肤喝饱水💧

3️⃣ 防晒千万别偷懒
春天紫外线也很强，SPF50+走起！

评论区说说你们的春季护肤心得吧～
#春季护肤 #敏感肌 #护肤分享`,
    mediaUrls: [],
    hashtags: ["春季护肤", "敏感肌", "护肤分享"],
    brief: {
      topic: "春季护肤",
      goal: "Product awareness & engagement",
      keyPoints: ["换季敏感", "产品成分优势", "用户互动"],
      tone: "Casual, friendly, 小红书风格",
      targetAudience: "Female 25-35, skincare enthusiasts",
    },
    complianceStatus: "passed",
    complianceIssues: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdBy: "kevin-ai",
  },
  {
    id: "draft-002",
    platform: "douyin",
    type: "video",
    status: "draft",
    title: "产品开箱视频脚本",
    body: `[抖音视频脚本]

0-3秒（Hook）：
"姐妹们！今天开箱一个超神奇的护肤品～"
[快速展示产品外包装，音效：开箱声]

3-15秒（Problem）：
"你们有没有这样的困扰？"
- 换季皮肤敏感泛红
- 用什么都刺痛
- 不知道怎么选产品
[展示常见皮肤问题图片]

15-45秒（Solution）：
"这款精华液真的救了我！"
- 成分：维C+玻尿酸
- 质地：清爽不油腻
- 效果：3天见效
[产品使用演示，before/after对比]

45-60秒（CTA）：
"评论区扣1，我抽3个姐妹送小样～"
"记得关注我，每天分享护肤干货！"
[点赞+关注动画]

#护肤好物 #开箱测评 #种草`,
    mediaUrls: [],
    hashtags: ["护肤好物", "开箱测评", "种草"],
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    brief: {
      topic: "产品开箱",
      goal: "Product launch & viral reach",
      keyPoints: ["Hook观众", "展示产品优势", "引导互动"],
      tone: "Energetic, fast-paced, 抖音风格",
      targetAudience: "Female 18-35, douyin users",
    },
    complianceStatus: "passed",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    createdBy: "kevin-ai",
  },
  {
    id: "draft-003",
    platform: "weibo",
    type: "post",
    status: "idea",
    title: "品牌活动预告",
    body: `🎉【活动预告】春季焕新季来啦！

3月1日-3月31日，我们准备了超多福利：
✨ 全场8折起
✨ 买2送1
✨ 免费试用装
✨ 抽奖送大礼包

关注+转发，抽10位幸运儿送春季限定礼盒🎁

#春季焕新 #品牌活动 #福利来袭`,
    mediaUrls: [],
    hashtags: ["春季焕新", "品牌活动", "福利来袭"],
    brief: {
      topic: "春季促销活动",
      goal: "Drive traffic & sales",
      keyPoints: ["活动时间", "优惠力度", "参与方式"],
      tone: "Exciting, promotional",
      targetAudience: "Existing customers & potential buyers",
    },
    complianceStatus: "pending",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdBy: "kevin-ai",
  },
]

export const mockComplianceIssues: ComplianceIssue[] = [
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
    message: '"100%有效" - 功效宣称需要提供证据支持',
    location: { start: 120, end: 127 },
    suggestedFix: "效果显著",
  },
]

// API functions
export async function getContentItems(
  filters?: {
    platform?: string
    status?: string
  }
): Promise<ContentItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  let items = mockContentItems

  if (filters?.platform) {
    items = items.filter((item) => item.platform === filters.platform)
  }

  if (filters?.status) {
    items = items.filter((item) => item.status === filters.status)
  }

  return items
}

export async function getContentItem(id: string): Promise<ContentItem | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockContentItems.find((item) => item.id === id) || null
}

export async function generateContentDraft(
  brief: ContentBrief,
  platform: string
): Promise<string> {
  // Simulate AI generation delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const sampleContent = {
    xiaohongshu: `姐妹们！${brief.topic}来啦～🌸\n\n${brief.keyPoints.join("\n")}\n\n评论区说说你的想法吧～`,
    douyin: `[Hook] ${brief.topic}\n[Problem] ${brief.keyPoints[0]}\n[Solution] ${brief.keyPoints[1]}\n[CTA] 记得点赞关注哦！`,
    weibo: `【${brief.topic}】\n\n${brief.keyPoints.join("\n")}\n\n转发+关注，参与互动～`,
    wechat: `## ${brief.topic}\n\n${brief.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n点击"阅读原文"了解更多`,
  }

  return sampleContent[platform as keyof typeof sampleContent] || `Content for ${platform}`
}

export async function checkCompliance(
  content: string
): Promise<ComplianceIssue[]> {
  // Simulate compliance check delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const issues: ComplianceIssue[] = []

  // Check for common prohibited words
  const prohibitedWords = ["最好", "第一", "最大", "最强", "100%"]
  prohibitedWords.forEach((word) => {
    const index = content.indexOf(word)
    if (index !== -1) {
      issues.push({
        type: "prohibited_word",
        severity: "error",
        message: `广告法禁用词："${word}" - 不得使用绝对化用语`,
        location: { start: index, end: index + word.length },
        suggestedFix: word === "最好" ? "优质的" : "优秀的",
      })
    }
  })

  return issues
}
