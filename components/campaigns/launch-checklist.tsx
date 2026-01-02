"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, Circle, AlertCircle } from "lucide-react"

const CHECKLIST_ITEMS = [
  { id: 1, task: "Define Campaign Goals", status: "completed" },
  { id: 2, task: "Set Budget Allocation", status: "completed" },
  { id: 3, task: "Select Target Audience", status: "completed" },
  { id: 4, task: "Create Content Assets", status: "in_progress" },
  { id: 5, task: "Review Compliance", status: "pending" },
  { id: 6, task: "Setup Tracking Links", status: "pending" },
]

export function LaunchChecklist() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Launch Checklist</h3>
        <span className="text-sm text-muted-foreground">3/6 Completed</span>
      </div>

      <div className="space-y-4">
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.id} className="flex items-start gap-3 group cursor-pointer">
            {item.status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : item.status === 'in_progress' ? (
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-slate-300 mt-0.5 group-hover:text-primary transition-colors" />
            )}
            
            <div className="flex-1">
              <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-muted-foreground line-through decoration-slate-300' : 'text-foreground'}`}>
                {item.task}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
