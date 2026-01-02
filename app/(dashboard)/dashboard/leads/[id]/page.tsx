"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/ui/loading"
import { ScoreBreakdown } from "@/components/leads/score-breakdown"
import { ActivityTimeline } from "@/components/leads/activity-timeline"
import { AIFollowUp } from "@/components/leads/ai-follow-up"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Linkedin,
  MessageCircle,
  Calendar,
  MoreVertical,
} from "lucide-react"
import { getLead } from "@/lib/mock/leads"
import { formatDate } from "@/lib/utils/date"
import type { Lead } from "@/types"

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLead()
  }, [leadId])

  const loadLead = async () => {
    setLoading(true)
    try {
      const data = await getLead(leadId)
      setLead(data)
    } catch (error) {
      console.error("Failed to load lead:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <LoadingState message="Loading lead details..." />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">Lead not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/leads")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Button>
      </div>
    )
  }

  const stageColors: Record<Lead["stage"], string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-purple-100 text-purple-700",
    qualified: "bg-green-100 text-green-700",
    negotiation: "bg-orange-100 text-orange-700",
    won: "bg-emerald-100 text-emerald-700",
    lost: "bg-gray-100 text-gray-700",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{lead.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {lead.title} {lead.company && `at ${lead.company}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Button variant="default" size="sm">
            <Calendar className="h-4 w-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Lead Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Card */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <Badge className={stageColors[lead.stage]}>
                {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
              </Badge>
            </div>

            <div className="space-y-4">
              {lead.company && (
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium text-foreground">{lead.company}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{lead.email}</p>
                </div>
              </div>

              {lead.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{lead.phone}</p>
                  </div>
                </div>
              )}

              {lead.linkedin && (
                <div className="flex items-start gap-3">
                  <Linkedin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">LinkedIn</p>
                    <p className="text-sm font-medium text-foreground">{lead.linkedin}</p>
                  </div>
                </div>
              )}

              {lead.wechat && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">WeChat</p>
                    <p className="text-sm font-medium text-foreground">{lead.wechat}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Lead Details */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Lead Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium text-foreground">{lead.source}</p>
              </div>
              {lead.lastContactedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Last Contacted</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(lead.lastContactedAt)}
                  </p>
                </div>
              )}
              {lead.nextFollowUpAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Next Follow-Up</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(lead.nextFollowUpAt)}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Score Breakdown */}
          <ScoreBreakdown lead={lead} />
        </div>

        {/* Right Column - Activity & AI */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI Follow-Up Suggestions */}
          <AIFollowUp
            leadId={lead.id}
            initialSuggestion={lead.suggestedFollowUp}
            insights={lead.insights}
          />

          {/* Activity Timeline */}
          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">Activity Timeline</h3>
            <ActivityTimeline activities={lead.activities} />
          </Card>
        </div>
      </div>
    </div>
  )
}
