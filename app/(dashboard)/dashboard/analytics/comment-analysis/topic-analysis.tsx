
"use client"

import { useMemo, useState } from "react"
import { Search, ChevronRight, ChevronDown, SlidersHorizontal } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

interface TopicAnalysisProps {
  taggedData: any[]
  sentimentDistribution: Record<string, number>
}

type SortMode = "count" | "score"

export function TopicAnalysis({ taggedData, sentimentDistribution }: TopicAnalysisProps) {
  const [weights, setWeights] = useState({
    comment: 1,
    like: 0.3,
    reply: 0.5,
  })
  
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>("score")
  const [showWeights, setShowWeights] = useState(false)

  // 1. Group by Topic
  const topicStats = useMemo(() => {
    const stats: Record<string, {
      count: number
      likes: number
      replies: number
      score: number
      comments: any[]
      sentimentBreakdown: Record<string, number>
    }> = {}

    taggedData.forEach((item) => {
      // Filter by sentiment if selected
      if (selectedSentiment && item.sentiment !== selectedSentiment) return

      const topic = item.topic || "Uncategorized"
      
      if (!stats[topic]) {
        stats[topic] = { count: 0, likes: 0, replies: 0, score: 0, comments: [], sentimentBreakdown: {} }
      }

      stats[topic].count += 1
      stats[topic].likes += (item.likes || 0)
      stats[topic].replies += (item.replies || 0)
      stats[topic].comments.push(item)

      // Calculate score
      const itemScore = 
        weights.comment * 1 + 
        weights.like * (item.likes || 0) + 
        weights.reply * (item.replies || 0)
      
      stats[topic].score += itemScore

      // Sentiment breakdown
      const sent = item.sentiment || "Neutral"
      stats[topic].sentimentBreakdown[sent] = (stats[topic].sentimentBreakdown[sent] || 0) + 1
    })

    return Object.entries(stats)
      .map(([topic, data]) => ({
        topic,
        ...data,
        avgScore: data.score / data.count
      }))
      .sort((a, b) => sortMode === "score" ? b.score - a.score : b.count - a.count)
  }, [taggedData, selectedSentiment, weights, sortMode])

  // Helper to normalize sentiment for colors
  const getSentimentColor = (sent: string) => {
    const s = sent.toLowerCase()
    if (s.includes("pos")) return "#10b981" // emerald-500
    if (s.includes("neg")) return "#f43f5e" // rose-500
    return "#94a3b8" // slate-400
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-4 border-b border-indigo-100 pb-4">
        <span className="font-serif text-4xl font-light text-indigo-200">04</span>
        <div className="flex-1">
          <h2 className="font-serif text-2xl text-slate-900">话题深度分析</h2>
          <p className="text-sm text-slate-500">基于 {topicStats.length} 个话题聚类的声量与互动权重分析</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWeights(!showWeights)}
            className={cn("text-xs border-slate-200 text-slate-600 hover:bg-slate-50", showWeights && "bg-indigo-50 text-indigo-600 border-indigo-200")}
          >
            <SlidersHorizontal className="w-3 h-3 mr-2" />
            权重设置
          </Button>
        </div>
      </div>

      {showWeights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-white/50 border border-indigo-100 mb-6 animate-in slide-in-from-top-2 backdrop-blur-sm shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>基础分 (每条评论)</span>
              <span className="font-mono text-slate-900">{weights.comment}</span>
            </div>
            <Slider
              value={[weights.comment]}
              min={0}
              max={10}
              step={0.1}
              onValueChange={([v]) => setWeights(prev => ({ ...prev, comment: v }))}
              className="py-2"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>点赞权重 (每点赞)</span>
              <span className="font-mono text-slate-900">{weights.like}</span>
            </div>
            <Slider
              value={[weights.like]}
              min={0}
              max={5}
              step={0.1}
              onValueChange={([v]) => setWeights(prev => ({ ...prev, like: v }))}
              className="py-2"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>回复权重 (每回复)</span>
              <span className="font-mono text-slate-900">{weights.reply}</span>
            </div>
            <Slider
              value={[weights.reply]}
              min={0}
              max={5}
              step={0.1}
              onValueChange={([v]) => setWeights(prev => ({ ...prev, reply: v }))}
              className="py-2"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedSentiment(null)}
          className={cn(
            "rounded-full text-xs px-3 border",
            !selectedSentiment ? "bg-slate-900 text-white border-slate-900" : "text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          全部
        </Button>
        {Object.keys(sentimentDistribution).map(sent => (
          <Button
            key={sent}
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSentiment(sent)}
            className={cn(
              "rounded-full text-xs px-3 border",
              selectedSentiment === sent 
                ? "bg-slate-900 text-white border-slate-900" 
                : "text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <span className="w-2 h-2 rounded-full mr-2" style={{ background: getSentimentColor(sent) }} />
            {sent}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {topicStats.map((topic) => (
          <div 
            key={topic.topic}
            className={cn(
              "rounded-xl border border-white/50 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden transition-all",
              expandedTopic === topic.topic ? "ring-2 ring-indigo-500/20 border-indigo-200" : "hover:border-indigo-200 hover:shadow-md"
            )}
          >
            <div 
              className="p-4 flex items-center gap-4 cursor-pointer"
              onClick={() => setExpandedTopic(expandedTopic === topic.topic ? null : topic.topic)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-medium text-slate-900 truncate">{topic.topic}</h3>
                  <div className="flex h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                    {Object.entries(topic.sentimentBreakdown).map(([sent, count]) => (
                      <div 
                        key={sent}
                        style={{ 
                          width: `${(count / topic.count) * 100}%`,
                          background: getSentimentColor(sent)
                        }} 
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{topic.count} 评论</span>
                  <span>{topic.likes} 点赞</span>
                  <span>{topic.replies} 回复</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Weighted Score</div>
                <div className="font-mono text-xl text-indigo-600 font-semibold">
                  {topic.score.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              {expandedTopic === topic.topic ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </div>

            {expandedTopic === topic.topic && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3 animate-in slide-in-from-top-1">
                {topic.comments
                  .sort((a, b) => {
                    const scoreA = weights.comment + weights.like * (a.likes || 0) + weights.reply * (a.replies || 0)
                    const scoreB = weights.comment + weights.like * (b.likes || 0) + weights.reply * (b.replies || 0)
                    return scoreB - scoreA
                  })
                  .slice(0, 10)
                  .map((comment, idx) => (
                    <div key={idx} className="text-sm p-3 rounded-lg bg-white border border-slate-100 shadow-sm">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] uppercase font-medium bg-slate-100"
                            style={{ color: getSentimentColor(comment.sentiment) }}
                          >
                            {comment.sentiment}
                          </span>
                          {comment.persona_name && (
                            <span className="text-xs text-slate-500">{comment.persona_name}</span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-slate-400 flex gap-2">
                          <span>👍 {comment.likes || 0}</span>
                          <span>💬 {comment.replies || 0}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{comment.body}</p>
                    </div>
                  ))}
                  {topic.comments.length > 10 && (
                    <div className="text-center pt-2">
                      <Button variant="link" size="sm" className="text-indigo-600 text-xs">
                        View all {topic.comments.length} comments
                      </Button>
                    </div>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
