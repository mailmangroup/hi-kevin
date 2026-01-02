"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle2, XCircle, Eye } from "lucide-react"
import { type ComplianceAlert } from "@/lib/mock"
import { formatDistanceToNow } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"
import Link from "next/link"

interface ContentReviewQueueProps {
  alerts: ComplianceAlert[]
  loading: boolean
  onResolve: (id: string) => void
}

export function ContentReviewQueue({ alerts, loading, onResolve }: ContentReviewQueueProps) {
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      xiaohongshu: "bg-[#FF2442]",
      douyin: "bg-black",
      weibo: "bg-[#E6162D]",
      wechat: "bg-[#07C160]",
    }
    return colors[platform] || "bg-gray-500"
  }

  const getSeverityColor = (severity: "error" | "warning") => {
    return severity === "error"
      ? "bg-error text-white"
      : "bg-warning text-white"
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Content Review Queue</h3>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Content Review Queue</h3>
        </div>
        <Badge variant="destructive">{alerts.length} Pending</Badge>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
          <p className="font-medium">All clear!</p>
          <p className="text-sm">No content pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        getPlatformColor(alert.platform)
                      )}
                    />
                    <span className="text-sm font-medium text-muted-foreground uppercase">
                      {alert.platform}
                    </span>
                    {alert.issues.map((issue, idx) => (
                      <Badge
                        key={idx}
                        className={cn(
                          "h-5 text-[10px]",
                          getSeverityColor(issue.severity)
                        )}
                      >
                        {issue.severity === "error" ? "Error" : "Warning"}
                      </Badge>
                    ))}
                  </div>
                  <h4 className="font-semibold mb-1">{alert.contentTitle}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(alert.createdAt)} ago
                    </div>
                    <span>{alert.issues.length} issue(s)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/content/${alert.contentId}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Review
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResolve(alert.id)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Resolve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


