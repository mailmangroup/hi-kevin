"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ChatInputArea } from "@/components/chat/chat-input-area"
import { BetaBadge } from "@/components/ui/beta-badge"

export function ChatInput() {
  const [input, setInput] = useState("")
  const [thinkingEnabled, setThinkingEnabled] = useState(false)
  const [includeWebSearch, setIncludeWebSearch] = useState(true)
  const [model, setModel] = useState("qwen-max")
  const [fullName, setFullName] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (data?.full_name) {
          setFullName(data.full_name)
        }
      } catch (e) {
        console.error('Error loading profile:', e)
      }
    }
    loadProfile()
  }, [])

  const handleSend = () => {
    if (!input.trim() && selectedImages.length === 0) return
    
    // Save images to session storage if any
    if (selectedImages.length > 0) {
        sessionStorage.setItem('pending_chat_images', JSON.stringify(selectedImages))
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
