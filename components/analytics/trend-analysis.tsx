"use client"

import { Card } from "@/components/ui/card"
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import type { GrowthDataPoint } from "@/lib/api/analytics"

interface TrendAnalysisProps {
  growthData: GrowthDataPoint[]
}

export function TrendAnalysis({ growthData }: TrendAnalysisProps) {
  return (
    <div className="w-full">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Growth Trajectory</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="followers" 
                stroke="#6366F1" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                name="Followers"
                connectNulls={false}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="reach" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                name="Reach"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
