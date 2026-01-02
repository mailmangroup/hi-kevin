"use client"

import type { LeadActivity } from "@/types"
import {
  Mail,
  MousePointerClick,
  Globe,
  FileText,
  Calendar,
  Phone,
  MessageSquare
} from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils/date"

interface ActivityTimelineProps {
  activities: LeadActivity[]
}

const activityIcons = {
  email_open: Mail,
  email_click: MousePointerClick,
  page_visit: Globe,
  form_submit: FileText,
  meeting: Calendar,
  call: Phone,
  note: MessageSquare,
}

const activityColors = {
  email_open: "text-blue-500 bg-blue-50",
  email_click: "text-purple-500 bg-purple-50",
  page_visit: "text-green-500 bg-green-50",
  form_submit: "text-orange-500 bg-orange-50",
  meeting: "text-indigo-500 bg-indigo-50",
  call: "text-pink-500 bg-pink-50",
  note: "text-gray-500 bg-gray-50",
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type] || MessageSquare
        const colorClass = activityColors[activity.type] || activityColors.note
        const isLast = index === activities.length - 1

        return (
          <div key={activity.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 h-full w-0.5 bg-border" />
            )}

            {/* Icon */}
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium text-foreground">
                {activity.description}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(activity.createdAt)} ago
              </p>

              {/* Metadata */}
              {activity.metadata && (
                <div className="mt-2 rounded-md bg-background px-3 py-2 text-xs text-muted">
                  {Object.entries(activity.metadata).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1")}:
                      </span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
