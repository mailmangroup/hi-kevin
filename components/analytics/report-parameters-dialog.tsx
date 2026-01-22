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
import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ReportProgress } from "./report-progress"
import { 
  getPreviousPeriod, 
  getSamePeriodLastMonth, 
  getSamePeriodLastYear, 
  validateDateRange,
  toUnixTimestamp,
  formatDateRangeDisplay,
  getEndOfDayTimestamp,
  getStartOfDayTimestamp
} from "@/lib/utils/date-range"
import { aiService, ReportFromTemplate } from "@/lib/api/client"
import { createClient } from "@/lib/supabase/client"
import { addDays, format, parseISO, isValid } from "date-fns"
import { Loader2, FileText, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface ReportParametersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ComparisonType = "previous_period" | "last_month" | "last_year" | "custom"

export function ReportParametersDialog({
  open,
  onOpenChange
}: ReportParametersDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // State
  const [startDate, setStartDate] = React.useState<string>("")
  const [endDate, setEndDate] = React.useState<string>("")
  const [comparisonType, setComparisonType] = React.useState<ComparisonType>("previous_period")
  const [language, setLanguage] = React.useState<"en" | "cn">("en")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [currentSection, setCurrentSection] = React.useState("")
  const [status, setStatus] = React.useState<'idle' | 'generating' | 'completed' | 'error'>('idle')
  const [error, setError] = React.useState<string | undefined>()
  const [generatedConversationId, setGeneratedConversationId] = React.useState<string | null>(null)
  
  // Credentials
  const [credentials, setCredentials] = React.useState<{orgId?: string, brandId?: string}>({})
  
  // Load credentials on open
  React.useEffect(() => {
    if (open) {
      const loadCredentials = async () => {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('kawo_org_id, kawo_brand_id').eq('id', session.user.id).single()
          if (data) {
            setCredentials({
              orgId: data.kawo_org_id,
              brandId: data.kawo_brand_id
            })
          }
        }
      }
      loadCredentials()
      
      // Set default dates (last 7 days)
      if (!startDate) {
        const end = new Date()
        const start = addDays(end, -7)
        setEndDate(format(end, 'yyyy-MM-dd'))
        setStartDate(format(start, 'yyyy-MM-dd'))
      }
    }
  }, [open])

  // Reset state when closed
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStatus('idle')
        setProgress(0)
        setCurrentSection("")
        setError(undefined)
        setGeneratedConversationId(null)
      }, 300)
    }
  }, [open])

  // Handle generation
  const handleGenerate = async () => {
    if (!credentials.orgId || !credentials.brandId) {
      toast({
        title: "Missing Credentials",
        description: "Please connect your KAWO account in settings first.",
        type: "error"
      })
      return
    }

    const start = parseISO(startDate)
    const end = parseISO(endDate)
    
    const validation = validateDateRange(start, end)
    if (!validation.valid) {
      toast({
        title: "Invalid Date Range",
        description: validation.error,
        type: "error"
      })
      return
    }

    setIsGenerating(true)
    setStatus('generating')
    setProgress(5)
    setCurrentSection("Initializing report parameters...")

    // Calculate comparison dates
    let prevStart: Date
    let prevEnd: Date
    
    switch (comparisonType) {
      case "last_month":
        ({ start: prevStart, end: prevEnd } = getSamePeriodLastMonth(start, end))
        break
      case "last_year":
        ({ start: prevStart, end: prevEnd } = getSamePeriodLastYear(start, end))
        break
      case "previous_period":
      default:
        ({ start: prevStart, end: prevEnd } = getPreviousPeriod(start, end))
        break
    }

    const reportParams: ReportFromTemplate = {
      name: "brand_report",
      start_date: getStartOfDayTimestamp(start),
      end_date: getEndOfDayTimestamp(end),
      prev_start_date: getStartOfDayTimestamp(prevStart),
      prev_end_date: getEndOfDayTimestamp(prevEnd),
      language
    }

    try {
      const stream = aiService.chatStream(
        `Generate brand report for ${formatDateRangeDisplay(start, end)}`,
        {
          orgId: credentials.orgId,
          brandId: credentials.brandId,
          reportFromTemplate: reportParams,
          // Disable other features to focus on report
          includeWebSearch: false,
          thinkingEnabled: false
        }
      )

      for await (const chunk of stream) {
        if (chunk.new_conversation) {
          setGeneratedConversationId(chunk.new_conversation.conversation_id)
        }
        
        if (chunk.progress) {
          setProgress(chunk.progress * 100)
          if (chunk.current_section) {
            setCurrentSection(chunk.current_section)
          }
        }
        
        if (chunk.report) {
          // Report data received, will be handled by chat interface when opened
          // But we can mark as complete here
        }
        
        if (chunk.done) {
          setStatus('completed')
          setProgress(100)
          setIsGenerating(false)
        }
        
        if (chunk.error) {
          throw new Error(chunk.error)
        }
      }
    } catch (err: any) {
      console.error("Report generation failed:", err)
      setStatus('error')
      setError(err.message || "Failed to generate report")
      setIsGenerating(false)
    }
  }

  const handleViewReport = () => {
    if (generatedConversationId) {
      router.push(`/chat?id=${generatedConversationId}`)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isGenerating && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Brand Report</DialogTitle>
          <DialogDescription>
            Create a comprehensive analysis of your brand&apos;s performance.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {status === 'idle' ? (
            <>
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="start-date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Start Date</label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="end-date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">End Date</label>
                  <Input 
                    id="end-date" 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Comparison */}
              <div className="space-y-3">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Comparison Period</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    variant={comparisonType === "previous_period" ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setComparisonType("previous_period")}
                  >
                    Previous Period
                  </Button>
                  <Button
                    variant={comparisonType === "last_month" ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setComparisonType("last_month")}
                  >
                    Last Month
                  </Button>
                  <Button
                    variant={comparisonType === "last_year" ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setComparisonType("last_year")}
                  >
                    Last Year
                  </Button>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-3">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Report Language</label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="lang-en" 
                      name="language" 
                      value="en"
                      checked={language === "en"}
                      onChange={() => setLanguage("en")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="lang-en" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">English</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="lang-cn" 
                      name="language" 
                      value="cn"
                      checked={language === "cn"}
                      onChange={() => setLanguage("cn")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="lang-cn" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Chinese</label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <ReportProgress 
              progress={progress}
              currentSection={currentSection}
              status={status}
              error={error}
            />
          )}
        </div>

        <DialogFooter>
          {status === 'idle' && (
            <Button onClick={handleGenerate} disabled={!startDate || !endDate}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" />
              Generate Report
            </Button>
          )}
          
          {status === 'generating' && (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </Button>
          )}

          {status === 'completed' && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setStatus('idle')}>
                Generate Another
              </Button>
              <Button className="flex-1 gap-2" onClick={handleViewReport}>
                View Report
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button className="flex-1" onClick={handleGenerate}>
                Try Again
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
