"use client"

import * as React from "react"
import { User, Bot } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { aiService, Message as ApiMessage } from "@/lib/api/client"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChatInputArea } from "./chat-input-area"
import { MessageContent } from "./message-content"
import { ToolCallList, ToolCall } from "./tool-call-display"
import { ArtifactProvider, useArtifact, ArtifactData } from "./artifact-context"
import { ArtifactPanel } from "./artifact-panel"

interface Message {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  isStreaming?: boolean
  thinking?: string
  followUpQuestions?: string[]
  images?: string[]
}

interface SubContentItem {
  type: "tool_input" | "tool_output" | "assistant_message" | "user_message"
  tool?: string
  tool_input?: any
  tool_output?: any
  artifact?: any
  content?: string
}

/**
 * Parse sub_content_list from database message format to our internal Message format
 * Maintains sequence order and associates artifacts with their tool calls
 */
function parseSubContentList(subContentList: SubContentItem[] | undefined): {
  toolCalls: ToolCall[]
  content: string
} {
  if (!subContentList || subContentList.length === 0) {
    return { toolCalls: [], content: "" }
  }

  const toolCalls: ToolCall[] = []
  let content = ""

  // Track tool inputs by name to match with outputs (using array to handle multiple calls to same tool)
  const pendingToolsByName: Map<string, ToolCall[]> = new Map()

  // Process items in order to maintain sequence
  for (const item of subContentList) {
    if (item.type === "tool_input" && item.tool) {
      const toolCall: ToolCall = {
        id: `${item.tool}-${toolCalls.length}-${Math.random().toString(36).slice(2)}`,
        name: item.tool,
        input: item.tool_input || {},
        state: "completed" // Mark as completed since we're loading from history
      }

      // Track pending tools
      const pending = pendingToolsByName.get(item.tool) || []
      pending.push(toolCall)
      pendingToolsByName.set(item.tool, pending)

      toolCalls.push(toolCall)
    }

    if (item.type === "tool_output" && item.tool) {
      // Find the first pending tool with this name that doesn't have output yet
      const pending = pendingToolsByName.get(item.tool)
      const pendingTool = pending?.find(t => !t.output)

      if (pendingTool) {
        pendingTool.output = item.tool_output
        pendingTool.state = "completed"
        // Associate artifact with this specific tool call
        if (item.artifact) {
          pendingTool.artifact = item.artifact
        }
      } else {
        // Tool output without matching input, create complete tool call
        toolCalls.push({
          id: `${item.tool}-${toolCalls.length}-${Math.random().toString(36).slice(2)}`,
          name: item.tool,
          input: {},
          output: item.tool_output,
          artifact: item.artifact,
          state: "completed"
        })
      }
    }

    if (item.type === "assistant_message" && item.content) {
      content = item.content
    }

    if (item.type === "user_message" && item.content) {
      content = item.content
    }
  }

  return { toolCalls, content }
}

interface ChatInterfaceProps {
  initialMessage?: string
  chatId?: string
}

export function ChatInterface({ initialMessage, chatId }: ChatInterfaceProps) {
  return (
    <ArtifactProvider>
      <ChatInterfaceInner initialMessage={initialMessage} chatId={chatId} />
    </ArtifactProvider>
  )
}

function ChatInterfaceInner({ initialMessage, chatId }: ChatInterfaceProps) {
  const { openArtifact, isPanelOpen } = useArtifact()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const [conversationId, setConversationId] = React.useState<string | undefined>(chatId)
  const [conversationTitle, setConversationTitle] = React.useState<string>("New Conversation")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const initialized = React.useRef(false)
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

  // Image upload
  const [selectedImages, setSelectedImages] = React.useState<string[]>([])

  // Load credentials and chat history in parallel
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

    // Load credentials and history in parallel
    loadCredentials()
    if (chatId) {
      setConversationId(chatId)
      // Load history and title in parallel
      loadHistory(chatId)
      loadConversationTitle(chatId)
    }
  }, [chatId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])

  const loadConversationTitle = async (id: string) => {
      try {
          const conversation = await aiService.getConversation(id)
          if (conversation?.title) {
              setConversationTitle(conversation.title)
              // Update document title
              document.title = `${conversation.title} - Kevin`
              // Notify sidebar to refresh chat history (title may have been generated)
              window.dispatchEvent(new Event('chat-title-updated'))
          }
      } catch (error) {
          console.error("Failed to load conversation title:", error)
      }
  }

  const loadHistory = async (id: string) => {
      try {
          const { messages: history } = await aiService.getMessages(id)
          const formattedMessages: Message[] = history.map((msg: ApiMessage) => {
              // Parse sub_content_list if available
              const { toolCalls, content: parsedContent } = parseSubContentList(msg.sub_content_list)

              return {
                  id: msg.id,
                  role: msg.role,
                  // Use parsed content from sub_content_list if available, otherwise fall back to msg.content
                  content: parsedContent || msg.content || "",
                  timestamp: new Date(msg.created_at),
                  toolCalls: toolCalls.length > 0 ? toolCalls : undefined
              }
          })
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
      
      let images: string[] = []
      // Check for pending images from dashboard
      const pendingImages = sessionStorage.getItem('pending_chat_images')
      if (pendingImages) {
          try {
              images = JSON.parse(pendingImages)
              sessionStorage.removeItem('pending_chat_images')
          } catch (e) {
              console.error("Failed to parse pending images", e)
          }
      }

      handleSend(initialMessage, images)
    }
  }, [initialMessage, chatId, credentialsLoading, credentials.orgId])

  const handleSend = async (text: string = input, images: string[] = selectedImages) => {
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
      images: images.length > 0 ? images : undefined
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSelectedImages([])
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
    let thinkingContent = ""
    let followUpQuestions: string[] | undefined
    let newConversationId: string | undefined

    try {
      const stream = aiService.chatStream(text, {
        conversationId,
        orgId: credentials.orgId,
        brandId: credentials.brandId,
        thinkingEnabled,
        includeWebSearch,
        model,
        images
      })

      for await (const chunk of stream) {
          // Handle different event types
          if (chunk.new_conversation) {
              newConversationId = chunk.conversation_id
              setConversationId(newConversationId)
              // Update URL without reloading
              window.history.replaceState(null, '', `/chat/${newConversationId}`)

              // Notify sidebar to refresh chat history
              window.dispatchEvent(new Event('chat-created'))
          }

          // Handle thinking chunks - accumulate them
          if (chunk.thinking !== undefined && chunk.thinking !== null) {
              thinkingContent += chunk.thinking || ""
              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? { ...msg, thinking: thinkingContent }
                      : msg
              ))
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
              const toolInput = chunk.tool_start.tool_input || chunk.tool_start.input || {}
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
                                  state: 'running' as const
                              }
                          ]
                        }
                      : msg
              ))
          }

          if (chunk.tool_end) {
              const toolName = chunk.tool_end.tool || "unknown"
              const toolOutput = chunk.tool_end.output
              const toolArtifact = chunk.tool_end.artifact

              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? {
                          ...msg,
                          toolCalls: (msg.toolCalls || []).map(tc =>
                              // Update the last running tool with this name
                              tc.name === toolName && tc.state === 'running'
                                  ? {
                                      ...tc,
                                      output: toolOutput,
                                      artifact: toolArtifact,
                                      state: 'completed' as const
                                    }
                                  : tc
                          )
                        }
                      : msg
              ))

              // Auto-open artifact panel when artifact is received
              if (toolArtifact) {
                const artifactData: ArtifactData = {
                  id: `${toolName}-${Date.now()}`,
                  type: determineArtifactType(toolArtifact, toolName),
                  title: toolArtifact.title || getToolDisplayName(toolName),
                  data: toolArtifact.data || toolArtifact,
                  toolName,
                  session: toolArtifact.session,
                }
                openArtifact(artifactData)
              }
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

      // Fetch conversation title after first message (title is generated by backend)
      if (newConversationId) {
          // Small delay to allow backend to generate title
          setTimeout(() => {
              loadConversationTitle(newConversationId!)
          }, 1000)
      }
    }
  }

  return (
    <div className="flex h-full bg-background">
      {/* Chat Area */}
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        isPanelOpen ? "mr-0" : ""
      )}>
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
                  <ToolCallList toolCalls={message.toolCalls} />
                )}

                {/* Uploaded Images */}
                {message.images && message.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.images.map((img, i) => (
                      <img key={i} src={img} alt="Uploaded" className="max-w-full h-auto rounded-lg max-h-64 object-contain bg-black/5" />
                    ))}
                  </div>
                )}

                {/* Thinking Content */}
                {message.thinking && (
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-1">Thinking:</div>
                    <div className="text-xs text-gray-600 italic whitespace-pre-wrap">
                      {message.thinking}
                    </div>
                  </div>
                )}

                {/* Message Content with Markdown */}
                {message.content && (
                  <MessageContent
                    content={message.content}
                    isUser={message.role === "user"}
                  />
                )}

                {/* Streaming indicator */}
                {message.isStreaming && !message.content && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex gap-0.5">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                    </span>
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
            <ChatInputArea 
              input={input}
              setInput={setInput}
              onSend={() => handleSend()}
              thinkingEnabled={thinkingEnabled}
              setThinkingEnabled={setThinkingEnabled}
              includeWebSearch={includeWebSearch}
              setIncludeWebSearch={setIncludeWebSearch}
              model={model}
              setModel={setModel}
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
              placeholder={credentialsLoading ? "Loading..." : credentialsError ? "Unable to connect" : "Message Kevin..."}
              disabled={credentialsLoading || !!credentialsError || isThinking}
              isThinking={isThinking}
              showBorder={false}
              className="border-none shadow-none focus-within:ring-0"
            />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Kevin can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
      </div>

      {/* Artifact Panel */}
      <ArtifactPanel />
    </div>
  )
}

// Helper functions for artifact type detection
function determineArtifactType(artifact: any, toolName?: string): "chart" | "code" | "table" | "report" | "data" {
  if (artifact?.type) {
    return artifact.type
  }
  if (toolName) {
    if (toolName.includes("chart") || toolName.includes("analytics")) {
      return "chart"
    }
    if (toolName.includes("code") || toolName.includes("generate")) {
      return "code"
    }
    if (toolName.includes("table") || toolName.includes("data")) {
      return "table"
    }
    if (toolName.includes("report") || toolName.includes("insights") || toolName.includes("performance")) {
      return "report"
    }
  }
  if (artifact?.data) {
    if (Array.isArray(artifact.data)) {
      return "table"
    }
    if (typeof artifact.data === "string" && artifact.data.includes("```")) {
      return "code"
    }
  }
  return "data"
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_account_insights: "Account Insights",
  get_content_performance: "Content Performance",
  search_web: "Web Search Results",
  analyze_competitors: "Competitor Analysis",
  generate_content: "Generated Content",
  schedule_post: "Scheduled Post",
  get_audience_data: "Audience Data",
}

function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] || toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}
