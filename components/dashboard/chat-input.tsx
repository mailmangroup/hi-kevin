"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChatInputArea, UploadedImage } from "@/components/chat/chat-input-area"
import { BetaBadge } from "@/components/ui/beta-badge"
import { useUserStore } from "@/lib/store/user-store"

export function ChatInput() {
  const [input, setInput] = useState("")
  const [thinkingEnabled, setThinkingEnabled] = useState(false)
  const [includeWebSearch, setIncludeWebSearch] = useState(true)
  const [model, setModel] = useState("qwen-max")
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([])
  const router = useRouter()
  
  const { profile, fetchProfile } = useUserStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const fullName = profile?.full_name

  const handleSend = () => {
    if (!input.trim() && selectedImages.length === 0) return

    // Check if any images are still uploading
    const uploadingImages = selectedImages.filter(img => img.uploading)
    if (uploadingImages.length > 0) {
      console.warn("Cannot send message: images are still uploading")
      return
    }

    // Check if any images failed to upload (no OSS key)
    const failedImages = selectedImages.filter(img => !img.uploading && !img.key)
    if (failedImages.length > 0) {
      console.error("Cannot send message: some images failed to upload. Please remove them and try again.")
      return
    }

    // Filter images to only those with successful OSS keys
    const validImages = selectedImages.filter(img => img.key)

    // Save valid images to session storage if any
    if (validImages.length > 0) {
        sessionStorage.setItem('pending_chat_images', JSON.stringify(validImages))
    }

    // Navigate to chat page with initial message and options
    const params = new URLSearchParams({
      q: input,
      thinking: thinkingEnabled.toString(),
      search: includeWebSearch.toString(),
      model
    })
    router.push(`/chat/new?${params.toString()}`)
  }

  const greeting = fullName ? `Hi ${fullName}, how can I help you today?` : "How can I help you today?"

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-10">
      <h1 className="text-4xl font-semibold text-foreground text-center">{greeting}</h1>
      
      <div className="w-full max-w-2xl relative">
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
          placeholder=""
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <BetaBadge />
        <div className="flex flex-wrap justify-center gap-3">
          {["Analyze video", "Create campaign", "Research competitors", "Generate content", "Track performance"].map((action) => (
             <Button key={action} variant="outline" className="rounded-full bg-white/50 hover:bg-white">
               {action}
             </Button>
          ))}
           <Button variant="outline" className="rounded-full bg-white/50 hover:bg-white">
               More
           </Button>
        </div>
      </div>
    </div>
  )
}
