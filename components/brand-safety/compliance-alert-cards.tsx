"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Shield,
  CheckCircle2,
  X,
  Eye,
} from "lucide-react"
import {
  type ComplianceAlert,
} from "@/lib/mock"
import { formatDistanceToNow } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"
import Link from "next/link"

interface ComplianceAlertCardsProps {
  alerts: ComplianceAlert[]
  loading: boolean
  onUpdateStatus: (alertId: string, status: "pending" | "resolved" | "ignored") => void
}

export function ComplianceAlertCards({ alerts, loading, onUpdateStatus }: ComplianceAlertCardsProps) {
  const getIssueIcon = (type: string) => {
    switch (type) {
      case "prohibited_word":
        return <XCircle className="h-5 w-5" />
      case "claim_needs_evidence":
        return <AlertCircle className="h-5 w-5" />
      case "sensitive_topic":
        return <AlertTriangle className="h-5 w-5" />
      case "brand_violation":
        return <Shield className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getIssueColor = (type: string, severity: "error" | "warning") => {
    if (severity === "error") {
      return "bg-error/10 border-error/20 text-error"
    }
    return "bg-warning/10 border-warning/20 text-warning"
  }

  const errorAlerts = alerts.filter((a) =>
    a.issues.some((i) => i.severity === "error")
  )
  const warningAlerts = alerts.filter(
    (a) => !a.issues.some((i) => i.severity === "error")
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading alerts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {errorAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-error" />
            Critical Issues ({errorAlerts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {errorAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={cn(
                  "p-4 border-2",
                  alert.status === "pending"
                    ? "border-error/30 bg-error/5"
                    : "border-border"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="destructive"
                        className="h-5 text-[10px] uppercase"
                      >
                        {alert.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(alert.createdAt)} ago
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mb-2">
                      {alert.contentTitle}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateStatus(alert.id, "ignored")}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {alert.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border flex items-start gap-3",
                        getIssueColor(issue.type, issue.severity)
                      )}
                    >
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium mb-1">
                          {issue.message}
                        </p>
                        {issue.suggestedFix && (
                          <p className="text-xs opacity-80">
                            <span className="font-medium">Fix:</span>{" "}
                            {issue.suggestedFix}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Link href={`/dashboard/content/${alert.contentId}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-3 w-3" />
                      Review Content
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onUpdateStatus(alert.id, "resolved")}
                    className="flex-1 gap-2"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Mark Resolved
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {warningAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Warnings ({warningAlerts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warningAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={cn(
                  "p-4 border",
                  alert.status === "pending"
                    ? "border-warning/30 bg-warning/5"
                    : "border-border"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="h-5 text-[10px] uppercase"
                      >
                        {alert.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(alert.createdAt)} ago
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mb-2">
                      {alert.contentTitle}
                    </h4>
                  </div>
                  {alert.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateStatus(alert.id, "ignored")}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {alert.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border flex items-start gap-3",
                        getIssueColor(issue.type, issue.severity)
                      )}
                    >
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium mb-1">
                          {issue.message}
                        </p>
                        {issue.suggestedFix && (
                          <p className="text-xs opacity-80">
                            <span className="font-medium">Fix:</span>{" "}
                            {issue.suggestedFix}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Link href={`/dashboard/content/${alert.contentId}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-3 w-3" />
                      Review Content
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onUpdateStatus(alert.id, "resolved")}
                    className="flex-1 gap-2"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Mark Resolved
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" />
          <p className="font-medium">All clear!</p>
          <p className="text-sm">No compliance alerts at this time.</p>
        </div>
      )}
    </div>
  )
}


