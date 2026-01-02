"use client"

import { useState } from "react"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"
import { mockContentItems } from "@/lib/mock/content"
import type { ContentItem } from "@/types"

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const getDayContent = (date: Date) => {
    return mockContentItems.filter(item => {
      const itemDate = item.scheduledAt || item.createdAt
      return isSameDay(new Date(itemDate), date)
    })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center rounded-md border border-border">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={prevMonth}
              className="h-8 w-8 rounded-none border-r border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToToday}
              className="h-8 px-3 rounded-none text-xs font-medium"
            >
              Today
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={nextMonth}
              className="h-8 w-8 rounded-none border-l border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-surface p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, dayIdx) => {
          const items = getDayContent(day)
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, new Date())

          return (
            <div 
              key={day.toString()} 
              className={cn(
                "bg-surface min-h-[120px] p-2 transition-colors hover:bg-slate-50",
                !isCurrentMonth && "bg-slate-50/50 text-muted-foreground"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-sm w-6 h-6 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-white font-medium"
                )}>
                  {format(day, "d")}
                </span>
                {items.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {items.length} posts
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {items.map(item => (
                  <div 
                    key={item.id}
                    className="text-xs p-1.5 rounded border border-border bg-white shadow-sm truncate cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.platform === 'xiaohongshu' && "bg-[#FF2442]",
                        item.platform === 'douyin' && "bg-black",
                        item.platform === 'weibo' && "bg-[#E6162D]",
                        item.platform === 'wechat' && "bg-[#07C160]",
                      )} />
                      <span className="font-medium truncate">{item.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
