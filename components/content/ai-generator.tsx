"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Wand2, RefreshCw } from "lucide-react"
import { AIThinking } from "@/components/ui/loading"

export function AIContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [topic, setTopic] = useState("")

  const handleGenerate = () => {
    setIsGenerating(true)
    // Mock generation delay
    setTimeout(() => {
      setIsGenerating(false)
    }, 3000)
  }

  return (
    <Card className="p-6 bg-gradient-to-b from-white to-indigo-50/30 border-indigo-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">AI Content Generator</h3>
          <p className="text-sm text-muted-foreground">Let Kevin create your next viral post</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">What&apos;s this post about?</label>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-md border border-border bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="e.g., A spring skincare routine for sensitive skin focusing on hydration..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/5">
            xiaohongshu
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/5">
            douyin
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/5">
            weibo
          </Badge>
        </div>

        <div className="pt-2">
          {isGenerating ? (
            <div className="bg-white rounded-md border border-border p-4 flex items-center justify-center min-h-[100px]">
              <div className="text-center space-y-2">
                <AIThinking />
                <p className="text-sm text-muted-foreground animate-pulse">Kevin is writing your content...</p>
              </div>
            </div>
          ) : (
            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={!topic}
            >
              <Wand2 className="h-4 w-4" />
              Generate Content
            </Button>
          )}
        </div>

        <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-md flex gap-2">
          <RefreshCw className="h-4 w-4 shrink-0" />
          <p>Pro tip: Be specific about your target audience and tone for better results.</p>
        </div>
      </div>
    </Card>
  )
}
