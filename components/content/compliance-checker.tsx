"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, XCircle, ShieldCheck, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type IssueSeverity = 'high' | 'medium' | 'low'

interface ComplianceIssue {
  id: string
  term: string
  reason: string
  severity: IssueSeverity
  suggestion?: string
}

const MOCK_RULES: Record<string, ComplianceIssue> = {
  '最': {
    id: '1',
    term: '最',
    reason: 'Superlatives (Best/Most) are restricted by Advertising Law.',
    severity: 'high',
    suggestion: 'Consider describing specific benefits instead.'
  },
  '第一': {
    id: '2',
    term: '第一',
    reason: 'Absolute claims like "No.1" require official proof.',
    severity: 'high',
    suggestion: 'Top-tier / Leading'
  },
  '独家': {
    id: '3',
    term: '独家',
    reason: 'Exclusive claims must be verifiable.',
    severity: 'medium',
    suggestion: 'Special / Featured'
  },
  '赚钱': {
    id: '4',
    term: '赚钱',
    reason: 'Income promises are sensitive on some platforms.',
    severity: 'medium',
    suggestion: 'Value creation'
  }
}

export function ComplianceChecker({
  initialText = "",
  onCheckComplete
}: {
  initialText?: string
  onCheckComplete?: (passed: boolean) => void
}) {
  const [text, setText] = useState(initialText)
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [hasChecked, setHasChecked] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const handleCheck = () => {
    setIsChecking(true)
    setHasChecked(false)

    // Simulate API delay
    setTimeout(() => {
      const foundIssues: ComplianceIssue[] = []

      Object.keys(MOCK_RULES).forEach(term => {
        if (text.includes(term)) {
          foundIssues.push(MOCK_RULES[term])
        }
      })

      setIssues(foundIssues)
      setHasChecked(true)
      setIsChecking(false)

      if (onCheckComplete) {
        onCheckComplete(foundIssues.length === 0)
      }
    }, 1000)
  }

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-100'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-100'
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Compliance Checker</h3>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          className="w-full min-h-[150px] p-3 rounded-md border border-border bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all break-words"
          placeholder="Paste content to check for compliance risks..."
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setHasChecked(false)
          }}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleCheck}
            disabled={!text || isChecking}
            className="gap-2"
          >
            {isChecking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isChecking ? "Scanning..." : "Check Compliance"}
          </Button>
        </div>

        {hasChecked && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {issues.length === 0 ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 text-green-700 border border-green-100">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">No issues found</p>
                  <p className="text-sm opacity-90">Content appears safe for publication.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      "p-3 rounded-lg border flex items-start gap-3",
                      getSeverityColor(issue.severity)
                    )}
                  >
                    {issue.severity === 'high' ? (
                      <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">&quot;{issue.term}&quot;</span>
                        <Badge variant="outline" className="bg-white/50 text-inherit border-current h-5 text-[10px]">
                          {issue.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1 break-words">{issue.reason}</p>
                      {issue.suggestion && (
                        <p className="text-xs mt-1.5 font-medium opacity-80 break-words">
                          Suggestion: {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
