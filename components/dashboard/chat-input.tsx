"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChatInputArea, UploadedImage, UploadedDocument } from "@/components/chat/chat-input-area"
import { ArtifactProvider } from "@/components/chat/artifact-context"
import { useUserStore } from "@/lib/store/user-store"
import { aiService } from "@/lib/api/client"
import { ReportParametersDialog } from "@/components/analytics/report-parameters-dialog"
import { useCreateProjectConversation } from "@/lib/hooks/use-projects"

interface ChatInputProps {
  projectId?: string
  projectName?: string
  projectDescription?: string
  hideActions?: boolean
}

export function ChatInput({ projectId, projectName, projectDescription, hideActions = false }: ChatInputProps = {}) {
  const [input, setInput] = useState("")
  const [thinkingEnabled, setThinkingEnabled] = useState(false)
  const [includeWebSearch, setIncludeWebSearch] = useState(true)
  const [model, setModel] = useState("qwen-max")
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<UploadedDocument[]>([])
  const [conversationId, setConversationId] = useState<string>()
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [analyzePost, setAnalyzePost] = useState(false)
  const [helpcenterQuery, setHelpcenterQuery] = useState(false)
  const router = useRouter()
  const createProjectConversation = useCreateProjectConversation()

  const { profile, fetchProfile } = useUserStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const fullName = profile?.full_name

  const handleSend = () => {
    if (!input.trim() && selectedImages.length === 0 && selectedDocuments.length === 0) return

    // Check if any images are still uploading
    const uploadingImages = selectedImages.filter(img => img.uploading)
    if (uploadingImages.length > 0) {
      console.warn("Cannot send message: images are still uploading")
      return
    }

    // Check if any documents are still uploading/processing
    const uploadingDocs = selectedDocuments.filter(doc => doc.uploading || doc.processing)
    if (uploadingDocs.length > 0) {
      console.warn("Cannot send message: documents are still processing")
      return
    }

    // Check if any images failed to upload (no OSS key)
    const failedImages = selectedImages.filter(img => !img.uploading && !img.key)
    if (failedImages.length > 0) {
      console.error("Cannot send message: some images failed to upload. Please remove them and try again.")
      return
    }

    // Check if any documents failed
    const failedDocs = selectedDocuments.filter(doc => doc.error || doc.processingStatus === 'failed')
    if (failedDocs.length > 0) {
      console.error("Cannot send message: some documents failed to process. Please remove them and try again.")
      return
    }

    // Filter images to only those with successful OSS keys
    const validImages = selectedImages.filter(img => img.key)

    // Filter documents to only successfully processed ones
    const validDocuments = selectedDocuments.filter(doc => doc.documentId && doc.processingStatus === 'completed')

    // Save valid images to session storage if any
    if (validImages.length > 0) {
        sessionStorage.setItem('pending_chat_images', JSON.stringify(validImages))
    }

    // Save valid documents to session storage if any
    if (validDocuments.length > 0) {
        sessionStorage.setItem('pending_chat_documents', JSON.stringify(validDocuments))
    }

    const params = new URLSearchParams({
      q: input,
      thinking: thinkingEnabled.toString(),
      search: includeWebSearch.toString(),
      model
    })

    // Add one-time flags if active
    if (analyzePost) {
      params.set('analyzePost', 'true')
    }
    if (helpcenterQuery) {
      params.set('helpcenterQuery', 'true')
    }

    // If this is for a project, create a project conversation first
    if (projectId) {
      createProjectConversation.mutate(projectId, {
        onSuccess: (data) => {
          router.push(`/chat/${data.conversation_id}?${params.toString()}`)
        }
      })
    } else if (conversationId) {
      // If we have a conversationId (from document uploads), navigate to that conversation
      router.push(`/chat/${conversationId}?${params.toString()}`)
    } else {
      // Otherwise, create a new chat
      router.push(`/chat/new?${params.toString()}`)
    }
  }

  const greeting = projectName
    ? projectName
    : fullName
      ? `Hi ${fullName}, how can I help you today?`
      : "How can I help you today?"

  const handleAnalyzeVideo = () => {
    setAnalyzePost(true)
    setHelpcenterQuery(false)
  }

  const handleGetHelp = () => {
    setHelpcenterQuery(true)
    setAnalyzePost(false)
  }

  const handleCreateReport = () => {
    setIsReportDialogOpen(true)
  }

  return (
    <ArtifactProvider>
      <div className={projectId ? "" : "flex flex-col items-center justify-center space-y-8 py-10"}>
        {projectId ? (
          // Project page layout
          <div className="w-full">
            <ChatInputArea
                input={input}
                setInput={setInput}
                onSend={handleSend}
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
                placeholder="Reply..."
                disabled={createProjectConversation.isPending}
              />
          </div>
        ) : (
          // Dashboard layout
          <>
            <h1 className="text-4xl font-semibold text-foreground text-center">{greeting}</h1>

            <div className="w-full max-w-2xl relative">
              {/* Mode Indicators */}
              {(analyzePost || helpcenterQuery) && (
                <div className="mb-3 flex gap-2">
                  {analyzePost && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      Analyze Video Mode
                    </div>
                  )}
                  {helpcenterQuery && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      Help Center Mode
                    </div>
                  )}
                </div>
              )}

              <ChatInputArea
                input={input}
                setInput={setInput}
                onSend={handleSend}
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
                placeholder=""
              />
            </div>

            {!hideActions && (
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-full bg-white/50 hover:bg-white"
                  onClick={handleAnalyzeVideo}
                >
                  Analyze Video
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full bg-white/50 hover:bg-white"
                  onClick={handleGetHelp}
                >
                  Get Help
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full bg-white/50 hover:bg-white"
                  onClick={handleCreateReport}
                >
                  Create Report
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {!projectId && (
        <ReportParametersDialog
          open={isReportDialogOpen}
          onOpenChange={setIsReportDialogOpen}
        />
      )}
    </ArtifactProvider>
  )
}
