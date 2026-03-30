
"use client"

import { Loader2 } from "lucide-react"

interface AnalysisProgressProps {
  phase: number
  message: string
  isBatch?: boolean
}

export function AnalysisProgress({ phase, message, isBatch = false }: AnalysisProgressProps) {
  const steps = isBatch
    ? ["Fetching Reports", "Synthesizing Insights", "Saving"]
    : ["Schema Generation", "Tagging & Sentiment", "Persona Analysis", "Insights Generation", "Finalizing"]

  const progress = Math.min(100, Math.max(5, Math.round(((phase + 1) / steps.length) * 100)))

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 py-12">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          Analyzing Content
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-300">{message}</p>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between px-1">
          {steps.map((step, idx) => (
            <div 
              key={step} 
              className={`text-[10px] flex flex-col items-center gap-1 transition-colors ${
                idx <= phase ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                idx < phase ? "bg-emerald-500" : idx === phase ? "bg-indigo-600 dark:bg-indigo-400 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
              }`} />
              <span className="hidden sm:inline">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
