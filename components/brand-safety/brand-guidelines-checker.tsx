"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Palette,
  Type,
  MessageSquare,
  Ban,
} from "lucide-react"
import {
  getBrandGuidelines,
  checkBrandGuidelines,
  type BrandGuidelines,
  type ComplianceIssue,
} from "@/lib/mock"
import { cn } from "@/lib/utils/cn"

export function BrandGuidelinesChecker() {
  const [guidelines, setGuidelines] = useState<BrandGuidelines | null>(null)
  const [text, setText] = useState("")
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [hasChecked, setHasChecked] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    async function loadGuidelines() {
      const data = await getBrandGuidelines()
      setGuidelines(data)
    }
    loadGuidelines()
  }, [])

  const handleCheck = async () => {
    setIsChecking(true)
    setHasChecked(false)

    const foundIssues = await checkBrandGuidelines(text)
    setIssues(foundIssues)
    setHasChecked(true)
    setIsChecking(false)
  }

  if (!guidelines) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Loading guidelines...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Brand Guidelines Display */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Brand Guidelines</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Brand Colors</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded border border-border"
                style={{ backgroundColor: guidelines.primaryColor }}
              />
              <div
                className="h-8 w-8 rounded border border-border"
                style={{ backgroundColor: guidelines.secondaryColor }}
              />
              <span className="text-xs text-muted-foreground">
                Primary • Secondary
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Fonts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {guidelines.fonts.map((font, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {font}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tone of Voice</span>
            </div>
            <ul className="space-y-1">
              {guidelines.toneOfVoice.map((tone, idx) => (
                <li
                  key={idx}
                  className="text-xs text-muted-foreground flex items-start gap-1"
                >
                  <span className="text-primary mt-0.5">•</span>
                  {tone}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Prohibited Words</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {guidelines.prohibitedWords.map((word, idx) => (
                <Badge
                  key={idx}
                  variant="destructive"
                  className="h-5 text-[10px]"
                >
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Content Checker */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Content Checker</h3>
          </div>
          <Badge variant={issues.length > 0 ? "destructive" : "outline"}>
            {hasChecked
              ? `${issues.length} Issue${issues.length !== 1 ? "s" : ""}`
              : "Ready to Check"}
          </Badge>
        </div>

        <div className="space-y-4">
          <textarea
            className="w-full min-h-[150px] p-3 rounded-md border border-border bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Paste content to check against brand guidelines..."
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
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {isChecking ? "Checking..." : "Check Guidelines"}
            </Button>
          </div>

          {hasChecked && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              {issues.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 text-green-700 border border-green-100">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Content approved</p>
                    <p className="text-sm opacity-90">
                      Content aligns with brand guidelines.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border flex items-start gap-3",
                        "bg-error/10 border-error/20 text-error"
                      )}
                    >
                      <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">
                            Brand Violation
                          </span>
                          <Badge
                            variant="destructive"
                            className="h-5 text-[10px] bg-error"
                          >
                            ERROR
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{issue.message}</p>
                        {issue.suggestedFix && (
                          <p className="text-xs mt-1.5 font-medium opacity-80">
                            <span className="font-medium">Suggestion:</span>{" "}
                            {issue.suggestedFix}
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
    </div>
  )
}


