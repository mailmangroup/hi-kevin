"use client"

import * as React from "react"
import { Send, Brain, Globe, X, ArrowUp, Loader2, Square, File, FileText, CheckCircle2, AlertCircle, Image as ImageIcon, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { compressImage } from "@/lib/utils/image-compression"
import {
  validateFile,
  formatFileSize,
  getFileTypeDisplay,
  getFileColor,
  truncateFilename
} from "@/lib/utils/file-helpers"
import { aiService } from "@/lib/api/client"

export interface UploadedImage {
  id: string
  url: string // Preview URL (blob:...) or remote URL
  key?: string // OSS Key
  file?: File
  uploading: boolean
  error?: boolean
}

export interface UploadedDocument {
  id: string
  documentId?: string // Backend document ID
  filename: string
  file: File
  key?: string // OSS Key
  uploading: boolean
  processing: boolean
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  chunkStrategy?: 'full_text' | 'vectorized'
  error?: string
}

export interface ChatInputAreaProps {
  input: string
  setInput: (value: string) => void
  onSend: () => void
  onStop?: () => void
  thinkingEnabled: boolean
  setThinkingEnabled: (enabled: boolean) => void
  includeWebSearch: boolean
  setIncludeWebSearch: (enabled: boolean) => void
  model: string
  setModel: (model: string) => void
  selectedImages: UploadedImage[]
  setSelectedImages: (images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void
  selectedDocuments?: UploadedDocument[]
  setSelectedDocuments?: (documents: UploadedDocument[] | ((prev: UploadedDocument[]) => UploadedDocument[])) => void
  conversationId?: string // Needed for document upload
  className?: string
  placeholder?: string
  disabled?: boolean
  isThinking?: boolean
  showBorder?: boolean
}

import { useArtifact } from "./artifact-context"
import { useToast } from "@/components/ui/toast"

export function ChatInputArea({
  input,
  setInput,
  onSend,
  onStop,
  thinkingEnabled,
  setThinkingEnabled,
  includeWebSearch,
  setIncludeWebSearch,
  model,
  setModel,
  selectedImages,
  setSelectedImages,
  selectedDocuments = [],
  setSelectedDocuments,
  conversationId,
  className,
  placeholder = "Message Kevin...",
  disabled = false,
  isThinking = false,
  showBorder = true
}: ChatInputAreaProps) {
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const documentInputRef = React.useRef<HTMLInputElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const { reportNavigation, selectedArtifact } = useArtifact()
  const { toast } = useToast()

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [input])

  // Track global uploading state to disable send button if any file is uploading
  const isImageUploading = selectedImages.some(img => img.uploading)
  // We allow sending while processing (vectorization), but not while uploading to OSS
  const isDocumentUploading = selectedDocuments.some(doc => doc.uploading)
  const isUploading = isImageUploading || isDocumentUploading

  // Track if any files have failed to upload
  const hasFailedUploads = selectedImages.some(img => img.error) || selectedDocuments.some(doc => doc.error)

  // Model constants
  const AVAILABLE_MODELS = ["qwen-max", "qwen-plus"]

  const uploadImage = async (img: UploadedImage) => {
      try {
          if (!img.file) return

          // 1. Get signed URL
          const { upload_url, object_key } = await aiService.signDocumentUpload(img.file.name, img.file.type)
          
          const uploadUrl = upload_url
          const objectKey = object_key

          // 2. Upload to OSS with Content-Type header
          // IMPORTANT: Content-Type must match what was used to generate the presigned URL
          const uploadRes = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': img.file.type
              },
              body: img.file
          })

          if (!uploadRes.ok) {
             throw new Error('Failed to upload to OSS')
          }

          // 3. Update state
          setSelectedImages(prev => prev.map(p => 
              p.id === img.id ? { ...p, uploading: false, key: objectKey } : p
          ))
      } catch (e) {
          console.error('Upload failed:', e)
          setSelectedImages(prev => prev.map(p => 
              p.id === img.id ? { ...p, uploading: false, error: true } : p
          ))
      }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newImages: UploadedImage[] = []

    for (const file of Array.from(files)) {
        const id = Math.random().toString(36).substring(7)
        const previewUrl = URL.createObjectURL(file)
        const imageObj: UploadedImage = {
            id,
            url: previewUrl,
            file,
            uploading: true
        }
        newImages.push(imageObj)
    }

    // Add to state
    setSelectedImages((prev) => [...prev, ...newImages])

    // Reset input
    if (imageInputRef.current) {
        imageInputRef.current.value = ''
    }

    // Start uploads
    for (const img of newImages) {
        uploadImage(img)
    }
  }

  const uploadDocument = async (doc: UploadedDocument) => {
      if (!setSelectedDocuments) return

      try {
          // Validate file
          const validationError = validateFile(doc.file)
          if (validationError) {
              throw new Error(validationError)
          }

          // 1. Get signed URL and document ID
          // We can now upload without a conversation ID
          const { upload_url, object_key, document_id } = await aiService.signDocumentUpload(
              doc.file.name,
              doc.file.type,
              conversationId
          )

          // 2. Upload to OSS
          const uploadRes = await fetch(upload_url, {
              method: 'PUT',
              headers: {
                  'Content-Type': doc.file.type
              },
              body: doc.file
          })

          if (!uploadRes.ok) {
              throw new Error('Failed to upload to OSS')
          }

          // 3. Update state with OSS key and document ID
          setSelectedDocuments(prev => prev.map(d =>
              d.id === doc.id
                  ? { ...d, uploading: false, processing: true, key: object_key, documentId: document_id, processingStatus: 'pending' }
                  : d
          ))

          // 4. Trigger processing
          let processResult = await aiService.processDocument(document_id, conversationId)

          // 5. Poll for completion if still processing
          const maxPolls = 30 // 30 seconds max
          let pollCount = 0
          while (processResult.processing_status === 'processing' && pollCount < maxPolls) {
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

              // Check document status
              try {
                  const docDetail = conversationId
                      ? await aiService.getDocument(conversationId, document_id)
                      : await aiService.getDocumentStandalone(document_id)

                  processResult = {
                      success: true,
                      document_id: document_id,
                      filename: docDetail.document.filename,
                      processing_status: docDetail.document.processing_status,
                      chunk_strategy: docDetail.document.chunk_strategy,
                      char_count: docDetail.document.char_count
                  }

                  if (processResult.processing_status === 'completed' || processResult.processing_status === 'failed') {
                      break
                  }
              } catch (e) {
                  console.error('Error polling document status:', e)
                  break
              }

              pollCount++
          }

          // 6. Update with final processing result
          setSelectedDocuments(prev => prev.map(d =>
              d.id === doc.id
                  ? {
                      ...d,
                      processing: false,
                      processingStatus: processResult.processing_status as any,
                      chunkStrategy: processResult.chunk_strategy as any,
                      error: processResult.error
                  }
                  : d
          ))
      } catch (e: any) {
          console.error('Document upload failed:', e)
          setSelectedDocuments(prev => prev.map(d =>
              d.id === doc.id
                  ? { ...d, uploading: false, processing: false, error: e.message || 'Upload failed' }
                  : d
          ))
      }
  }

  const handleDocumentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!setSelectedDocuments) return

      const files = e.target.files
      if (!files || files.length === 0) return

      const newDocuments: UploadedDocument[] = []

      for (const file of Array.from(files)) {
          // Validate file
          const validationError = validateFile(file)
          if (validationError) {
              toast({ title: "Invalid File", description: validationError, type: "error" })
              continue
          }

          const id = Math.random().toString(36).substring(7)
          const docObj: UploadedDocument = {
              id,
              filename: file.name,
              file,
              uploading: true,
              processing: false
          }
          newDocuments.push(docObj)
      }

      if (newDocuments.length === 0) return

      // Add to state
      setSelectedDocuments(prev => [...prev, ...newDocuments])

      // Reset input
      if (documentInputRef.current) {
          documentInputRef.current.value = ''
      }

      // Start uploads
      for (const doc of newDocuments) {
          uploadDocument(doc)
      }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeDocument = (index: number) => {
    if (setSelectedDocuments) {
      setSelectedDocuments(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isUploading) {
        onSend()
      }
    }
  }

  // Get file color class based on color name
  const getFileColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      gray: 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    }
    return colorMap[color] || colorMap['gray']
  }

  // Determine if we should show citation context
  const showCitationContext = React.useMemo(() => {
    if (!selectedArtifact || selectedArtifact.type !== 'report' || !selectedArtifact.data?.pages) return null
    
    if (reportNavigation.pageNumber > 0 && reportNavigation.sectionIndexes.length > 0) {
        const page = selectedArtifact.data.pages.find((p: any) => p.page_number === reportNavigation.pageNumber)
        if (page) {
            // Find the first visible section to use as title
            // sectionIndexes are 1-based, array is 0-based
            const firstSectionIdx = reportNavigation.sectionIndexes[0] - 1
            const section = page.sections && page.sections[firstSectionIdx]
            
            if (section) {
                let title = section.title || page.title || "Report Section"
                // Clean up title (remove tags if any)
                title = title.replace(/<[^>]+>/g, '').trim()
                return {
                    title,
                    page: page.title || `Page ${reportNavigation.pageNumber}`
                }
            }
        }
    }
    return null
  }, [selectedArtifact, reportNavigation])

  return (
    <div className={cn("relative rounded-[1.5rem] bg-white dark:bg-gray-900 border border-border shadow-[0_12px_40px_rgba(30,58,138,0.15)] flex flex-col transition-all focus-within:ring-1 focus-within:ring-primary/20 focus-within:shadow-[0_16px_48px_rgba(99,102,241,0.2)]", className)}>
      {/* Citation Context Indicator */}
      {showCitationContext && (
          <div className="absolute -top-10 left-0 right-0 flex items-center justify-center pointer-events-none">
              <div className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm border border-primary/20 shadow-sm flex items-center gap-1.5 max-w-[90%] truncate">
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="opacity-70">Chatting about:</span>
                  <span className="truncate font-semibold">{showCitationContext.title}</span>
              </div>
          </div>
      )}

      {/* Image & Document Preview */}
      {(selectedImages.length > 0 || selectedDocuments.length > 0) && (
          <div className="absolute -top-24 left-0 right-0 flex gap-2 p-2 overflow-x-auto justify-center z-10">
              {/* Images */}
              {selectedImages.map((img, idx) => (
                  <div key={`img-${idx}`} className="relative group flex-shrink-0">
                      <div className="relative">
                        <img
                          src={img.url}
                          alt="Selected"
                          className={cn(
                            "h-16 w-16 object-cover rounded-lg border border-border transition-opacity bg-white shadow-sm",
                            img.uploading ? "opacity-50" : "opacity-100",
                            img.error ? "border-red-500" : ""
                          )}
                        />
                        {img.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                        )}
                        {img.error && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                      >
                          <X className="h-3 w-3" />
                      </button>
                  </div>
              ))}

              {/* Documents */}
              {selectedDocuments.map((doc, idx) => {
                  const fileColor = getFileColor(doc.filename)
                  const colorClass = getFileColorClass(fileColor)

                  return (
                      <div key={`doc-${idx}`} className="relative group flex-shrink-0">
                          <div className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-opacity min-w-[120px] bg-white shadow-sm h-16",
                              colorClass,
                              (doc.uploading || doc.processing) && "opacity-60"
                          )}>
                              <FileText className="h-5 w-5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">
                                      {truncateFilename(doc.filename, 15)}
                                  </div>
                              </div>
                              {doc.uploading && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
                              {doc.processing && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
                              {doc.processingStatus === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />}
                              {doc.error && <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                          </div>

                          <button
                              onClick={() => removeDocument(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                              >
                              <X className="h-3 w-3" />
                          </button>
                      </div>
                  )
              })}
          </div>
      )}

      {/* Input Field Area */}
      <div className="px-4 pt-4 pb-2">
        <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 resize-none min-h-[40px] max-h-[300px] overflow-y-auto break-words overflow-wrap-anywhere"
            rows={1}
            style={{ minHeight: '56px' }}
        />
      </div>

      {/* Bottom Actions Row */}
      <div className="flex items-center justify-between px-3 pb-3">
        {/* Left Actions: Think, Search, Model */}
        <div className="flex items-center gap-2">
            <Button
                variant={thinkingEnabled ? "secondary" : "ghost"}
                onClick={() => setThinkingEnabled(!thinkingEnabled)}
                className={cn(
                "h-8 px-3 rounded-full text-xs font-medium transition-all border",
                thinkingEnabled
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                    : "border-transparent bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                disabled={disabled}
            >
                <Brain className="h-3.5 w-3.5 mr-1.5" />
                DeepThink
            </Button>
            <Button
                variant={includeWebSearch ? "secondary" : "ghost"}
                onClick={() => setIncludeWebSearch(!includeWebSearch)}
                className={cn(
                "h-8 px-3 rounded-full text-xs font-medium transition-all border",
                includeWebSearch
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "border-transparent bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                disabled={disabled}
            >
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Search
            </Button>

            {/* Model Selection */}
            <Select value={model} onValueChange={setModel} disabled={disabled}>
                <SelectTrigger className={cn(
                "h-8 px-3 rounded-full text-xs font-medium border-0 bg-transparent hover:bg-muted/50 transition-all w-auto gap-1.5 text-muted-foreground"
                )}>
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {AVAILABLE_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>
                    {m}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>

        {/* Right Actions: Upload & Send */}
        <div className="flex items-center gap-2">
            {/* File Inputs (Hidden) */}
            <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
            />
            <input
                type="file"
                ref={documentInputRef}
                className="hidden"
                accept=".pdf,.docx,.doc,.pptx,.xlsx,.xls,.txt,.md,.html,.csv,.json,.xml"
                multiple
                onChange={handleDocumentSelect}
            />

            {/* Attachment Dropdown Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full transition-all"
                    disabled={disabled || isUploading}
                    title="Attach files or images"
                >
                    <Paperclip className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onClick={() => imageInputRef.current?.click()}
                    className="cursor-pointer"
                >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Images
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => documentInputRef.current?.click()}
                    className="cursor-pointer"
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Documents
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {isThinking && onStop ? (
                <Button
                onClick={onStop}
                size="icon"
                className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all"
                title="Stop generation"
                >
                <Square className="h-3 w-3 fill-current" />
                </Button>
            ) : (
                <Button
                onClick={onSend}
                disabled={(!input.trim() && selectedImages.length === 0 && selectedDocuments.length === 0) || isThinking || disabled || isUploading || hasFailedUploads}
                size="icon"
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white shadow-sm disabled:opacity-50 transition-all"
                title={hasFailedUploads ? "Please remove failed uploads before sending" : "Send message"}
                >
                <ArrowUp className="h-4 w-4" />
                </Button>
            )}
        </div>
      </div>
    </div>
  )
}
