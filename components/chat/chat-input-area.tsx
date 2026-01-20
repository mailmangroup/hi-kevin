"use client"

import * as React from "react"
import { Send, Brain, Globe, X, ArrowUp, Loader2, Square, File, FileText, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const { reportNavigation, selectedArtifact } = useArtifact()

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
          const res = await fetch('/api/proxy/upload/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: img.file.name, filetype: img.file.type })
          })
          
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Failed to get sign url')
          }
          
          const { uploadUrl, objectKey } = await res.json()

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
              alert(validationError)
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
      red: 'bg-red-100 text-red-700 border-red-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
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
    <div className={cn("relative bg-white", showBorder && "rounded-2xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary", className)}>
      {/* Citation Context Indicator */}
      {showCitationContext && (
          <div className="absolute -top-8 left-0 right-0 flex items-center justify-center pointer-events-none">
              <div className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm border border-primary/20 shadow-sm flex items-center gap-1.5 max-w-[90%] truncate">
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="opacity-70">Chatting about:</span>
                  <span className="truncate font-semibold">{showCitationContext.title}</span>
              </div>
          </div>
      )}

      {/* Image & Document Preview */}
      {(selectedImages.length > 0 || selectedDocuments.length > 0) && (
          <div className="flex gap-2 p-4 pb-0 overflow-x-auto">
              {/* Images */}
              {selectedImages.map((img, idx) => (
                  <div key={`img-${idx}`} className="relative group flex-shrink-0">
                      <div className="relative">
                        <img
                          src={img.url}
                          alt="Selected"
                          className={cn(
                            "h-16 w-16 object-cover rounded-lg border border-border transition-opacity",
                            img.uploading ? "opacity-50" : "opacity-100",
                            img.error ? "border-red-500" : ""
                          )}
                        />
                        {img.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        )}
                        {img.error && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-lg">
                             <X className="h-4 w-4 text-red-500" />
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
                              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-opacity min-w-[200px]",
                              colorClass,
                              (doc.uploading || doc.processing) && "opacity-60"
                          )}>
                              {/* File Icon */}
                              <FileText className="h-4 w-4 flex-shrink-0" />

                              {/* File Info */}
                              <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">
                                      {truncateFilename(doc.filename, 20)}
                                  </div>
                                  <div className="text-[10px] opacity-70">
                                      {getFileTypeDisplay(doc.filename)} • {formatFileSize(doc.file.size)}
                                  </div>
                              </div>

                              {/* Status Icon */}
                              <div className="flex-shrink-0">
                                  {doc.uploading && (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  {(doc.processing || doc.processingStatus === 'processing') && (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  {doc.error && (
                                      <AlertCircle className="h-3 w-3 text-red-600" />
                                  )}
                                  {doc.processingStatus === 'completed' && !doc.error && (
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  )}
                              </div>
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

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">Search</span>
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Select value={model} onValueChange={setModel} disabled={disabled}>
            <SelectTrigger className="h-8 border-none bg-transparent shadow-none w-auto gap-2 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:ring-0">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {/* Image Upload Input */}
          <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
          />

          {/* Document Upload Input */}
          <input
              type="file"
              ref={documentInputRef}
              className="hidden"
              accept=".pdf,.docx,.doc,.pptx,.xlsx,.xls,.txt,.md,.html,.csv,.json,.xml"
              multiple
              onChange={handleDocumentSelect}
          />

          {/* Image Upload Button (default) */}
          <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              disabled={disabled || isUploading}
              onClick={() => imageInputRef.current?.click()}
              title="Upload images"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          {/* Document Upload Button */}
          <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              disabled={disabled || isUploading}
              onClick={() => documentInputRef.current?.click()}
              title="Upload documents"
          >
            <File className="h-5 w-5" />
          </Button>

          {isThinking && onStop ? (
            <Button
              onClick={onStop}
              size="icon"
              className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white"
              title="Stop generation"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={onSend}
              disabled={(!input.trim() && selectedImages.length === 0 && selectedDocuments.length === 0) || isThinking || disabled || isUploading || hasFailedUploads}
              size="icon"
              className="h-8 w-8 rounded-full"
              title={hasFailedUploads ? "Please remove failed uploads before sending" : undefined}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
