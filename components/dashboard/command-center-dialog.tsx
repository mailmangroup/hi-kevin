"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Search, TrendingUp, Zap, Calendar } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface CommandCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: string
  thinkingEnabled?: boolean
}

const WORKFLOWS = [
  {
    icon: Search,
    title: "Competitor Gap Analysis",
    description: "Find topics competitors haven't covered",
    color: "text-blue-500"
  },
  {
    icon: TrendingUp,
    title: "Trend-Jacking Opportunities",
    description: "Adapt trending topics to your brand",
    color: "text-purple-500"
  },
  {
    icon: Sparkles,
    title: "Content Arbitrage",
    description: "Repurpose content across platforms",
    color: "text-orange-500"
  },
  {
    icon: Zap,
    title: "Velocity Alert",
    description: "Detect sudden engagement changes",
    color: "text-green-500"
  },
  {
    icon: Calendar,
    title: "Calendar Gap Analysis",
    description: "Fill gaps in content schedule",
    color: "text-indigo-500"
  }
]

export function CommandCenterDialog({
  open,
  onOpenChange,
  model = "qwen-max",
  thinkingEnabled = true
}: CommandCenterDialogProps) {
  const router = useRouter()
  const [isStarting, setIsStarting] = React.useState(false)

  const handleStart = () => {
    setIsStarting(true)

    // Navigate to chat with command_center fast path
    // Backend will replace "start" with actual workflow instructions
    const searchParams = new URLSearchParams({
      q: "start",
      fastPath: "command_center",
      model,
      thinking: thinkingEnabled.toString()
    })

    router.push(`/chat/new?${searchParams.toString()}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Command Center
          </DialogTitle>
          <DialogDescription className="text-base">
            Open-ended exploration by Kevin for content strategy and analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Possible directions */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Possible directions to explore
            </h3>
            <div className="space-y-2">
              {WORKFLOWS.map((workflow) => {
                const Icon = workflow.icon
                return (
                  <div
                    key={workflow.title}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className={cn("mt-0.5", workflow.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {workflow.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {workflow.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* How it works */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <h3 className="font-semibold text-sm text-indigo-900 mb-2">How it works</h3>
            <ul className="space-y-1.5 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span>Kevin will help you explore in an open-ended way</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span>You can use the buttom to create visualizations once the insights are generated</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span>Continue the conversation to explore deeper</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={isStarting}
            className="gap-2"
          >
            {isStarting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Start Command Center</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
