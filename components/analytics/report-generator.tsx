"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BetaBadge } from "@/components/ui/beta-badge"
import { FileText, Download, CheckCircle2, Loader2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const REPORT_TYPES = [
  { id: 'weekly', label: 'Weekly Performance', desc: 'Summary of engagement and growth metrics' },
  { id: 'monthly', label: 'Monthly Deep Dive', desc: 'Detailed analysis including competitor benchmarks' },
  { id: 'campaign', label: 'Campaign Specific', desc: 'Impact analysis for recent marketing campaigns' },
]

export function ReportGenerator() {
  const [selectedType, setSelectedType] = useState('weekly')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    setIsReady(false)
    
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false)
      setIsReady(true)
    }, 2500)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-indigo-900">Auto-Report Generator</h3>
            <BetaBadge label="AI Report Generation" />
          </div>
          <p className="text-sm text-indigo-600/80 mt-1">
            Generate professional PDF reports in seconds.
          </p>
        </div>
        <div className="bg-indigo-100 p-2 rounded-lg">
          <FileText className="h-6 w-6 text-indigo-600" />
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {REPORT_TYPES.map((type) => (
          <div 
            key={type.id}
            onClick={() => {
              setSelectedType(type.id)
              setIsReady(false)
            }}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
              selectedType === type.id 
                ? "bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500" 
                : "bg-white/50 border-transparent hover:bg-white"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{type.label}</span>
              {selectedType === type.id && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {isReady ? (
          <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4" />
            Download PDF Report
          </Button>
        ) : (
          <Button 
            className="w-full gap-2" 
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Analysis...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        )}
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Last generated: 3 days ago</span>
        </div>
      </div>
    </Card>
  )
}
