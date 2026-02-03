"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
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
  FolderKanban
} from "lucide-react"
import { BetaBadge } from "@/components/ui/beta-badge"
import { Button } from "@/components/ui/button"
import { frostService } from "@/lib/api/frost"
import { aiService, Conversation } from "@/lib/api/client"

// Simple cache to avoid refetching on every navigation
const sidebarCache = {
  leadsCount: null as number | null,
  chatHistory: null as Conversation[] | null,
  totalChats: 0,
  lastFetch: 0,
  CACHE_DURATION: 30000, // 30 seconds
}

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
    isBeta: true,
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

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const [navItems, setNavItems] = useState<NavItem[]>(INITIAL_NAV_ITEMS)
  const [chatHistory, setChatHistory] = useState<Conversation[]>([])
  const [totalChats, setTotalChats] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchHistory = async (options?: { refresh?: boolean; loadMore?: boolean }) => {
    const isLoadMore = options?.loadMore

    // If loading more and already loading, skip
    if (isLoadMore && isLoadingMore) return

    if (isLoadMore) setIsLoadingMore(true)

    try {
        const limit = 20
        const skip = isLoadMore ? chatHistory.length : 0
        
        const { conversations, total } = await aiService.getConversations(limit, skip)
        
        if (isLoadMore) {
            const newHistory = [...chatHistory, ...conversations]
            setChatHistory(newHistory)
            sidebarCache.chatHistory = newHistory
        } else {
            setChatHistory(conversations)
            sidebarCache.chatHistory = conversations
        }
        setTotalChats(total)
        sidebarCache.totalChats = total
    } catch (error: any) {
        // Ignore missing credentials error as it's expected during onboarding
        if (error?.code === 'CREDENTIALS_MISSING') return
        console.error("Failed to fetch chat history:", error)
    } finally {
        if (isLoadMore) setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    const now = Date.now()
    const isCacheValid = now - sidebarCache.lastFetch < sidebarCache.CACHE_DURATION

    const fetchLeadsCount = async () => {
      try {
        const response = await frostService.getNewLeadsCount()
        const count = response.count
        sidebarCache.leadsCount = count

        setNavItems(prev => prev.map(item => {
          if (item.title === "Leads") {
            return { ...item, badge: count > 0 ? count : undefined }
          }
          return item
        }))
      } catch (error: any) {
        // Ignore missing credentials error as it's expected during onboarding
        if (error?.code === 'CREDENTIALS_MISSING') return
        console.error("Failed to fetch new leads count:", error)
      }
    }

    // Use cached data if available and valid
    if (isCacheValid && sidebarCache.leadsCount !== null) {
      setNavItems(prev => prev.map(item => {
        if (item.title === "Leads") {
          return { ...item, badge: sidebarCache.leadsCount! > 0 ? sidebarCache.leadsCount! : undefined }
        }
        return item
      }))
    } else {
      fetchLeadsCount()
    }

    if (isCacheValid && sidebarCache.chatHistory !== null) {
      setChatHistory(sidebarCache.chatHistory)
      setTotalChats(sidebarCache.totalChats)
    } else {
      fetchHistory()
    }

    sidebarCache.lastFetch = now

    // Listen for new chat creation and title updates - always refresh on these events
    const handleChatEvent = () => fetchHistory({ refresh: true })
    window.addEventListener('chat-created', handleChatEvent)
    window.addEventListener('chat-title-updated', handleChatEvent)
    return () => {
      window.removeEventListener('chat-created', handleChatEvent)
      window.removeEventListener('chat-title-updated', handleChatEvent)
    }
  }, [])

  return (
    <div className={cn("relative flex h-full w-64 flex-col bg-transparent", className)}>
      {/* Header */}
      <div className="flex h-16 items-center gap-2 px-6 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
          K
        </div>
        <span className="text-xl font-bold text-slate-900">Kevin</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4">
        <nav className="space-y-1">
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
                prefetch={false}
                className={cn(
                    "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive 
                        ? "bg-white text-primary shadow-sm" 
                        : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                )}
                >
                <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", 
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

        {/* Chat History Section */}
        <div className="mt-8">
            <div className="mb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                History
            </div>
            <div className="space-y-1">
                <Link href="/dashboard" prefetch={false}>
                    <button className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition-all hover:bg-white/50 hover:text-slate-700 text-left">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200">
                            <MessageSquare className="h-3 w-3 text-slate-500" />
                        </div>
                        New Chat
                    </button>
                </Link>
                {chatHistory.map((chat) => {
                    const isActive = pathname === `/chat/${chat.id}`
                    return (
                        <Link
                            key={chat.id}
                            href={`/chat/${chat.id}`}
                            prefetch={false}
                            className={cn(
                                "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                                isActive 
                                    ? "bg-white text-primary shadow-sm" 
                                    : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                            )}
                        >
                            <span className="truncate" title={chat.title}>{chat.title || "New Chat"}</span>
                        </Link>
                    )
                })}
            </div>
            {chatHistory.length < totalChats && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-muted-foreground hover:text-primary mt-2"
                    onClick={() => fetchHistory({ loadMore: true })}
                    disabled={isLoadingMore}
                >
                    {isLoadingMore ? "Loading..." : "Load More"}
                </Button>
            )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-auto p-4 pt-2">
        <div className="flex items-center gap-2">
            <Link
                href="/dashboard/settings"
                prefetch={false}
                className="flex-1 flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Settings className="h-4 w-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-slate-700">Settings</p>
                </div>
            </Link>
        </div>
      </div>
    </div>
  )
}
