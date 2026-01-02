"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Calendar, DollarSign, TrendingUp, Share2, Download } from "lucide-react"
import Link from "next/link"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"

const CAMPAIGN_DATA = {
  dailyPerformance: [
    { date: 'Day 1', clicks: 120, conversions: 5 },
    { date: 'Day 2', clicks: 150, conversions: 8 },
    { date: 'Day 3', clicks: 180, conversions: 12 },
    { date: 'Day 4', clicks: 250, conversions: 20 },
    { date: 'Day 5', clicks: 220, conversions: 18 },
    { date: 'Day 6', clicks: 300, conversions: 25 },
    { date: 'Day 7', clicks: 350, conversions: 32 },
  ],
  budgetUsage: [
    { category: 'Influencers', allocated: 30000, spent: 28000 },
    { category: 'Ads', allocated: 15000, spent: 12000 },
    { category: 'Production', allocated: 5000, spent: 4500 },
  ]
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Spring Collection Launch</h1>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Active</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Campaign ID: {params.id} • Started Mar 1, 2024
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Report
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Spend</p>
          <h3 className="text-2xl font-bold">¥44,500</h3>
          <span className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            89% of Budget
          </span>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Impressions</p>
          <h3 className="text-2xl font-bold">1.2M</h3>
          <span className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            +12% vs Target
          </span>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Conversions</p>
          <h3 className="text-2xl font-bold">850</h3>
          <span className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            3.2% Rate
          </span>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">ROI</p>
          <h3 className="text-2xl font-bold">3.5x</h3>
          <span className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            Healthy
          </span>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6">Performance Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CAMPAIGN_DATA.dailyPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#6366F1" strokeWidth={3} dot={{r: 4}} />
                <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Budget Allocation</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CAMPAIGN_DATA.budgetUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E8EAED" />
                <XAxis type="number" hide />
                <YAxis dataKey="category" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="spent" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="allocated" fill="#E0E7FF" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
