"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, ExternalLink } from "lucide-react"

const MOCK_KOLS = [
  {
    id: 1,
    name: "Beauty Queen",
    platform: "Xiaohongshu",
    followers: "1.2M",
    engagement: "High",
    matchScore: 95,
    avatar: "BQ",
    tags: ["Skincare", "Makeup", "Lifestyle"]
  },
  {
    id: 2,
    name: "Tech Bro",
    platform: "Bilibili",
    followers: "850K",
    engagement: "Very High",
    matchScore: 88,
    avatar: "TB",
    tags: ["Gadgets", "Reviews", "Tech"]
  },
  {
    id: 3,
    name: "Fashion Vista",
    platform: "Douyin",
    followers: "2.5M",
    engagement: "Medium",
    matchScore: 82,
    avatar: "FV",
    tags: ["Fashion", "OOTD", "Trends"]
  }
]

export function KOLDatabase() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recommended KOLs</h3>
        <span className="text-sm text-primary cursor-pointer hover:underline">View All Database</span>
      </div>

      <div className="space-y-3">
        {MOCK_KOLS.map((kol) => (
          <Card key={kol.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                {kol.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{kol.name}</h4>
                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                    {kol.matchScore}% Match
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{kol.platform}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {kol.followers}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-orange-600">
                    <TrendingUp className="h-3 w-3" />
                    {kol.engagement}
                  </div>
                </div>
              </div>

              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
