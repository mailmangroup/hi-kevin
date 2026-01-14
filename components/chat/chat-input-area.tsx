"use client"

import * as React from "react"
import { Send, Paperclip, Brain, Globe, X, ArrowUp, Loader2, Square } from "lucide-react"
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

export interface UploadedImage {
  id: string
  url: string // Preview URL (blob:...) or remote URL
  key?: string // OSS Key
  file?: File
  uploading: boolean
  error?: boolean
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
  className?: string
  placeholder?: string
  disabled?: boolean
  isThinking?: boolean
  showBorder?: boolean
}

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
  className,
  placeholder = "Message Kevin...",
  disabled = false,
  isThinking = false,
  showBorder = true
}: ChatInputAreaProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  // Track global uploading state to disable send button if any image is uploading
  const isUploading = selectedImages.some(img => img.uploading)
  // Track if any images have failed to upload
  const hasFailedUploads = selectedImages.some(img => img.error)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (fileInputRef.current) {
        fileInputRef.current.value = ''
    }

    // Start uploads
    for (const img of newImages) {
        uploadImage(img)
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isUploading) {
        onSend()
      }
    }
  }

  return (
    <div className={cn("relative bg-white", showBorder && "rounded-2xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary", className)}>
      {/* Image Preview */}
      {selectedImages.length > 0 && (
          <div className="flex gap-2 p-4 pb-0 overflow-x-auto">
              {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative group flex-shrink-0">
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
          <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
          />
          <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
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
              disabled={(!input.trim() && selectedImages.length === 0) || isThinking || disabled || isUploading || hasFailedUploads}
              size="icon"
              className="h-8 w-8 rounded-full"
              title={hasFailedUploads ? "Please remove failed images before sending" : undefined}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
