"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/ui/loading"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Video,
  Image as ImageIcon,
  Calendar,
  Hash,
  MoreVertical,
  Send,
  Edit,
  Trash2,
} from "lucide-react"
import { getContentItem } from "@/lib/mock/content"
import { formatDate } from "@/lib/utils/date"
import type { ContentItem } from "@/types"

const platformColors: Record<ContentItem["platform"], string> = {
  xiaohongshu: "bg-[#FF2442]",
  douyin: "bg-black",
  weibo: "bg-[#E6162D]",
  wechat: "bg-[#07C160]",
}

const platformNames: Record<ContentItem["platform"], string> = {
  xiaohongshu: "小红书",
  douyin: "抖音",
  weibo: "微博",
  wechat: "微信",
}

const statusColors: Record<ContentItem["status"], string> = {
  idea: "bg-gray-100 text-gray-700",
  draft: "bg-blue-100 text-blue-700",
  review: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-purple-100 text-purple-700",
  published: "bg-green-100 text-green-700",
}

const complianceColors: Record<ContentItem["complianceStatus"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
}

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contentId = params.id as string

  const [content, setContent] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)

  const loadContent = async () => {
    setLoading(true)
    try {
      const data = await getContentItem(contentId)
      setContent(data)
    } catch (error) {
      console.error("Failed to load content:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId])

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <LoadingState message="Loading content draft..." />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">Content not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/content")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Content
        </Button>
      </div>
    )
  }

  const getTypeIcon = (type: ContentItem["type"]) => {
    switch (type) {
      case "post":
        return <FileText className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "article":
        return <FileText className="h-4 w-4" />
      case "story":
        return <ImageIcon className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/content")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">{content.title || "Untitled Draft"}</h1>
              <Badge className={statusColors[content.status]}>
                {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${platformColors[content.platform]}`} />
              <span>{platformNames[content.platform]}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {getTypeIcon(content.type)}
                {content.type}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          {content.status === "draft" && (
            <Button variant="default" size="sm">
              <Send className="h-4 w-4" />
              Submit for Review
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Content Preview */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Content Preview</h3>
              <Badge className={complianceColors[content.complianceStatus]}>
                {content.complianceStatus === "passed" && (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                {content.complianceStatus === "failed" && (
                  <XCircle className="mr-1 h-3 w-3" />
                )}
                {content.complianceStatus === "pending" && (
                  <Clock className="mr-1 h-3 w-3" />
                )}
                Compliance: {content.complianceStatus.charAt(0).toUpperCase() + content.complianceStatus.slice(1)}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.body}</p>
              </div>

              {content.hashtags.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    Hashtags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {content.mediaUrls.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Media</div>
                  <div className="grid grid-cols-2 gap-2">
                    {content.mediaUrls.map((url, index) => (
                      <div key={index} className="aspect-video rounded-lg bg-muted" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Compliance Issues */}
          {content.complianceIssues && content.complianceIssues.length > 0 && (
            <Card className="p-6 border-yellow-200 bg-yellow-50/50">
              <h3 className="mb-4 text-lg font-semibold text-yellow-900">Compliance Issues</h3>
              <div className="space-y-3">
                {content.complianceIssues.map((issue, index) => (
                  <div key={index} className="rounded-lg border border-yellow-200 bg-white p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge
                        variant={issue.severity === "error" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {issue.type.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Position {issue.location.start}-{issue.location.end}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{issue.message}</p>
                    {issue.suggestedFix && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Suggestion: {issue.suggestedFix}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Content Details */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Content Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Platform</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${platformColors[content.platform]}`} />
                  <p className="text-sm font-medium text-foreground">
                    {platformNames[content.platform]}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="mt-1 text-sm font-medium text-foreground capitalize">{content.type}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={statusColors[content.status]}>{content.status}</Badge>
              </div>

              {content.scheduledAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(content.scheduledAt)}
                    </p>
                  </div>
                </div>
              )}

              {content.publishedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(content.publishedAt)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatDate(content.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatDate(content.updatedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Created By</p>
                <p className="mt-1 text-sm font-medium text-foreground">{content.createdBy}</p>
              </div>
            </div>
          </Card>

          {/* Content Brief */}
          {content.brief && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Content Brief</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Topic</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{content.brief.topic}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{content.brief.goal}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Key Points</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {content.brief.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-foreground">{point}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tone</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{content.brief.tone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Audience</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {content.brief.targetAudience}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

