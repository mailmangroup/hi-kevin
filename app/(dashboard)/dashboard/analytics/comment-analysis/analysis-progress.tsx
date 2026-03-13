
"use client"

import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2 } from "lucide-react"

interface AnalysisProgressProps {
  phase: number
  message: string
}

export function AnalysisProgress({ phase, message }: AnalysisProgressProps) {
  // Phase 0-4 mapping to percentage
  const progress = Math.min(100, Math.max(5, (phase + 1) * 20))

  const steps = [
    "Schema Generation",
    "Tagging & Sentiment",
    "Persona Analysis",
    "Insights Generation",
    "Finalizing"
  ]

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 py-12">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-medium text-slate-900 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          Analyzing Content
        </h3>
        <p className="text-sm text-slate-500">{message}</p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2 bg-slate-200" indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="flex justify-between px-1">
          {steps.map((step, idx) => (
            <div 
              key={step} 
              className={`text-[10px] flex flex-col items-center gap-1 transition-colors ${
                idx <= phase ? "text-slate-900 font-medium" : "text-slate-400"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                idx < phase ? "bg-emerald-500" : idx === phase ? "bg-indigo-600 animate-pulse" : "bg-slate-300"
              }`} />
              <span className="hidden sm:inline">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
