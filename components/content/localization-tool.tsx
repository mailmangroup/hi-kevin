"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Languages,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Globe2,
  RefreshCw
} from "lucide-react"
import { AIThinking } from "@/components/ui/loading"
import { cn } from "@/lib/utils/cn"

const MOCK_TRANSLATIONS = {
  xiaohongshu: `✨姐妹们！这个新产品真的绝绝子！😍
  
亲测好用，感觉皮肤瞬间喝饱水💦
成分很安全，敏感肌也没问题～
  
#护肤分享 #好物推荐 #敏感肌救星`,

  douyin: `🔥家人们！谁懂啊！
这个宝藏好物必须按头安利！
  
✅ 补水保湿
✅ 提亮肤色
✅ 敏感肌可用
  
👇评论区扣1，抽3位送试用装！`,

  weibo: `【新品首发】
Kevin AI推出全新智能营销助手。
👉 功能强大，覆盖全平台
👉 一键生成，效率翻倍
  
关注+转发，抽1台iPhone 15！🎁`
}

export function LocalizationTool() {
  const [sourceText, setSourceText] = useState("")
  const [targetPlatform, setTargetPlatform] = useState<keyof typeof MOCK_TRANSLATIONS | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [result, setResult] = useState("")
  const [copied, setCopied] = useState(false)

  const handleTranslate = () => {
    if (!targetPlatform || !sourceText) return

    setIsTranslating(true)
    setResult("")

    // Mock API call
    setTimeout(() => {
      setResult(MOCK_TRANSLATIONS[targetPlatform])
      setIsTranslating(false)
    }, 2000)
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      {/* Input Section */}
      <Card className="flex flex-col p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Source Content</h3>
          </div>
          <Badge variant="outline">English / Global</Badge>
        </div>

        <textarea
          className="flex-1 w-full p-4 rounded-lg border border-border bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
          placeholder="Paste your English marketing copy here..."
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {sourceText.length} characters
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSourceText("Introducing the new Kevin AI Marketing Assistant. It helps you create content, manage leads, and analyze performance across all major Chinese social media platforms.")}
          >
            Load Sample
          </Button>
        </div>
      </Card>

      {/* Output Section */}
      <Card className="flex flex-col p-6 h-full bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Localized Output</h3>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={targetPlatform === 'xiaohongshu' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTargetPlatform('xiaohongshu')}
            className={cn(
              "gap-2",
              targetPlatform === 'xiaohongshu' && "bg-[#FF2442] hover:bg-[#FF2442]/90 border-[#FF2442]"
            )}
          >
            Little Red Book
          </Button>
          <Button
            variant={targetPlatform === 'douyin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTargetPlatform('douyin')}
            className={cn(
              "gap-2",
              targetPlatform === 'douyin' && "bg-black hover:bg-black/90 border-black"
            )}
          >
            Douyin
          </Button>
          <Button
            variant={targetPlatform === 'weibo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTargetPlatform('weibo')}
            className={cn(
              "gap-2",
              targetPlatform === 'weibo' && "bg-[#E6162D] hover:bg-[#E6162D]/90 border-[#E6162D]"
            )}
          >
            Weibo
          </Button>
        </div>

        {/* Result Area */}
        <div className="flex-1 relative rounded-lg border border-border bg-white overflow-hidden">
          {isTranslating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <AIThinking />
              <p className="mt-4 text-sm text-muted-foreground animate-pulse">
                Adapting tone and style...
              </p>
            </div>
          ) : null}

          {result ? (
            <div className="h-full p-4 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                {result}
              </pre>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <Sparkles className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">
                Select a target platform and click &quot;Localize&quot; to generate adapted content.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          {result && (
            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button
            onClick={handleTranslate}
            disabled={!sourceText || !targetPlatform || isTranslating}
            className="gap-2 min-w-[120px]"
          >
            {isTranslating ? (
              "Processing..."
            ) : (
              <>
                Localize <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
