"use client"

import { useState, useEffect } from "react"
import { useConversations } from "@/lib/hooks/use-dashboard-data"
import { ConversationListItem } from "./conversation-list-item"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search, Trash2, Star, X, CheckSquare } from "lucide-react"
import { aiService } from "@/lib/api/client"
import { useToast } from "@/components/ui/toast"
import { useQueryClient } from "@tanstack/react-query"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils/cn"
import { useSearchParams } from "next/navigation"

export function ConversationList() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (searchParams.get("mode") === "select") {
      setSelectionMode(true)
    }
  }, [searchParams])
  
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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const enterSelectionMode = (initialId?: string) => {
    setSelectionMode(true)
    if (initialId) {
      setSelectedIds(new Set([initialId]))
    } else {
      setSelectedIds(new Set())
    }
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const selectAll = () => {
    if (selectedIds.size === filteredConversations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredConversations.map(c => c.id)))
    }
  }

  const handleBulkFavorite = async (isFavorite: boolean) => {
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => 
          aiService.updateConversationFavorite(id, isFavorite)
        )
      )
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast({
        title: `Updated ${selectedIds.size} conversations`,
        type: "success"
      })
      exitSelectionMode()
    } catch (error) {
      toast({
        title: "Failed to update conversations",
        type: "error"
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => 
          aiService.deleteConversation(id, true)
        )
      )
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast({
        title: `Deleted ${selectedIds.size} conversations`,
        type: "success"
      })
      setIsBulkDeleteOpen(false)
      exitSelectionMode()
    } catch (error) {
      toast({
        title: "Failed to delete conversations",
        type: "error"
      })
    }
  }

  return (
    <div className="space-y-4 relative min-h-[400px]">
      {/* Header Actions */}
      <div className="flex items-center gap-2 mb-4">
        {selectionMode ? (
          <div className="flex-1 flex items-center justify-between bg-primary/5 p-2 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={exitSelectionMode}
                className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-primary">
                {selectedIds.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-xs h-7 px-2 ml-2"
              >
                {selectedIds.size === filteredConversations.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkFavorite(true)}
                disabled={selectedIds.size === 0}
                className="h-8 px-2 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50"
                title="Add to Favorites"
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBulkDeleteOpen(true)}
                disabled={selectedIds.size === 0}
                className="h-8 px-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
                title="Delete Selected"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Search Input */
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white/40 backdrop-blur-sm border-white/40 hover:bg-white/60 focus:bg-white transition-all shadow-sm"
            />
          </div>
        )}
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
          <div className="space-y-1.5 pb-20">
            {filteredConversations.map((conversation) => (
              <ConversationListItem 
                key={conversation.id} 
                conversation={conversation} 
                selectionMode={selectionMode}
                isSelected={selectedIds.has(conversation.id)}
                onToggleSelect={() => toggleSelection(conversation.id)}
                onEnterSelectionMode={() => enterSelectionMode(conversation.id)}
              />
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

      <ConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title={`Delete ${selectedIds.size} Conversations`}
        description="Are you sure you want to permanently delete these conversations? This action cannot be undone."
        onConfirm={handleBulkDelete}
        confirmText="Delete All"
        variant="destructive"
      />
    </div>
  )
}
