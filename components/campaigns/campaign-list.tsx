"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, MoreVertical, ArrowRight } from "lucide-react"
import Link from "next/link"

const MOCK_CAMPAIGNS = [
  {
    id: "camp-001",
    name: "Spring Collection Launch",
    status: "active",
    platform: "Multi-platform",
    startDate: "2024-03-01",
    endDate: "2024-03-31",
    budget: "¥50,000",
    spent: "¥12,450",
    performance: "+15%"
  },
  {
    id: "camp-002",
    name: "Valentines Day Special",
    status: "completed",
    platform: "Xiaohongshu",
    startDate: "2024-02-01",
    endDate: "2024-02-14",
    budget: "¥20,000",
    spent: "¥19,800",
    performance: "+32%"
  },
  {
    id: "camp-003",
    name: "Brand Awareness Q2",
    status: "draft",
    platform: "Douyin",
    startDate: "2024-04-01",
    endDate: "2024-06-30",
    budget: "¥100,000",
    spent: "¥0",
    performance: "-"
  }
]

export function CampaignList() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200'
      case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'draft': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-4">
      {MOCK_CAMPAIGNS.map((campaign) => (
        <Card key={campaign.id} className="p-4 transition-all hover:shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left Section */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{campaign.name}</h3>
                <Badge variant="secondary" className={getStatusColor(campaign.status)}>
                  {campaign.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{campaign.startDate} - {campaign.endDate}</span>
                </div>
                <span>•</span>
                <span>{campaign.platform}</span>
              </div>
            </div>

            {/* Middle Section - Metrics */}
            <div className="flex gap-8 text-sm border-l border-r border-border px-8">
              <div>
                <p className="text-muted-foreground mb-1">Budget</p>
                <p className="font-medium">{campaign.budget}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Spent</p>
                <p className="font-medium">{campaign.spent}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Impact</p>
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  {campaign.performance}
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/campaigns/${campaign.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
