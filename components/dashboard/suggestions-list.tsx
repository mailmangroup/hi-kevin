"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Circle, Sparkles } from "lucide-react"
import Link from "next/link"
import type { Suggestion } from "@/types"
import { formatRelativeTime } from "@/lib/utils/date"
import { BetaBadge } from "@/components/ui/beta-badge"

interface SuggestionsListProps {
  suggestions: Suggestion[]
}

const priorityVariants = {
  high: "high" as const,
  medium: "medium" as const,
  low: "low" as const,
}

const priorityColors = {
  high: "text-error",
  medium: "text-warning",
  low: "text-success",
}

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) {
    return (
      <Card className="glass-premium border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Kevin&apos;s Suggestions
            <BetaBadge />
          </CardTitle>
          <CardDescription>AI-powered action items for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Sparkles className="h-5 w-5 text-slate-500" />
            </div>
            <p className="text-base font-semibold text-foreground">All caught up!</p>
            <p className="mt-2 text-sm text-muted-foreground">Kevin will notify you when there&apos;s something to review.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-premium border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Kevin&apos;s Suggestions
              <BetaBadge />
            </CardTitle>
            <CardDescription>AI-powered action items for today</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/suggestions" className="flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className="flex items-start gap-4 p-4 rounded-lg border border-white/20 bg-white/30 hover:bg-white/50 transition-all"
            >
              {/* Priority indicator */}
              <div className="flex-shrink-0 pt-1">
                <Circle
                  className={`w-2 h-2 fill-current ${priorityColors[suggestion.priority]}`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <Badge variant={priorityVariants[suggestion.priority]} className="flex-shrink-0">
                    {suggestion.priority}
                  </Badge>
                  <h4 className="text-sm font-semibold text-foreground">
                    {suggestion.title}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {suggestion.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(suggestion.createdAt)}
                </p>
              </div>

              {/* Action button */}
              <div className="flex-shrink-0">
                <Button size="sm" variant="outline" asChild>
                  <Link href={suggestion.actionUrl}>
                    {suggestion.actionLabel}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
