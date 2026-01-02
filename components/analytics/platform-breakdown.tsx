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
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

const MOCK_PLATFORM_DATA = [
  { name: 'Xiaohongshu', value: 45, color: '#FF2442' },
  { name: 'Douyin', value: 30, color: '#000000' },
  { name: 'Weibo', value: 15, color: '#E6162D' },
  { name: 'WeChat', value: 10, color: '#07C160' },
]

const MOCK_ENGAGEMENT_DATA = [
  { name: 'Mon', likes: 120, comments: 45, shares: 12 },
  { name: 'Tue', likes: 150, comments: 55, shares: 18 },
  { name: 'Wed', likes: 180, comments: 70, shares: 25 },
  { name: 'Thu', likes: 220, comments: 90, shares: 35 },
  { name: 'Fri', likes: 250, comments: 110, shares: 45 },
  { name: 'Sat', likes: 300, comments: 140, shares: 60 },
  { name: 'Sun', likes: 280, comments: 130, shares: 55 },
]

export function PlatformBreakdown() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Audience Distribution</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={MOCK_PLATFORM_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {MOCK_PLATFORM_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Weekly Engagement</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_ENGAGEMENT_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
              <XAxis 
                dataKey="name" 
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
              <Bar dataKey="likes" fill="#6366F1" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="comments" fill="#8B5CF6" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="shares" fill="#EC4899" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
