"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Search, Mic, ArrowUp, Plus, Brain, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ChatInput() {
  const [input, setInput] = useState("")
  const [thinkingEnabled, setThinkingEnabled] = useState(false)
  const [includeWebSearch, setIncludeWebSearch] = useState(true)
  const [model, setModel] = useState("qwen-max")
  const [fullName, setFullName] = useState<string | null>(null)
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
    if (!input.trim()) return
    // Navigate to chat page with initial message and options
    const params = new URLSearchParams({
      q: input,
      thinking: thinkingEnabled.toString(),
      search: includeWebSearch.toString(),
      model
    })
    router.push(`/chat/new?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const greeting = fullName ? `Hi ${fullName}, how can I help you today?` : "How can I help you today?"

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-10">
      <h1 className="text-4xl font-semibold text-foreground text-center">{greeting}</h1>
      
      <div className="w-full max-w-2xl relative">
        <div className="relative rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="w-full resize-none rounded-2xl bg-transparent p-4 pb-14 text-base focus:outline-none min-h-[100px]"
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
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium">Search</span>
                </Button>
                
                <div className="h-4 w-px bg-border mx-1" />
                
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-8 border-none bg-transparent shadow-none w-auto gap-2 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:ring-0">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qwen-max">qwen-max</SelectItem>
                    <SelectItem value="qwen-plus">qwen-plus</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             <div className="flex gap-2">
                <Button 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    disabled={!input.trim()} 
                    onClick={handleSend}
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
             </div>
          </div>
        </div>
      </div>

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
  )
}
