"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Search, BarChart3, AlertCircle } from "lucide-react"
import Link from "next/link"

type TabType = "competitors" | "kols" | "trends"

function ResearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("competitors")

  useEffect(() => {
    const tab = searchParams.get("tab") as TabType
    if (tab && ["competitors", "kols", "trends"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    router.push(`/dashboard/research?tab=${tab}`)
  }

  const tabs = [
    { id: "competitors" as TabType, label: "Competitors", icon: BarChart3 },
    { id: "kols" as TabType, label: "KOLs", icon: Users },
    { id: "trends" as TabType, label: "Trends", icon: TrendingUp },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Research & Intelligence</h1>
        <p className="text-muted-foreground mt-2">
          Track competitors, discover KOLs, and identify trending opportunities.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                border-b-2 -mb-px
                ${isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "competitors" && <CompetitorsTab />}
        {activeTab === "kols" && <KOLsTab />}
        {activeTab === "trends" && <TrendsTab />}
      </div>
    </div>
  )
}

function CompetitorsTab() {
  const competitors = [
    {
      id: "comp-1",
      name: "Brand X",
      platform: "小红书",
      engagement: 50000,
      change: 15,
      shareOfVoice: 23.5,
      recentActivity: "Posted viral content yesterday",
      alert: true,
    },
    {
      id: "comp-2",
      name: "Brand Y",
      platform: "抖音",
      engagement: 32000,
      change: -5,
      shareOfVoice: 18.2,
      recentActivity: "Launched new campaign 3 days ago",
      alert: false,
    },
    {
      id: "comp-3",
      name: "Brand Z",
      platform: "微博",
      engagement: 28000,
      change: 8,
      shareOfVoice: 15.8,
      recentActivity: "Increased posting frequency",
      alert: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {competitors.map((competitor) => (
          <Card key={competitor.id} className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{competitor.name}</CardTitle>
                  <CardDescription className="mt-1">{competitor.platform}</CardDescription>
                </div>
                {competitor.alert && (
                  <Badge variant="high" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Alert
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold">{competitor.engagement.toLocaleString()}</p>
                    <span
                      className={`text-sm font-semibold ${competitor.change > 0 ? "text-success" : "text-error"
                        }`}
                    >
                      {competitor.change > 0 ? "+" : ""}
                      {competitor.change}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Share of Voice</p>
                  <p className="text-lg font-semibold mt-1">{competitor.shareOfVoice}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recent Activity</p>
                  <p className="text-sm mt-1">{competitor.recentActivity}</p>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function KOLsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KOL Database</CardTitle>
          <CardDescription>Discover and analyze influencers across platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">KOL database coming soon</p>
            <p className="text-sm text-muted-foreground mt-2">
              Browse and filter influencers by platform, engagement, and audience match.
            </p>
            <Link href="/dashboard/research/kols">
              <Button variant="outline" className="mt-4">
                View KOL Database
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TrendsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trending Topics</CardTitle>
          <CardDescription>Discover what&apos;s trending across platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s trending in your industry across Chinese social media.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Track trending keywords, hashtags, and topics across all platforms.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResearchPageContent />
    </Suspense>
  )
}

