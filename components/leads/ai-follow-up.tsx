"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AIThinking } from "@/components/ui/loading"
import { Sparkles, Copy, ThumbsUp, ThumbsDown, RefreshCw, Send } from "lucide-react"

interface AIFollowUpProps {
  leadId: string
  initialSuggestion?: string
  insights?: string
}

export function AIFollowUp({ leadId, initialSuggestion, insights }: AIFollowUpProps) {
  const [suggestion, setSuggestion] = useState(initialSuggestion || "")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // Placeholder for AI generation until backend service is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newSuggestion = "Hi, following up on our previous conversation. I noticed you checked out our pricing page. Do you have any questions I can answer?";
      setSuggestion(newSuggestion)
    } catch (error) {
      console.error("Failed to generate follow-up:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* AI Insights */}
      {insights && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Kevin&apos;s Insights</h4>
          </div>
          <p className="text-sm text-muted">{insights}</p>
        </Card>
      )}

      {/* AI Suggested Follow-Up */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">AI-Suggested Follow-Up</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        </div>

        {isGenerating ? (
          <div className="py-8 flex justify-center">
            <AIThinking />
          </div>
        ) : (
          <>
            {/* Suggestion Text */}
            <div className="mb-4 rounded-lg border-2 border-dashed border-primary/30 bg-background p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {suggestion || "Click 'Generate' to create a personalized follow-up message"}
              </p>
            </div>

            {/* Action Buttons */}
            {suggestion && (
              <div className="flex flex-wrap gap-2">
                <Button variant="default" size="sm">
                  <Send className="h-4 w-4" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
