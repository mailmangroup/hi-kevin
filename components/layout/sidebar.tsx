"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect,
  useState
} from "react"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Search,
  Megaphone,
  Shield,
  Settings,
  MessageSquare,
  FolderKanban,
  MoreHorizontal,
  Star,
  Trash2,
  Pencil,
  CheckSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Conversation, aiService } from "@/lib/api/client"
import { useNewLeadsCount, useConversations } from "@/lib/hooks/use-dashboard-data"
import { useQueryClient } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  isBeta?: boolean
}

const INITIAL_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isBeta: false,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    isBeta: false,
  },
  {
    title: "Content",
    href: "/dashboard/content",
    icon: FileText,
    badge: 2,
    isBeta: true, // Pilot feature
  },
  {
    title: "Leads",
    href: "/dashboard/leads",
    icon: Users,
    badge: undefined, // Will be populated dynamically
    isBeta: false,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    isBeta: false,
  },
  {
    title: "Research",
    href: "/dashboard/research",
    icon: Search,
    isBeta: true,
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Megaphone,
    isBeta: true,
  },
  {
    title: "Brand Safety",
    href: "/dashboard/brand-safety",
    icon: Shield,
    badge: 1,
    isBeta: true,
  },
]

function ChatHistoryItem({ chat, isActive }: { chat: Conversation, isActive: boolean }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [newTitle, setNewTitle] = useState(chat.title || "New Chat")

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
        toast({
            title: "Title cannot be empty",
            type: "error"
        })
        return
    }

    if (newTitle === chat.title) {
        setIsRenameOpen(false)
        return
    }
    
    try {
        await aiService.updateConversationTitle(chat.id, newTitle)
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
      await aiService.updateConversationFavorite(chat.id, !chat.is_favorite)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast({
        title: chat.is_favorite ? "Removed from favorites" : "Added to favorites",
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
      await aiService.deleteConversation(chat.id, true)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast({
        title: "Conversation deleted",
        type: "success"
      })
      if (isActive) {
        router.push('/dashboard')
      }
    } catch (error) {
      toast({
        title: "Failed to delete conversation",
        type: "error"
      })
    }
  }

  return (
    <>
    <div className="group/item relative flex items-center">
        <Link
            href={chat.conversation_mode === "deep_agent" ? `/chat/deep-agent/${chat.id}` : `/chat/agent/${chat.id}`}
            prefetch={false}
            className={cn(
                "flex-1 flex items-center rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all pr-8", 
                isActive
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
            )}
        >
            <span className="truncate flex-1 flex items-center gap-1.5" title={chat.title}>
                {chat.is_favorite && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />}
                <span className="truncate">{chat.title || "New Chat"}</span>
            </span>
        </Link>
        
        <div className="absolute right-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "h-6 w-6 rounded-full transition-all",
                            "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                            isActive ? "opacity-100 bg-slate-200/50" : "opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                        )}
                    >
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setNewTitle(chat.title || "New Chat")
                        setIsRenameOpen(true)
                    }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFavorite}>
                        <Star className={cn("mr-2 h-4 w-4", chat.is_favorite ? "fill-yellow-500 text-yellow-500" : "")} />
                        {chat.is_favorite ? "Unfavorite" : "Favorite"}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/chat/agent?mode=select" className="cursor-pointer w-full flex items-center">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Select Multiple
                        </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>

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

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const queryClient = useQueryClient()

  // Use TanStack Query for data fetching (replaces manual cache)
  const { data: leadsData } = useNewLeadsCount()
  const { data: conversationsData } = useConversations(20, 0, "agent")

  const leadsCount = leadsData?.count ?? null
  const chatHistory = conversationsData?.conversations ?? []
  const totalChats = conversationsData?.total ?? 0

  // Build nav items with dynamic leads badge
  const navItems: NavItem[] = INITIAL_NAV_ITEMS.map(item => {
    if (item.title === 'Leads' && leadsCount !== null && leadsCount > 0) {
      return { ...item, badge: leadsCount }
    }
    return item
  })

  // Invalidate conversations cache when chat events fire
  useEffect(() => {
    const handleChatEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }

    window.addEventListener('chat-created', handleChatEvent)
    window.addEventListener('chat-title-updated', handleChatEvent)

    return () => {
      window.removeEventListener('chat-created', handleChatEvent)
      window.removeEventListener('chat-title-updated', handleChatEvent)
    }
  }, [queryClient])

  return (
    <div className={cn("relative flex h-full w-60 flex-col bg-transparent", className)}>
      {/* Header */}
      <div className="flex h-14 items-center gap-3 px-6 mb-6 pt-4">
        <Image
          src="/kevin-icon.svg"
          alt="Kevin"
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg shadow-sm"
          unoptimized
        />
        <span className="text-lg font-bold text-slate-900 tracking-tight">Kevin</span>
      </div>

      {/* Navigation - fixed, no scroll */}
      <div className="flex-shrink-0 px-3">
        <nav className="space-y-0.5">
            {navItems.map((item) => {
            const Icon = item.icon
            // Dashboard should only be active on exact match, not sub-routes
            const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/dashboard/"
                : pathname === item.href || pathname.startsWith(item.href + "/")

            return (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "group flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                    isActive
                        ? "bg-white text-primary shadow-sm"
                        : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                )}
                >
                <item.icon className={cn("mr-2 h-4 w-4 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span className="flex-1 truncate">{item.title}</span>
                <div className="ml-auto flex items-center gap-2">
                    {item.isBeta && <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />}
                    {item.badge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                    </span>
                    )}
                </div>
                </Link>
            )
            })}
        </nav>
      </div>

      {/* Chat History Section - scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 mt-4">
            <Link href="/chat/agent" prefetch={false} className="block mb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors cursor-pointer">
                History
            </Link>
            <div className="space-y-0.5">
                <Link href="/chat/agent/new" prefetch={false}>
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-500 transition-all hover:bg-white/50 hover:text-slate-700 text-left">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200">
                            <MessageSquare className="h-2.5 w-2.5 text-slate-500" />
                        </div>
                        New Chat
                    </button>
                </Link>
                {chatHistory.map((chat) => {
                    const chatPath = chat.conversation_mode === "deep_agent" ? `/chat/deep-agent/${chat.id}` : `/chat/agent/${chat.id}`
                    const isActive = pathname === chatPath
                    return (
                        <ChatHistoryItem key={chat.id} chat={chat} isActive={isActive} />
                    )
                })}
            </div>
            {chatHistory.length < totalChats && (
                <Link
                    href="/chat/agent"
                    prefetch={false}
                    className="block text-xs text-center text-muted-foreground mt-2 hover:text-foreground hover:underline transition-all py-1 cursor-pointer"
                >
                    Showing {chatHistory.length} of {totalChats} chats
                </Link>
            )}
      </div>

      {/* Footer Section */}
      <div className="mt-auto p-3 pt-2">
        <div className="flex items-center gap-2">
            <Link
                href="/dashboard/settings"
                prefetch={false}
                className="flex-1 flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm transition-all hover:shadow-md"
            >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Settings className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="truncate text-[13px] font-medium text-slate-700">Settings</p>
                </div>
            </Link>
        </div>
      </div>
    </div>
  )
}
