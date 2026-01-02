"use client"

import * as React from "react"
import { MessageCircle, X, Send, Minimize2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { AIThinking } from "@/components/ui/loading"
import { usePathname } from "next/navigation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function QuickChat() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMinimized, setIsMinimized] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Kevin, your AI marketing co-pilot. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(input, pathname),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsThinking(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-xs font-bold">
          1
        </span>
      </button>
    )
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-border bg-white shadow-2xl transition-all",
        isMinimized ? "h-14 w-80" : "h-[600px] w-96"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-border bg-gradient-to-r from-primary to-primary-hover p-4 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <span className="text-base">✨</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Kevin AI</h3>
            <p className="text-xs opacity-90">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 transition-colors hover:bg-white/20"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 transition-colors hover:bg-white/20"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-foreground"
                  )}
                >
                  {message.role === "assistant" && (
                    <span className="mr-1 text-base">✨</span>
                  )}
                  {message.content}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-2">
                  <AIThinking message="Kevin is thinking" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Kevin anything..."
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isThinking}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// Mock AI responses (replace with actual API integration)
function getAIResponse(input: string, context: string): string {
  const lowerInput = input.toLowerCase()

  // Context-aware responses
  if (context.includes('campaigns')) {
    if (lowerInput.includes('create') || lowerInput.includes('new')) return "To create a new campaign, click the 'New Campaign' button in the top right. I can help you define your objectives and audience."
    if (lowerInput.includes('budget')) return "For this campaign, I recommend allocating 60% to influencers and 40% to platform ads based on current trends."
  }
  
  if (context.includes('leads')) {
    if (lowerInput.includes('follow up') || lowerInput.includes('email')) return "I can generate a personalized follow-up message for this lead. Would you like me to draft one focusing on their recent engagement?"
    if (lowerInput.includes('score')) return "Lead scores are calculated based on engagement, profile completeness, and recent activity."
  }

  if (context.includes('content')) {
    if (lowerInput.includes('idea') || lowerInput.includes('draft')) return "I can help you draft content for your calendar. Try clicking on a date to start a new draft!"
  }

  if (lowerInput.includes("content") || lowerInput.includes("post")) {
    return "I can help you create engaging content! Would you like me to generate a draft for Xiaohongshu, Douyin, Weibo, or WeChat?"
  }

  if (lowerInput.includes("lead") || lowerInput.includes("customer")) {
    return "I've analyzed your recent leads. You have 3 high-priority leads that need follow-up today. Would you like me to draft personalized messages for them?"
  }

  if (lowerInput.includes("analytics") || lowerInput.includes("performance")) {
    return "Your overall engagement is up 12% this week! Xiaohongshu posts are performing particularly well. Would you like a detailed breakdown?"
  }

  if (lowerInput.includes("schedule") || lowerInput.includes("time")) {
    return "Based on your audience's activity patterns, I recommend posting on Xiaohongshu between 7-9 PM, and on Douyin between 12-2 PM for maximum engagement."
  }

  if (lowerInput.includes("help") || lowerInput.includes("can you")) {
    return "I can help you with: 📝 Content creation, 👥 Lead management, 📊 Analytics insights, 📅 Scheduling posts, 🎯 Campaign planning, and ✅ Brand safety checks. What would you like to work on?"
  }

  return "I'm here to help! I can assist with content creation, lead management, analytics, and more. What specific task would you like help with?"
}
