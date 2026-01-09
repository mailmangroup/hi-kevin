"use client"

import { Card } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"
import type { WeeklyEngagement } from "@/lib/api/analytics"

interface PlatformBreakdownProps {
  engagementData: WeeklyEngagement[]
}

export function PlatformBreakdown({ engagementData }: PlatformBreakdownProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Weekly Engagement</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            <Bar dataKey="likes" fill="#6366F1" radius={[4, 4, 0, 0]} stackId="a" name="Likes" />
            <Bar dataKey="comments" fill="#8B5CF6" radius={[4, 4, 0, 0]} stackId="a" name="Comments" />
            <Bar dataKey="shares" fill="#EC4899" radius={[4, 4, 0, 0]} stackId="a" name="Shares" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
