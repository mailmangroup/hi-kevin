
"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Clock, MoreHorizontal, Pencil, Star, Trash2, Check, Copy } from "lucide-react"
import { Conversation, aiService } from "@/lib/api/client"
import { cn } from "@/lib/utils/cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

interface ConversationListItemProps {
  conversation: Conversation
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
  onEnterSelectionMode?: () => void
}

export function ConversationListItem({ 
  conversation,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onEnterSelectionMode
}: ConversationListItemProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [newTitle, setNewTitle] = useState(conversation.title || "New Conversation")

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
        toast({
            title: "Title cannot be empty",
            type: "error"
        })
        return
    }

    if (newTitle === conversation.title) {
        setIsRenameOpen(false)
        return
    }
    
    try {
        await aiService.updateConversationTitle(conversation.id, newTitle)
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        toast({
            title: "Title updated",
            type: "success"
        })
        setIsRenameOpen(false)
    } catch (error) {
        toast({
            title: "Failed to update title",
            type: "error"
        })
    }
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await aiService.updateConversationFavorite(conversation.id, !conversation.is_favorite)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast({
        title: conversation.is_favorite ? "Removed from favorites" : "Added to favorites",
        type: "success"
      })
    } catch (error) {
      toast({
        title: "Failed to update favorite status",
        type: "error"
      })
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDeleteOpen(true)
  }

  const doDelete = async () => {
    try {
      await aiService.deleteConversation(conversation.id, true)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast({
        title: "Conversation deleted",
        type: "success"
      })
    } catch (error) {
      toast({
        title: "Failed to delete conversation",
        type: "error"
      })
    }
  }

  const handleItemClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.preventDefault()
      e.stopPropagation()
      onToggleSelect()
    }
    // Otherwise let Link handle navigation
  }

  const lastMessageIsTimestamp = conversation.last_message && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(conversation.last_message)
  const conversationPath = conversation.conversation_mode === "deep_agent"
    ? `/chat/deep-agent/${conversation.id}`
    : `/chat/agent/${conversation.id}`

  return (
    <>
      <Link 
        href={conversationPath}
        className="block group relative"
        onClick={handleItemClick}
      >
        <div className={cn(
          "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300",
          // Glass/Aura Effect
          isSelected 
            ? "bg-primary/10 border-primary/30" 
            : "bg-white/40 hover:bg-white/70 backdrop-blur-sm border border-white/40 hover:border-white/60",
          // Shadow/Hover
          "shadow-sm hover:shadow-md hover:-translate-y-[1px]"
        )}>
          {selectionMode && (
            <div className="mr-3 flex-shrink-0">
              <div className={cn(
                "h-5 w-5 rounded border flex items-center justify-center transition-all",
                isSelected ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
              )}>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-800 truncate group-hover:text-primary transition-colors">
                {conversation.title || "New Conversation"}
              </h3>
              {conversation.is_favorite && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-100 text-[9px] text-yellow-600">★</span>
              )}
            </div>
            {!lastMessageIsTimestamp && (
              <p className="text-xs text-slate-500 truncate max-w-[500px] font-normal mt-0.5">
                {conversation.last_message || "No messages yet."}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 whitespace-nowrap">
            <div className="flex items-center gap-1.5" title="Message count">
              <MessageSquare className="h-3 w-3 opacity-60 group-hover:text-primary/60 transition-colors" />
              <span className="group-hover:text-slate-600 transition-colors text-[10px] leading-none">{conversation.message_count}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-[80px] justify-end" title="Last updated">
              <Clock className="h-3 w-3 opacity-60 group-hover:text-primary/60 transition-colors" />
              <span className="group-hover:text-slate-600 transition-colors text-[10px] leading-none" suppressHydrationWarning>
                {conversation.updated_at 
                  ? formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })
                  : 'Just now'}
              </span>
            </div>

            {/* Menu Button - Always visible now for better discoverability */}
            {!selectionMode && (
              <div onClick={(e) => e.preventDefault()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-slate-200/50 -mr-2 text-slate-400 hover:text-slate-600 opacity-70 hover:opacity-100 transition-all"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setNewTitle(conversation.title || "New Conversation")
                        setIsRenameOpen(true)
                    }}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFavorite}>
                      <Star className={cn("mr-2 h-3.5 w-3.5", conversation.is_favorite ? "fill-yellow-500 text-yellow-500" : "")} />
                      {conversation.is_favorite ? "Unfavorite" : "Favorite"}
                    </DropdownMenuItem>
                    
                    {onEnterSelectionMode && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onEnterSelectionMode()
                        }}>
                          <Check className="mr-2 h-3.5 w-3.5" />
                          Select Multiple
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </Link>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Chat"
        description="Are you sure you want to permanently delete this chat? This action cannot be undone."
        onConfirm={doDelete}
        confirmText="Delete"
        variant="destructive"
      />

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Chat</DialogTitle>
                <DialogDescription>
                    Enter a new title for this conversation.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRename}>
                <div className="grid gap-4 py-4">
                    <Input
                        id="name"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Enter chat title"
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
