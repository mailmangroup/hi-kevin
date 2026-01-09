"use client"

import * as React from "react"
import { Send, Paperclip, Brain, Globe, X, ArrowUp, Loader2 } from "lucide-react"
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

export interface ChatInputAreaProps {
  input: string
  setInput: (value: string) => void
  onSend: () => void
  thinkingEnabled: boolean
  setThinkingEnabled: (enabled: boolean) => void
  includeWebSearch: boolean
  setIncludeWebSearch: (enabled: boolean) => void
  model: string
  setModel: (model: string) => void
  selectedImages: string[]
  setSelectedImages: (images: string[] | ((prev: string[]) => string[])) => void
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
  const [isCompressing, setIsCompressing] = React.useState(false)

  // Model constants
  const AVAILABLE_MODELS = ["qwen-max", "qwen-plus"]

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsCompressing(true)

    try {
      // Compress images in parallel
      const compressionPromises = Array.from(files).map(async (file) => {
        try {
          // Check file size
          const fileSizeMB = file.size / (1024 * 1024)
          console.log(`[Upload] Processing ${file.name} (${fileSizeMB.toFixed(2)}MB)`)

          // Compress to max 0.5MB, 1920px, 0.8 quality
          const compressed = await compressImage(file, 0.5, 1920, 0.8)
          return compressed
        } catch (error) {
          console.error(`Failed to compress ${file.name}:`, error)
          // Fall back to original file if compression fails
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })
        }
      })

      const compressedImages = await Promise.all(compressionPromises)
      setSelectedImages((prev: string[]) => [...prev, ...compressedImages])
    } catch (error) {
      console.error('Error processing images:', error)
    } finally {
      setIsCompressing(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev: string[]) => prev.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className={cn("relative bg-white", showBorder && "rounded-2xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary", className)}>
      {/* Image Preview */}
      {selectedImages.length > 0 && (
          <div className="flex gap-2 p-4 pb-0 overflow-x-auto">
              {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative group flex-shrink-0">
                      <img src={img} alt="Selected" className="h-16 w-16 object-cover rounded-lg border border-border" />
                      <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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
              disabled={disabled || isCompressing}
              onClick={() => fileInputRef.current?.click()}
          >
              {isCompressing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Paperclip className="h-5 w-5" />
              )}
          </Button>
          <Button
            onClick={onSend}
            disabled={(!input.trim() && selectedImages.length === 0) || isThinking || disabled}
            size="icon"
            className="h-8 w-8 rounded-full"
          >
            {/* We can make the icon conditional or passed as prop, but usually ArrowUp or Send is fine. 
                ChatInterface used Send, Dashboard used ArrowUp. Let's standardize on Send for now as it's more chat-like, 
                or ArrowUp which is modern AI style. ChatInterface used Send, let's use ArrowUp to be modern? 
                The user asked for consistency. Let's use Send for now to match the existing ChatInterface icon, or check what ChatInterface used.
                ChatInterface used Send. Dashboard used ArrowUp.
                I will use ArrowUp as it's becoming the standard for AI inputs (ChatGPT, Claude).
            */}
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
