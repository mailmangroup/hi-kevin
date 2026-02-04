"use client"

import * as React from "react"
import { FileText, CheckCircle2, AlertCircle, Loader2 as LoaderIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { aiService, Message as ApiMessage } from "@/lib/api/client"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/lib/store/user-store"
import { ArtifactProvider, useArtifact, ArtifactData } from "@/components/chat/artifact-context"
import { ChatInputArea, UploadedImage, UploadedDocument } from "@/components/chat/chat-input-area"
import { ArtifactPanel } from "@/components/chat/artifact-panel"
import { MessageContent } from "@/components/chat/message-content"
import { ThinkingDisplay } from "@/components/chat/thinking-display"
import { ToolCallDisplay, ToolCallList } from "@/components/chat/tool-call-display"
import { ArtifactSnippet } from "@/components/chat/artifact-snippet"
import { formatFileSize, getFileTypeDisplay, getFileColor, truncateFilename } from "@/lib/utils/file-helpers"

// Types
export interface ContentPart {
  type: "text" | "thinking" | "tool"
  content?: string
  tool?: ToolCall
}

export interface ToolCall {
  id: string
  name: string
  input: any
  output?: any
  state: 'running' | 'completed' | 'failed'
  artifact?: any
}

export interface Message {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  images?: string[]
  documents?: any[]
  contentParts?: ContentPart[]
  thinking?: string
  report?: any
  isStreaming?: boolean
  followUpQuestions?: string[]
}

interface ChatInterfaceProps {
  initialMessage?: string
  chatId?: string
  projectId?: string
}

export function ChatInterface({ initialMessage, chatId, projectId }: ChatInterfaceProps) {
  return (
    <ArtifactProvider>
      <ChatInterfaceInner initialMessage={initialMessage} chatId={chatId} projectId={projectId} />
    </ArtifactProvider>
  )
}

function ChatInterfaceInner({ initialMessage, chatId, projectId }: ChatInterfaceProps) {
  const { openArtifact, isPanelOpen, reportNavigation, selectedArtifact } = useArtifact()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const [conversationId, setConversationId] = React.useState<string | undefined>(chatId)
  const [project, setProject] = React.useState<{ id: string, name: string } | null>(null)
  const [conversationTitle, setConversationTitle] = React.useState<string>("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const initialized = React.useRef(false)
  const justCreatedConversationId = React.useRef<string | null>(null)
  const searchParams = useSearchParams()
  const initialQuery = React.useMemo(() => {
    return initialMessage ?? searchParams?.get('q') ?? undefined
  }, [initialMessage, searchParams])

  const { profile, fetchProfile, isLoading: isProfileLoading } = useUserStore()

  React.useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const credentials = React.useMemo(() => ({
    orgId: profile?.kawo_org_id || undefined,
    brandId: profile?.kawo_brand_id || undefined
  }), [profile])

  const credentialsLoading = isProfileLoading && !profile

  const credentialsError = React.useMemo(() => {
      // In dev mode, we might not have a profile but still have env vars
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev && !profile && !isProfileLoading) return null // Let dev mode logic handle it or assume it's fine if user store handled it (user store handles dev env)
      
      if (isProfileLoading) return null
      if (!profile) return "Please log in to continue."
      if (!profile.kawo_org_id) return "KAWO credentials not found. Please connect your KAWO account in settings."
      return null
  }, [isProfileLoading, profile])

  // Listen for external requests to focus input (e.g. from artifact panel)
  React.useEffect(() => {
      const handleFocusInput = (e: Event) => {
          const customEvent = e as CustomEvent<{ text?: string }>
          if (customEvent.detail?.text) {
              setInput(prev => {
                  if (!prev.trim()) return customEvent.detail.text!
                  return prev + "\n" + customEvent.detail.text
              })
          }
          
          setTimeout(() => {
              const textarea = document.querySelector('textarea')
              if (textarea) {
                  textarea.focus()
                  // Move cursor to end
                  textarea.setSelectionRange(textarea.value.length, textarea.value.length)
              }
          }, 100)
      }

      window.addEventListener('chat-focus-input', handleFocusInput)
      return () => window.removeEventListener('chat-focus-input', handleFocusInput)
  }, [])

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
  const [fastPath, setFastPath] = React.useState<string | undefined>(() => {
    return searchParams?.get('fastPath') || undefined
  })

  // Image upload
  const [selectedImages, setSelectedImages] = React.useState<UploadedImage[]>([])

  // Document upload
  const [selectedDocuments, setSelectedDocuments] = React.useState<UploadedDocument[]>([])

  // Report context (for chatting with reports)
  const [reportId, setReportId] = React.useState<string | undefined>()

  React.useEffect(() => {
    if (chatId) {
      // If we just created this conversation locally and are already streaming,
      // don't reload history as it would overwrite the current streaming state.
      if (justCreatedConversationId.current === chatId) {
        return
      }

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
              document.title = `${conversation.title} - Kevin`
              // Notify sidebar to refresh chat history (title may have been generated)
              window.dispatchEvent(new Event('chat-title-updated'))
          }

          // Handle project context
          if (conversation?.project_id) {
             try {
                 const projectData = await aiService.getProject(conversation.project_id)
                 setProject({ id: projectData.id, name: projectData.name })
             } catch (e) {
                 console.error("Failed to load project details", e)
             }
          }
      } catch (error) {
          console.error("Failed to load conversation title:", error)
      }
  }

  // Load project details if projectId prop is provided (e.g. new chat from project)
  React.useEffect(() => {
    if (projectId) {
       aiService.getProject(projectId)
         .then(p => setProject({ id: p.id, name: p.name }))
         .catch(err => console.error("Failed to load project", err))
    }
  }, [projectId])

  const loadHistory = async (id: string) => {
      try {
          const { messages: history } = await aiService.getMessages(id)
          const formattedMessages: Message[] = history.map((msg: ApiMessage) => {
              // Parse sub_content_list if available
              const { toolCalls, content: parsedContent, images, documents, contentParts } = parseSubContentList(msg.sub_content_list)

              return {
                  id: msg.id,
                  role: msg.role,
                  // Use parsed content from sub_content_list if available, otherwise fall back to msg.content
                  content: parsedContent || msg.content || "",
                  timestamp: new Date(msg.created_at),
                  toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                  images: images.length > 0 ? images : undefined,
                  documents: documents.length > 0 ? documents : undefined,
                  contentParts: contentParts.length > 0 ? contentParts : undefined,
                  report: msg.report
              }
          })
          // Sort by timestamp ascending (oldest first)
          formattedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          
          setMessages(prev => {
              // Create a Set of IDs from the fetched history for O(1) lookup
              const historyIds = new Set(formattedMessages.map(m => m.id))
              
              // Identify local/optimistic messages that are NOT in the fetched history
              // Local messages typically have numeric timestamp-based IDs (e.g. "1741234567890")
              // while DB messages have MongoDB ObjectIds or UUIDs.
              const localMessages = prev.filter(m => !historyIds.has(m.id))
              
              // Special handling for race condition:
              // If we have a local streaming message, we must preserve it.
              // We also want to avoid duplicates if the DB history caught the new user message
              // but we still have the local version of it.
              
              const hasStreamingMessage = localMessages.some(m => m.isStreaming)
              
              if (hasStreamingMessage) {
                  // If we are streaming, we prioritize local state for the recent messages.
                  // We merge history + local, but filter out history messages that look like duplicates of local ones
                  // (based on content/role proximity) to avoid "double vision".
                  
                  // For now, simple merge is safer than complex dedup which might delete wrong things.
                  // Local messages are appended.
                  // If DB caught the user message, we might have a duplicate user message, 
                  // but we keep the streaming assistant message which is critical.
                  return [...formattedMessages, ...localMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
              }
              
              // If not streaming, we can trust history more, but still keep purely local messages
              // (e.g. just typed user message that hasn't hit DB yet)
              return [...formattedMessages, ...localMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          })

          // Detect if this conversation contains a report
          const reportMessage = history.find((msg: ApiMessage) => msg.report_id || msg.report)
          if (reportMessage) {
              const detectedReportId = reportMessage.report_id || reportMessage.report?.id
              if (detectedReportId) {
                  setReportId(detectedReportId)
                  console.log('[Chat] Detected report in conversation:', detectedReportId)

                  // Fetch full report content
                  try {
                      const reportData = await aiService.getReport(id, detectedReportId)
                      if (reportData) {
                          const reportArtifact: ArtifactData = {
                              id: reportData.id || detectedReportId,
                              type: 'report',
                              title: reportData.title || 'Brand Report',
                              data: reportData
                          }
                          openArtifact(reportArtifact)
                      }
                  } catch (err) {
                      console.error("Failed to fetch report content:", err)
                  }
              }
          }
      } catch (error) {
          console.error("Failed to load history:", error)
      }
  }

  // Handle initial message (from new chat redirect or dashboard with documents)
  React.useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development'
    
    if (initialized.current || credentialsLoading || (!credentials.orgId && !isDev)) {
        return
    }

    // Check for pending images from dashboard
    const pendingImages = sessionStorage.getItem('pending_chat_images')
    let images: UploadedImage[] = []
    if (pendingImages) {
        try {
            images = JSON.parse(pendingImages)
            sessionStorage.removeItem('pending_chat_images')
            setSelectedImages(images)
        } catch (e) {
            console.error("Failed to parse pending images", e)
        }
    }

    // Check for pending documents from dashboard
    const pendingDocuments = sessionStorage.getItem('pending_chat_documents')
    let documents: UploadedDocument[] = []
    if (pendingDocuments) {
        try {
            documents = JSON.parse(pendingDocuments)
            sessionStorage.removeItem('pending_chat_documents')
            setSelectedDocuments(documents)
        } catch (e) {
            console.error("Failed to parse pending documents", e)
        }
    }

    // If we have content to send (text or files)
    // Check initialMessage !== undefined to allow empty string (for file-only messages)
    if (initialQuery !== undefined || images.length > 0 || documents.length > 0) {
        initialized.current = true
        
        if (initialQuery) {
            setInput(initialQuery)
        }

        // Automatically send the message
        handleSend(initialQuery || "", images, documents)
    }
  }, [initialQuery, chatId, credentialsLoading, credentials.orgId])

  const handleStop = async () => {
    if (conversationId) {
      try {
        await aiService.stopChat(conversationId)
      } catch (error) {
        console.error("Failed to stop chat:", error)
      }
    }
    setIsThinking(false)
  }

  const handleSend = async (text: string = input, images: UploadedImage[] = selectedImages, documents: UploadedDocument[] = selectedDocuments) => {
    if ((!text.trim() && images.length === 0 && documents.length === 0) || isThinking) return

    // Don't send if credentials are still loading or missing
    // Bypass check in development mode to allow local testing with env vars
    const isDev = process.env.NODE_ENV === 'development'
    if (credentialsLoading || (!credentials.orgId && !isDev)) {
      console.error("Cannot send message: credentials not ready")
      return
    }

    // Check if any images are still uploading
    const uploadingImages = images.filter(img => img.uploading)
    if (uploadingImages.length > 0) {
      console.warn("Cannot send message: images are still uploading")
      return
    }

    // Check if any documents are still uploading
    // We allow sending while processing (vectorization), but not while uploading to OSS
    const uploadingDocs = documents.filter(doc => doc.uploading)
    if (uploadingDocs.length > 0) {
      console.warn("Cannot send message: documents are still uploading")
      return
    }

    // Check if any images failed to upload (no OSS key)
    const failedImages = images.filter(img => !img.uploading && !img.key)
    if (failedImages.length > 0) {
      console.error("Cannot send message: some images failed to upload. Please remove them and try again.")
      return
    }

    // Check if any documents failed
    const failedDocs = documents.filter(doc => doc.error || doc.processingStatus === 'failed')
    if (failedDocs.length > 0) {
      console.error("Cannot send message: some documents failed to process. Please remove them and try again.")
      return
    }

    // Filter images to only those with successful OSS keys
    const validImages = images.filter(img => img.key)

    // Filter documents to only successfully uploaded ones (including processing)
    const validDocuments = documents.filter(doc => doc.documentId && doc.processingStatus !== 'failed')

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
      images: validImages.length > 0 ? validImages.map(img => img.url) : undefined,
      documents: validDocuments.length > 0 ? validDocuments.map(doc => ({
        id: doc.documentId!,
        filename: doc.filename,
        file_size: doc.file.size,
        processing_status: doc.processingStatus!,
        chunk_strategy: doc.chunkStrategy
      })) : undefined
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSelectedImages([])
    setSelectedDocuments([])
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
    // Track content parts in order for proper rendering
    let contentParts: ContentPart[] = []
    let currentTextContent = ""  // Track current text segment
    let lastPartWasText = false  // Track if the last part was text (for appending)
    let currentThinkingContent = "" // Track current thinking segment
    let lastPartWasThinking = false // Track if the last part was thinking

    let activeConversationId = conversationId;

    try {
      // Ensure conversation exists and documents are attached
      // We attach even if processing, so the backend knows about them
      const validDocuments = documents.filter(doc => doc.documentId && doc.processingStatus !== 'failed')
      
      if (validDocuments.length > 0) {
          if (!activeConversationId) {
              // Create new conversation explicitly to attach documents
              const resp = await aiService.createConversation(credentials.orgId, credentials.brandId);
              activeConversationId = resp.conversation_id;
              setConversationId(activeConversationId);
              
              // Update URL without reloading
              window.history.replaceState(window.history.state, '', `/chat/${activeConversationId}`);
              
              // Notify sidebar
              window.dispatchEvent(new Event('chat-created'));
          }
          
          // Attach documents
          await aiService.attachDocuments(
              activeConversationId,
              validDocuments.map(doc => doc.documentId!)
          );
      }

      const stream = aiService.chatStream(text, {
        conversationId: activeConversationId,
        projectId: projectId,
        orgId: credentials.orgId,
        brandId: credentials.brandId,
        thinkingEnabled,
        includeWebSearch,
        model,
        images: validImages.map(img => img.key!), // Only send OSS keys
        documentIds: validDocuments.map(doc => doc.documentId!), // Send document IDs
        reportContext: reportId ? {
            report_id: reportId,
            report_page_number: reportNavigation?.pageNumber,
            report_section_indexes: reportNavigation?.sectionIndexes
        } : undefined, // Include report context if available
        fastPath
      })

      for await (const chunk of stream) {
          // Handle different event types
          if (chunk.new_conversation) {
              newConversationId = chunk.conversation_id
              justCreatedConversationId.current = newConversationId || null
              setConversationId(newConversationId)
              // Update URL without reloading
              window.history.replaceState(window.history.state, '', `/chat/${newConversationId}`)

              // Notify sidebar to refresh chat history
              window.dispatchEvent(new Event('chat-created'))
          }

          // Handle thinking chunks - accumulate them and add to contentParts
          if (chunk.thinking !== undefined && chunk.thinking !== null) {
              thinkingContent += chunk.thinking || ""
              currentThinkingContent += chunk.thinking || ""

              // Update contentParts - append to last thinking part or create new one
              if (lastPartWasThinking && contentParts.length > 0) {
                  // Update the last thinking part
                  const lastPart = contentParts[contentParts.length - 1]
                  if (lastPart.type === "thinking") {
                      lastPart.content = currentThinkingContent
                  }
              } else {
                  // Create a new thinking part
                  contentParts.push({ type: "thinking", content: currentThinkingContent })
                  lastPartWasThinking = true
                  lastPartWasText = false
              }

              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? { ...msg, thinking: thinkingContent, contentParts: [...contentParts] }
                      : msg
              ))
          }

          if (chunk.content) {
              fullContent += chunk.content
              currentTextContent += chunk.content

              // Update contentParts - append to last text part or create new one
              if (lastPartWasText && contentParts.length > 0) {
                  // Update the last text part
                  const lastPart = contentParts[contentParts.length - 1]
                  if (lastPart.type === "text") {
                      lastPart.content = currentTextContent
                  }
              } else {
                  // Create a new text part
                  contentParts.push({ type: "text", content: currentTextContent })
                  lastPartWasText = true
                  lastPartWasThinking = false
              }

              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? { ...msg, content: fullContent, contentParts: [...contentParts] }
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

              const newTool: ToolCall = {
                  id: toolId,
                  name: toolName,
                  input: toolInput,
                  state: 'running' as const
              }

              // Add tool to contentParts and reset text tracking
              contentParts.push({ type: "tool", tool: newTool })
              lastPartWasText = false
              lastPartWasThinking = false
              currentTextContent = ""  // Reset for any text that comes after this tool
              currentThinkingContent = "" // Reset for any thinking that comes after this tool

              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? {
                          ...msg,
                          toolCalls: [...(msg.toolCalls || []), newTool],
                          contentParts: [...contentParts]
                        }
                      : msg
              ))
          }

          if (chunk.tool_end) {
              const toolName = chunk.tool_end.tool || "unknown"
              const toolOutput = chunk.tool_end.output
              const toolArtifact = chunk.tool_end.artifact

              // Update both toolCalls array and the tool in contentParts
              setMessages((prev) => prev.map(msg => {
                  if (msg.id !== assistantMsgId) return msg

                  const updatedToolCalls = (msg.toolCalls || []).map(tc =>
                      tc.name === toolName && tc.state === 'running'
                          ? { ...tc, output: toolOutput, artifact: toolArtifact, state: 'completed' as const }
                          : tc
                  )

                  // Also update the tool in contentParts (they share the same reference)
                  const updatedContentParts = (msg.contentParts || []).map((part): ContentPart => {
                      if (part.type === "tool" && part.tool && part.tool.name === toolName && part.tool.state === 'running') {
                          return {
                              ...part,
                              tool: { ...part.tool, output: toolOutput, artifact: toolArtifact, state: 'completed' as const }
                          }
                      }
                      return part
                  })

                  // Update our local contentParts reference too
                  contentParts = updatedContentParts

                  return { ...msg, toolCalls: updatedToolCalls, contentParts: updatedContentParts }
              }))

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

          if (chunk.report) {
              const reportData = chunk.report

              // Update message with report data
              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? { ...msg, report: reportData }
                      : msg
              ))

              // Set report ID for future messages in this conversation
              const detectedReportId = reportData.id || chunk.report_id
              if (detectedReportId && !reportId) {
                  setReportId(detectedReportId)
                  console.log('[Chat] Report generated in conversation:', detectedReportId)
              }

              // Create artifact and open it
              const reportArtifact: ArtifactData = {
                  id: reportData.id || Date.now().toString(),
                  type: 'report',
                  title: reportData.title || 'Brand Report',
                  data: reportData
              }
              openArtifact(reportArtifact)
          }



          if (chunk.error) {
              fullContent += `\n[Error: ${chunk.error}]`
              currentTextContent += `\n[Error: ${chunk.error}]`

              if (lastPartWasText && contentParts.length > 0) {
                  const lastPart = contentParts[contentParts.length - 1]
                  if (lastPart.type === "text") {
                      lastPart.content = currentTextContent
                  }
              } else {
                  contentParts.push({ type: "text", content: currentTextContent })
                  lastPartWasText = true
                  lastPartWasThinking = false
              }

              setMessages((prev) => prev.map(msg =>
                  msg.id === assistantMsgId
                      ? { ...msg, content: fullContent, contentParts: [...contentParts] }
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

      // Clear one-time flags after first use
      if (fastPath) {
        setFastPath(undefined)

        // Remove flags from URL to keep it clean
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.delete('fastPath')
        currentUrl.searchParams.delete('analyzePost')
        currentUrl.searchParams.delete('helpcenterQuery')
        window.history.replaceState(window.history.state, '', currentUrl.toString())
      }

      // Fetch conversation title after first message (title is generated by backend)
      if (newConversationId) {
          // Small delay to allow backend to generate title
          setTimeout(() => {
              loadConversationTitle(newConversationId!)
          }, 1000)
          
          // Reset the justCreatedConversationId after streaming is done
          // This allows future navigation back to this conversation to properly load history
          setTimeout(() => {
            if (justCreatedConversationId.current === newConversationId) {
              justCreatedConversationId.current = null
            }
          }, 2000)
      }
    }
  }

  const isReportOpen = isPanelOpen && selectedArtifact?.type === 'report' && selectedArtifact?.data?.pages

  return (
    <div className="flex h-full min-h-0 bg-transparent">
      {/* Chat Area */}
      <div className={cn(
        "flex flex-col h-full min-h-0 transition-all duration-300",
        isReportOpen ? "w-[450px] flex-shrink-0 border-r border-border" : "flex-1",
        isPanelOpen && !isReportOpen ? "mr-0" : ""
      )}>
        {/* Project Breadcrumb */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-transparent px-6 py-3 text-sm sticky top-0 z-10">
          {project && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                  {project.name}
                </Link>
              </div>
              <span className="text-muted-foreground/40">/</span>
            </>
          )}
          <span className="font-medium text-foreground truncate max-w-[300px]">
              {conversationTitle || "Chat"}
          </span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar for AI */}
              {/* {message.role !== "user" && (
                <div className="flex-shrink-0 mt-1">
                   <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-200 shadow-sm">
                     <span className="text-lg">🤖</span>
                   </div>
                </div>
              )} */}

              {/* Content */}
              <div
                className={cn(
                  "relative max-w-[80%] text-sm leading-relaxed overflow-hidden",
                  message.role === "user"
                    ? "bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-[0_8px_24px_rgba(99,102,241,0.25)] rounded-2xl rounded-tr-sm text-white px-5 py-3"
                    : "glass-premium border border-white/20 rounded-[2rem] rounded-tl-sm p-6 shadow-[0_8px_30px_rgba(30,58,138,0.1)] text-foreground"
                )}
              >
                {/* Light Leak for Assistant Message */}
                {message.role !== "user" && (
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-[inherit] pointer-events-none z-0">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/5 blur-[60px] rounded-full" />
                  </div>
                )}
                
                <div className="relative z-10">
                {/* Uploaded Images */}
                {message.images && message.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.images.map((img, i) => (
                      <img key={i} src={img} alt="Uploaded" className="max-w-full h-auto rounded-lg max-h-64 object-contain bg-black/5" />
                    ))}
                  </div>
                )}

                {/* Uploaded Documents */}
                {message.documents && message.documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.documents.map((doc, i) => {
                      const fileColor = getFileColor(doc.filename)
                      const getColorClass = (color: string) => {
                        const colorMap: Record<string, string> = {
                          red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
                          blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                          orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
                          green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
                          gray: 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
                          purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                          yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
                        }
                        return colorMap[color] || colorMap['gray']
                      }

                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border",
                            getColorClass(fileColor)
                          )}
                        >
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {truncateFilename(doc.filename, 25)}
                            </div>
                            <div className="text-[10px] opacity-70">
                              {getFileTypeDisplay(doc.filename)} • {formatFileSize(doc.file_size)}
                              {doc.chunk_strategy && (
                                <span className="ml-1">
                                  • {doc.chunk_strategy === 'full_text' ? 'Full text' : 'Vectorized'}
                                </span>
                              )}
                            </div>
                          </div>
                          {doc.processing_status === 'completed' && (
                            <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          )}
                          {(doc.processing_status === 'processing' || doc.processing_status === 'pending') && (
                            <LoaderIcon className="h-3 w-3 animate-spin flex-shrink-0" />
                          )}
                          {doc.processing_status === 'failed' && (
                            <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Report Snippet */}
                {message.report && (
                  <div className="mb-3">
                    <ArtifactSnippet 
                      artifact={{
                        type: 'report',
                        title: message.report.title || "Brand Report",
                        data: message.report,
                        id: message.report.id
                      }}
                      toolName="report"
                    />
                  </div>
                )}


                {/* Content Parts - renders tool calls, thinking, and text in order */}
                {message.contentParts && message.contentParts.length > 0 ? (
                  <>
                    {message.contentParts.map((part, index) => (
                      <React.Fragment key={index}>
                        {part.type === "tool" ? (
                          <div className="mb-3">
                            <ToolCallDisplay tool={part.tool!} />
                          </div>
                        ) : part.type === "thinking" ? (
                          <ThinkingDisplay
                            content={part.content || ""}
                            isStreaming={message.isStreaming}
                          />
                        ) : (
                          <MessageContent
                            content={part.content || ""}
                            isUser={message.role === "user"}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Fallback: Tool Calls at top (legacy behavior) */}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <ToolCallList toolCalls={message.toolCalls} />
                    )}

                    {/* Message Content with Markdown */}
                    {message.content && (
                      <MessageContent
                        content={message.content}
                        isUser={message.role === "user"}
                      />
                    )}
                  </>
                )}

                {/* Streaming indicator */}
                {message.isStreaming && !message.content && !message.contentParts?.length && (
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
                                    className="text-left text-xs text-primary hover:bg-primary/5 px-3 py-2 rounded-lg border border-primary/20 transition-colors bg-white dark:bg-gray-800"
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
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 z-20 pointer-events-none">
        <div className="mx-auto max-w-3xl pointer-events-auto">
          {messages.length === 0 && (
            <div className="mb-8 text-center">
               <h2 className="text-2xl font-semibold text-foreground">How can I help you?</h2>
            </div>
          )}

          {credentialsError && (
            <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-300">
              {credentialsError}
            </div>
          )}

          {/* Mode Indicators */}
          {(fastPath) && (
            <div className="mb-3 flex gap-2">
              {fastPath === 'analyze_video' && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Analyze Video Mode
                </div>
              )}
              {fastPath === 'helpcenter' && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Help Center Mode
                </div>
              )}
              {fastPath === 'extract_video_script' && (
                 <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                  Extract Video Script Mode
                </div>
              )}
              {fastPath === 'analyze_audio' && (
                 <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  Analyze Audio Mode
                </div>
              )}
            </div>
          )}

          <ChatInputArea
            input={input}
            setInput={setInput}
            onSend={() => handleSend()}
            onStop={handleStop}
            thinkingEnabled={thinkingEnabled}
            setThinkingEnabled={setThinkingEnabled}
            includeWebSearch={includeWebSearch}
            setIncludeWebSearch={setIncludeWebSearch}
            model={model}
            setModel={setModel}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            selectedDocuments={selectedDocuments}
            setSelectedDocuments={setSelectedDocuments}
            conversationId={conversationId}
            placeholder={credentialsLoading ? "Loading..." : credentialsError ? "Unable to connect" : "Message Kevin..."}
            disabled={credentialsLoading || !!credentialsError || isThinking}
            isThinking={isThinking}
            showBorder={true}
          />
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

function parseSubContentList(subContentList: any[] = []): {
  toolCalls: ToolCall[],
  content: string,
  images: string[],
  documents: any[],
  contentParts: ContentPart[]
} {
  const toolCalls: ToolCall[] = []
  const images: string[] = []
  const documents: any[] = []
  const contentParts: ContentPart[] = []
  const incompleteToolCalls = new Map<string, ToolCall>()
  let lastToolCall: ToolCall | null = null
  let textContent = ""

  if (!Array.isArray(subContentList)) {
    return { toolCalls, content: textContent, images, documents, contentParts }
  }

  for (const item of subContentList) {
    if (item.type === 'tool_call' || item.type === 'tool_use') {
      const toolCall: ToolCall = {
        id: item.id || Date.now().toString(),
        name: item.name || item.tool,
        input: item.input || item.args || {},
        output: item.output,
        state: item.output ? 'completed' : 'running', // Assume completed if output exists in history
        artifact: item.artifact
      }
      toolCalls.push(toolCall)
      contentParts.push({ type: 'tool', tool: toolCall })
      
      if (toolCall.state === 'running') {
         if (toolCall.id) incompleteToolCalls.set(toolCall.id, toolCall)
         lastToolCall = toolCall
      }
    } else if (item.type === 'tool_input') {
      const id = item.tool_call_id || Date.now().toString()
      const toolCall: ToolCall = {
        id: id,
        name: item.tool,
        input: item.tool_input || {},
        state: 'running'
      }
      toolCalls.push(toolCall)
      contentParts.push({ type: 'tool', tool: toolCall })
      
      incompleteToolCalls.set(id, toolCall)
      lastToolCall = toolCall
    } else if (item.type === 'tool_output') {
       // Try to find matching tool call
       let toolCall: ToolCall | undefined
       
       if (item.tool_call_id) {
           toolCall = incompleteToolCalls.get(item.tool_call_id)
       }
       
       // Fallback to last tool call if no ID match or ID not provided, 
       // but only if name matches
       if (!toolCall && lastToolCall && lastToolCall.name === item.tool) {
           toolCall = lastToolCall
       }
       
       if (toolCall) {
           toolCall.output = item.tool_output
           toolCall.state = 'completed'
           if (item.artifact) {
               toolCall.artifact = item.artifact
           }
           // Remove from incomplete map since it's done
           if (toolCall.id) incompleteToolCalls.delete(toolCall.id)
       }
    } else if (item.type === 'image') {
      if (item.url) images.push(item.url)
    } else if (item.type === 'document') {
      documents.push(item)
    } else if (item.type === 'text' || item.type === 'assistant_message' || item.type === 'user_message') {
      textContent += item.text || item.content || ""
      contentParts.push({ type: 'text', content: item.text || item.content })
    } else if (item.type === 'thinking') {
      contentParts.push({ type: 'thinking', content: item.thinking || item.content })
    }
  }

  return { toolCalls, content: textContent, images, documents, contentParts }
}
