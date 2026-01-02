"use client"

import type { Lead, ScoreItem } from "@/types"
import { Card } from "@/components/ui/card"
import { TrendingUp, Target } from "lucide-react"

interface ScoreBreakdownProps {
  lead: Lead
}

export function ScoreBreakdown({ lead }: ScoreBreakdownProps) {
  const maxScore = 100
  const scorePercentage = (lead.score / maxScore) * 100

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Lead Score</h3>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{lead.score}</div>
              <div className="text-xs text-muted-foreground">out of {maxScore}</div>
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-500"
            style={{ width: `${scorePercentage}%` }}
          />
        </div>

        {/* Fit vs Behavior Score */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-background p-4">
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Fit Score</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{lead.fitScore}</div>
            <p className="mt-1 text-xs text-muted">Company & role match</p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Behavior Score</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{lead.behaviorScore}</div>
            <p className="mt-1 text-xs text-muted">Engagement level</p>
          </div>
        </div>
      </Card>

      {/* Score Breakdown */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Score Breakdown</h3>
        <div className="space-y-4">
          {lead.scoreBreakdown.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.factor}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">+{item.points}</span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              </div>
              {/* Progress bar for each factor */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.points / 20) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
