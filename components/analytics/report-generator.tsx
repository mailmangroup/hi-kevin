"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BetaBadge } from "@/components/ui/beta-badge"
import { FileText, Calendar } from "lucide-react"
import { ReportParametersDialog } from "./report-parameters-dialog"

export function ReportGenerator() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

      <div className="space-y-3">
        <Button 
          className="w-full gap-2" 
          onClick={() => setIsDialogOpen(true)}
        >
          Generate Brand Report
        </Button>
      </div>

      <ReportParametersDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </Card>
  )
}
