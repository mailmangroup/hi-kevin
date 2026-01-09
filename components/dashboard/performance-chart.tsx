"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TrendingUp, TrendingDown, Minus, ArrowRight, Info } from "lucide-react"
import Link from "next/link"
import type { DashboardData } from "@/types"

interface PerformanceChartProps {
  data: DashboardData["weeklyPerformance"]
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const maxEngagement = Math.max(...data.platforms.map((p) => p.engagement || 0)) || 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>This Week&apos;s Performance</CardTitle>
            <div className="flex items-center gap-2">
              <CardDescription>Engagement across platforms</CardDescription>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] text-xs">
                    <p className="font-semibold mb-2">Engagement Calculation:</p>
                    <ul className="space-y-1 list-disc pl-3">
                      <li><span className="font-medium">XHS:</span> like + share + comment + fav + danmaku</li>
                      <li><span className="font-medium">SPH:</span> fav + like + forward + comment</li>
                      <li><span className="font-medium">Weibo:</span> likes + reposts + comments</li>
                      <li><span className="font-medium">WeChat:</span> share + add_to_fav</li>
                      <li><span className="font-medium">Douyin:</span> digg + share + comment + completion + subscribe + forward + download</li>
                      <li><span className="font-medium">Bilibili:</span> like + reply + share + fav + coin + danmaku</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/analytics" className="flex items-center gap-1">
              See Analytics
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.platforms.map((platform) => {
            const isPositive = (platform.change || 0) > 0
            const isNegative = (platform.change || 0) < 0
            const Icon = isPositive
              ? TrendingUp
              : isNegative
              ? TrendingDown
              : Minus

            return (
              <div key={platform.platform} className="flex items-center gap-4">
                {/* Platform badge */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: platform.color }}
                />

                {/* Platform name */}
                <div className="w-20 flex-shrink-0">
                  <p className="text-sm font-medium">{platform.platform}</p>
                </div>

                {/* Progress bar */}
                <div className="flex-1">
                  <div className="relative h-8 bg-border-light rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{
                        backgroundColor: platform.color,
                        width: `${((platform.engagement || 0) / maxEngagement) * 100}%`,
                        opacity: 0.8,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-semibold text-foreground">
                        {(platform.engagement || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change indicator */}
                <div className="w-20 flex-shrink-0 text-right">
                  <div
                    className={`inline-flex items-center gap-1 text-sm font-semibold ${
                      isPositive
                        ? "text-success"
                        : isNegative
                        ? "text-error"
                        : "text-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {Math.abs(platform.change || 0)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Engagement</p>
              <p className="text-lg font-bold mt-1">
                {data.platforms
                  .reduce((sum, p) => sum + (p.engagement || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Average Change</p>
              <p className="text-lg font-bold mt-1">
                {(
                  data.platforms.reduce((sum, p) => sum + (p.change || 0), 0) /
                  (data.platforms.length || 1)
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
