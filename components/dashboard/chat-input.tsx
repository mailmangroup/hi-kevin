"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChatInputArea, UploadedImage, UploadedDocument } from "@/components/chat/chat-input-area"
import { ArtifactProvider } from "@/components/chat/artifact-context"
import { useUserStore } from "@/lib/store/user-store"
import { ReportParametersDialog } from "@/components/analytics/report-parameters-dialog"

interface ChatInputProps {
  projectId?: string
  projectName?: string
  projectDescription?: string
  hideActions?: boolean
}

export function ChatInput({ projectId, projectName, hideActions = false }: ChatInputProps = {}) {
  const [input, setInput] = useState("")
  const [thinkingEnabled, setThinkingEnabled] = useState(false)
  const [includeWebSearch, setIncludeWebSearch] = useState(true)
  const [model, setModel] = useState("qwen-max")
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<UploadedDocument[]>([])
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [fastPath, setFastPath] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const { profile, fetchProfile } = useUserStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const fullName = profile?.full_name

  const handleSend = async () => {
    if (isNavigating) return
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
    if (fastPath) {
      params.set('fastPath', fastPath)
    }

    // If this is for a project, pass the project ID
    if (projectId) {
      params.set('projectId', projectId)
    }

    setIsNavigating(true)
    router.push(`/chat/new?${params.toString()}`)
  }


  const greeting = projectName
    ? projectName
    : fullName
      ? `Hi ${fullName}, how can I help you today?`
      : "How can I help you today?"

  const handleAnalyzeVideo = () => {
    setFastPath("analyze_video")
  }

  const handleGetHelp = () => {
    setFastPath("helpcenter")
  }

  const handleExtractScript = () => {
    setFastPath("extract_video_script")
  }

  const handleAnalyzeAudio = () => {
    setFastPath("analyze_audio")
  }

  const handleCreateReport = () => {
    setIsReportDialogOpen(true)
  }

  return (
    <ArtifactProvider>
      <div className={projectId ? "" : "flex flex-col items-center justify-center space-y-6 py-8"}>
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
                placeholder="Reply..."
                disabled={isNavigating}
                fastPath={fastPath}
              />
          </div>
        ) : (
          // Dashboard layout
          <>
            <h1 className="text-4xl font-semibold text-foreground text-center">{greeting}</h1>

            <div className="w-full max-w-3xl relative">
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
                placeholder=""
                disabled={isNavigating}
                fastPath={fastPath}
              />
            </div>

            {!hideActions && (
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-full bg-white/80 backdrop-blur-sm border-transparent shadow-sm hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-200 transition-all"
                  onClick={handleAnalyzeVideo}
                >
                  Analyze Video
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full bg-white/80 backdrop-blur-sm border-transparent shadow-sm hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-200 transition-all"
                  onClick={handleExtractScript}
                >
                  Extract Script
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full bg-white/80 backdrop-blur-sm border-transparent shadow-sm hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-200 transition-all"
                  onClick={handleAnalyzeAudio}
                >
                  Analyze Audio
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full bg-white/80 backdrop-blur-sm border-transparent shadow-sm hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-200 transition-all"
                  onClick={handleGetHelp}
                >
                  Get Help
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full bg-white/80 backdrop-blur-sm border-transparent shadow-sm hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-200 transition-all"
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
