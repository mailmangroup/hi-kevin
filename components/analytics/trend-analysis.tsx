"use client"

import { Card } from "@/components/ui/card"
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts"

const MOCK_RADAR_DATA = [
  { subject: 'Viral Potential', A: 120, B: 110, fullMark: 150 },
  { subject: 'Engagement', A: 98, B: 130, fullMark: 150 },
  { subject: 'Consistency', A: 86, B: 130, fullMark: 150 },
  { subject: 'Brand Safety', A: 99, B: 100, fullMark: 150 },
  { subject: 'Conversion', A: 85, B: 90, fullMark: 150 },
  { subject: 'Audience Growth', A: 65, B: 85, fullMark: 150 },
]

const MOCK_GROWTH_DATA = [
  { month: 'Jan', followers: 1200, reach: 45000 },
  { month: 'Feb', followers: 1500, reach: 52000 },
  { month: 'Mar', followers: 2100, reach: 68000 },
  { month: 'Apr', followers: 3200, reach: 95000 },
  { month: 'May', followers: 4500, reach: 120000 },
  { month: 'Jun', followers: 5800, reach: 145000 },
]

export function TrendAnalysis() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-1">
        <h3 className="text-lg font-semibold mb-6">Performance Radar</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MOCK_RADAR_DATA}>
              <PolarGrid stroke="#E8EAED" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
              <Radar
                name="Current Month"
                dataKey="A"
                stroke="#6366F1"
                strokeWidth={2}
                fill="#6366F1"
                fillOpacity={0.3}
              />
              <Radar
                name="Last Month"
                dataKey="B"
                stroke="#9CA3AF"
                strokeWidth={2}
                fill="#9CA3AF"
                fillOpacity={0.1}
              />
              <Legend />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-6">Growth Trajectory</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_GROWTH_DATA}>
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
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="reach" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
