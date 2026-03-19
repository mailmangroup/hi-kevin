"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Wand2, RefreshCw } from "lucide-react"
import { AIThinking } from "@/components/ui/loading"
import { aiService } from "@/lib/api/client"
import { useToast } from "@/components/ui/toast"

export function AIContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [topic, setTopic] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState("xiaohongshu")
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeneratedContent(null)
    
    try {
      const content = await aiService.generateContent(topic, selectedPlatform)
      setGeneratedContent(content)
      toast({
        title: "Content Generated",
        description: "Your content has been created successfully.",
        type: "success",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Generation Failed",
        description: "Something went wrong. Please try again.",
        type: "error",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-b from-white to-indigo-50/30 border-indigo-100 dark:from-slate-900 dark:to-indigo-950/30 dark:border-indigo-900">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">AI Content Generator</h3>
          <p className="text-sm text-muted-foreground">Let Kevin create your next viral post</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">What&apos;s this post about?</label>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-md border border-border bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="e.g., A spring skincare routine for sensitive skin focusing on hydration..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {['xiaohongshu', 'douyin', 'weibo'].map((platform) => (
            <Badge 
              key={platform}
              variant={selectedPlatform === platform ? "default" : "outline"} 
              className="cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/20 capitalize border-slate-200 dark:border-slate-700 dark:text-slate-300"
              onClick={() => setSelectedPlatform(platform)}
            >
              {platform}
            </Badge>
          ))}
        </div>

        <div className="pt-2">
          {isGenerating ? (
            <div className="bg-white dark:bg-slate-800 rounded-md border border-border dark:border-slate-700 p-4 flex items-center justify-center min-h-[100px]">
              <div className="text-center space-y-2">
                <AIThinking />
                <p className="text-sm text-muted-foreground animate-pulse">Kevin is writing your content...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={!topic}
              >
                <Wand2 className="h-4 w-4" />
                Generate Content
              </Button>
              
              {generatedContent && (
                 <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-md border border-border dark:border-slate-700">
                   <h4 className="font-medium mb-2 text-sm text-muted-foreground">Generated Draft:</h4>
                   <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300">{generatedContent}</pre>
                 </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs p-3 rounded-md flex gap-2 border border-blue-100 dark:border-blue-900">
          <RefreshCw className="h-4 w-4 shrink-0" />
          <p>Pro tip: Be specific about your target audience and tone for better results.</p>
        </div>
      </div>
    </Card>
  )
}
