"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Users, AlertCircle, Calendar } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface StatsCardsProps {
  stats: {
    pendingApprovals: number
    leadsToFollow: number
    alerts: number
    scheduledPosts: number
  }
}

const statItems = [
  {
    key: "pendingApprovals" as const,
    label: "Pending Approvals",
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "leadsToFollow" as const,
    label: "Leads to Follow",
    icon: Users,
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    key: "alerts" as const,
    label: "Alerts",
    icon: AlertCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    key: "scheduledPosts" as const,
    label: "Scheduled Posts",
    icon: Calendar,
    color: "text-success",
    bgColor: "bg-success/10",
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon
        const value = stats[item.key]

        return (
          <Card
            key={item.key}
            className="transition-all hover:shadow-md cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{value}</p>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    item.bgColor
                  )}
                >
                  <Icon className={cn("w-6 h-6", item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
