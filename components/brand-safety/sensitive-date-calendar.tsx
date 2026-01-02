"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertTriangle, Info } from "lucide-react"
import { getSensitiveDates, type SensitiveDate } from "@/lib/mock"
import { cn } from "@/lib/utils/cn"

export function SensitiveDateCalendar() {
  const [dates, setDates] = useState<SensitiveDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<SensitiveDate | null>(null)

  useEffect(() => {
    async function loadDates() {
      const now = new Date()
      const nextYear = new Date(now.getFullYear() + 1, 11, 31)
      const data = await getSensitiveDates(now, nextYear)
      setDates(data)
      setLoading(false)
    }
    loadDates()
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long" })
  }

  const getDayOfMonth = (date: Date) => {
    return date.getDate()
  }

  // Group dates by month
  const datesByMonth = dates.reduce((acc, date) => {
    const monthKey = `${date.date.getFullYear()}-${date.date.getMonth()}`
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(date)
    return acc
  }, {} as Record<string, SensitiveDate[]>)

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Sensitive Date Calendar</h3>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Sensitive Date Calendar</h3>
      </div>

      {dates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Info className="h-12 w-12 mx-auto mb-2 text-blue-500" />
          <p className="font-medium">No sensitive dates</p>
          <p className="text-sm">All clear for the next 12 months.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(datesByMonth).map(([monthKey, monthDates]) => {
            const firstDate = monthDates[0].date
            return (
              <div key={monthKey}>
                <h4 className="text-sm font-semibold text-foreground mb-3 sticky top-0 bg-card py-2 z-10">
                  {getMonthName(firstDate)} {firstDate.getFullYear()}
                </h4>
                <div className="space-y-3">
                  {monthDates.map((date) => (
                    <div
                      key={date.date.toISOString()}
                      className={cn(
                        "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
                        selectedDate?.date.toISOString() ===
                          date.date.toISOString()
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                      onClick={() =>
                        setSelectedDate(
                          selectedDate?.date.toISOString() ===
                            date.date.toISOString()
                            ? null
                            : date
                        )
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted/50 border border-border">
                          <span className="text-[10px] text-muted-foreground uppercase leading-none mb-0.5">
                            {date.date.toLocaleString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {getDayOfMonth(date.date)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-sm truncate pr-2">
                              {date.name}
                            </h5>
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {date.description}
                          </p>
                        </div>
                      </div>

                      {selectedDate?.date.toISOString() ===
                        date.date.toISOString() && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3 animate-in fade-in slide-in-from-top-2">
                          {date.avoidTopics.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-foreground mb-1.5">
                                Avoid Topics:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {date.avoidTopics.map((topic, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="destructive"
                                    className="h-5 text-[10px] px-1.5 font-normal"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {date.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-foreground mb-1.5">
                                Recommendations:
                              </p>
                              <ul className="space-y-1.5">
                                {date.recommendations.map((rec, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-muted-foreground flex items-start gap-1.5"
                                  >
                                    <span className="text-primary mt-1 h-1 w-1 rounded-full bg-current shrink-0" />
                                    <span className="leading-snug">{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}


