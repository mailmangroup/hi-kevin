"use client"

import { useState } from "react"
import { useConversations } from "@/lib/hooks/use-dashboard-data"
import { ConversationListItem } from "./conversation-list-item"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

export function ConversationList() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const limit = 50 // Increased limit for better visibility
  const skip = (page - 1) * limit
  
  const { data, isLoading } = useConversations(limit, skip)
  
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)
  
  const handlePrevious = () => {
    if (page > 1) setPage(page - 1)
  }
  
  const handleNext = () => {
    if (page < totalPages) setPage(page + 1)
  }

  const filteredConversations = data?.conversations.filter(conversation => 
    conversation.title?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 bg-white/40 backdrop-blur-sm border-white/40 hover:bg-white/60 focus:bg-white transition-all shadow-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/40" />
          ))}
        </div>
      ) : data?.conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No conversations yet</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Start a new chat with Kevin to see your conversation history here.
          </p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            No conversations found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {filteredConversations.map((conversation) => (
              <ConversationListItem key={conversation.id} conversation={conversation} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 px-1">
              <div className="text-xs font-medium text-slate-400">
                Showing {skip + 1}-{Math.min(skip + limit, total)} of {total}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={page === 1}
                  className="h-8 px-3 text-xs bg-white/50 border-white/50 hover:bg-white hover:text-primary backdrop-blur-sm transition-all"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={page === totalPages}
                  className="h-8 px-3 text-xs bg-white/50 border-white/50 hover:bg-white hover:text-primary backdrop-blur-sm transition-all"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
