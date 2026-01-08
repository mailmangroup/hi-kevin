"use client"

import * as React from "react"
import { Send, User, Bot, Paperclip, Brain, Globe } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { aiService, Message as ApiMessage } from "@/lib/api/client"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, Terminal } from "lucide-react"

interface ToolCall {
  id: string
  name: string
  input: any
  output?: any
  state: 'running' | 'completed' | 'failed'
}

interface Message {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  timestamp: Date
  artifact?: {
    type: "chart" | "code" | "table"
    data: any
  }
  toolCalls?: ToolCall[]
  isStreaming?: boolean
  followUpQuestions?: string[]
}

function ToolCallItem({ tool }: { tool: ToolCall }) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="mb-2 rounded-lg border border-border bg-gray-50/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1">
          {tool.state === 'running' ? (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="h-3 w-3 text-green-600" />
          )}
          <span className="font-medium text-gray-700">
            {tool.state === 'running' ? 'Using' : 'Used'} {tool.name}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-gray-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="border-t border-border px-3 py-2 space-y-2 bg-white">
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Input</div>
            <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto text-gray-600">
              {typeof tool.input === 'string' ? tool.input : JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          {tool.output && (
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Output</div>
              <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto text-gray-600">
                {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


interface ChatInterfaceProps {
  initialMessage?: string
  chatId?: string
}

export function ChatInterface({ initialMessage, chatId }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const [conversationId, setConversationId] = React.useState<string | undefined>(chatId)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const initialized = React.useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [credentials, setCredentials] = React.useState<{orgId?: string, brandId?: string}>({})
  const [credentialsLoading, setCredentialsLoading] = React.useState(true)
  const [credentialsError, setCredentialsError] = React.useState<string | null>(null)
  
  // Chat options
  const [thinkingEnabled, setThinkingEnabled] = React.useState(() => {
    const param = searchParams?.get('thinking')
    return param === 'true'
  })
  const [includeWebSearch, setIncludeWebSearch] = React.useState(() => {
    const param = searchParams?.get('search')
    return param === 'false' ? false : true
  })
  const [model, setModel] = React.useState(() => {
    return searchParams?.get('model') || "qwen-max"
  })

  React.useEffect(() => {
    async function loadCredentials() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase.from('profiles').select('kawo_org_id, kawo_brand_id').eq('id', user.id).single()
          if (error) throw error

          if (data && data.kawo_org_id) {
            setCredentials({
              orgId: data.kawo_org_id,
              brandId: data.kawo_brand_id
            })
          } else {
            setCredentialsError("KAWO credentials not found. Please connect your KAWO account in settings.")
          }
        } else {
          setCredentialsError("Please log in to continue.")
        }
      } catch (error) {
        console.error("Failed to load credentials:", error)
        setCredentialsError("Failed to load credentials. Please try refreshing the page.")
      } finally {
        setCredentialsLoading(false)
      }
    }
    loadCredentials()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])

  // Load history if chatId is present
  React.useEffect(() => {
    if (chatId) {
        setConversationId(chatId)
        loadHistory(chatId)
    }
  }, [chatId])

  const loadHistory = async (id: string) => {
      try {
          const { messages: history } = await aiService.getMessages(id)
          const formattedMessages: Message[] = history.map((msg: ApiMessage) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content || (msg.role === 'assistant' ? '' : ''), // Ensure content is string
              timestamp: new Date(msg.created_at),
              artifact: msg.report ? { type: 'chart', data: msg.report } : undefined
          }))
          // Sort by timestamp ascending (oldest first)
          formattedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          setMessages(formattedMessages)
      } catch (error) {
          console.error("Failed to load history:", error)
      }
  }

  // Handle initial message (from new chat redirect)
  React.useEffect(() => {
    if (initialMessage && !initialized.current && !chatId && !credentialsLoading && credentials.orgId) {
      initialized.current = true
      handleSend(initialMessage)
    }
  }, [initialMessage, chatId, credentialsLoading, credentials.orgId])

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isThinking) return

    // Don't send if credentials are still loading or missing
    if (credentialsLoading || !credentials.orgId) {
      console.error("Cannot send message: credentials not ready")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)

    // Create a placeholder for assistant message
    const assistantMsgId = (Date.now() + 1).toString()
    setMessages((prev) => [
        ...prev,
        {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isStreaming: true
        }
    ])

    let fullContent = ""
    let followUpQuestions: string[] | undefined

    try {
      const stream = await aiService.chatStream(text, { 
        conversationId,
        orgId: credentials.orgId,
        brandId: credentials.brandId,
        thinkingEnabled,
        includeWebSearch,
        model
      })

      for await (const chunk of stream) {
          // Handle different event types
          if (chunk.new_conversation) {
              const newId = chunk.conversation_id
              setConversationId(newId)
              // Update URL without reloading
              window.history.replaceState(null, '', `/chat/${newId}`)

              // Notify sidebar to refresh chat history
              window.dispatchEvent(new Event('chat-created'))
          }

          if (chunk.content) {
              fullContent += chunk.content
              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? { ...msg, content: fullContent }
                      : msg
              ))
          }

          if (chunk.follow_up_questions) {
              followUpQuestions = chunk.follow_up_questions
          }

          if (chunk.tool_start) {
              const toolName = chunk.tool_start.tool || "unknown"
              const toolInput = chunk.tool_start.input || {}
              const toolId = Date.now().toString() + Math.random().toString().slice(2)
              
              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? {
                          ...msg,
                          toolCalls: [
                              ...(msg.toolCalls || []),
                              {
                                  id: toolId,
                                  name: toolName,
                                  input: toolInput,
                                  state: 'running'
                              }
                          ]
                        }
                      : msg
              ))
          }

          if (chunk.tool_end) {
              const toolName = chunk.tool_end.tool || "unknown"
              const toolOutput = chunk.tool_end.output
              
              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? {
                          ...msg,
                          toolCalls: (msg.toolCalls || []).map(tc => 
                              // Update the last running tool with this name
                              tc.name === toolName && tc.state === 'running'
                                  ? { ...tc, output: toolOutput, state: 'completed' }
                                  : tc
                          ),
                          // Handle artifacts if present
                          artifact: chunk.tool_end.artifact ? {
                              type: 'chart', // Simplification
                              data: chunk.tool_end.artifact
                          } : msg.artifact
                        }
                      : msg
              ))
          }

          if (chunk.error) {
              fullContent += `\n[Error: ${chunk.error}]`
              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? { ...msg, content: fullContent }
                      : msg
              ))
          }
      }
      
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => prev.map(msg => 
          msg.id === assistantMsgId 
              ? { ...msg, content: "Sorry, I encountered an error connecting to the server." } 
              : msg
      ))
    } finally {
      setIsThinking(false)
      setMessages((prev) => prev.map(msg =>
          msg.id === assistantMsgId
              ? { ...msg, isStreaming: false, followUpQuestions }
              : msg
      ))

      // Refresh sidebar list if new conversation
      if (!chatId && conversationId) {
          router.refresh()
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "user" ? "bg-primary text-white" : "bg-green-600 text-white"
              )}>
                  {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "relative max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                  message.role === "user"
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-white text-foreground border border-border rounded-tl-none"
                )}
              >
                {/* Tool Calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mb-3 flex flex-col gap-1">
                    {message.toolCalls.map((tool) => (
                      <ToolCallItem key={tool.id} tool={tool} />
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Artifact Rendering */}
                {message.artifact && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">
                            {message.artifact.type}
                        </p>
                        <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(message.artifact.data, null, 2)}
                        </pre>
                    </div>
                )}
                
                {/* Follow-up Questions */}
                {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500">Suggested follow-ups:</p>
                        <div className="flex flex-col gap-2">
                            {message.followUpQuestions.map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(question)}
                                    className="text-left text-sm text-primary hover:bg-primary/5 px-3 py-2 rounded-lg border border-primary/20 transition-colors bg-white"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <span className="mt-1 block text-[10px] opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-white p-4">
        <div className="mx-auto max-w-3xl">
          {credentialsError && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {credentialsError}
            </div>
          )}
          
          <div className="relative rounded-2xl border border-border bg-white shadow-sm focus-within:ring-1 focus-within:ring-primary">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={credentialsLoading ? "Loading..." : credentialsError ? "Unable to connect" : "Message Kevin..."}
              disabled={credentialsLoading || !!credentialsError}
              className="w-full resize-none rounded-2xl bg-transparent p-4 pb-14 text-sm focus:outline-none disabled:opacity-50 min-h-[100px]"
              rows={1}
            />
            
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant={thinkingEnabled ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setThinkingEnabled(!thinkingEnabled)}
                  className={cn(
                    "gap-2 h-8 rounded-lg text-muted-foreground hover:text-foreground", 
                    thinkingEnabled && "bg-primary/10 text-primary"
                  )}
                >
                  <Brain className="h-4 w-4" />
                  <span className="text-xs font-medium">Think</span>
                </Button>
                <Button
                  variant={includeWebSearch ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIncludeWebSearch(!includeWebSearch)}
                  className={cn(
                    "gap-2 h-8 rounded-lg text-muted-foreground hover:text-foreground", 
                    includeWebSearch && "bg-primary/10 text-primary"
                  )}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium">Search</span>
                </Button>

                <div className="h-4 w-px bg-border mx-1" />

                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-8 border-none bg-transparent shadow-none w-auto gap-2 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:ring-0">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qwen-max">qwen-max</SelectItem>
                    <SelectItem value="qwen-plus">qwen-plus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" disabled={credentialsLoading || !!credentialsError}>
                    <Paperclip className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isThinking || credentialsLoading || !!credentialsError}
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Kevin can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  )
}
