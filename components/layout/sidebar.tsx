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
import { ModeToggle } from "@/components/mode-toggle"

// Simple cache to avoid refetching on every navigation
const sidebarCache = {
  leadsCount: null as number | null,
  chatHistory: null as Conversation[] | null,
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

    const fetchHistory = async (forceRefresh = false) => {
        try {
            const { conversations } = await aiService.getConversations(10)
            sidebarCache.chatHistory = conversations
            setChatHistory(conversations)
        } catch (error: any) {
            // Ignore missing credentials error as it's expected during onboarding
            if (error?.code === 'CREDENTIALS_MISSING') return
            console.error("Failed to fetch chat history:", error)
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
    } else {
      fetchHistory()
    }

    sidebarCache.lastFetch = now

    // Listen for new chat creation and title updates - always refresh on these events
    const handleChatEvent = () => fetchHistory(true)
    window.addEventListener('chat-created', handleChatEvent)
    window.addEventListener('chat-title-updated', handleChatEvent)
    return () => {
      window.removeEventListener('chat-created', handleChatEvent)
      window.removeEventListener('chat-title-updated', handleChatEvent)
    }
  }, [])

  return (
    <div className={cn("flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
          K
        </div>
        <span className="text-xl font-bold text-sidebar-foreground">Kevin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
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
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/5 hover:text-primary",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
              <span className="flex-1 truncate">{item.title}</span>
              <div className="ml-auto flex items-center gap-2">
                {item.isBeta && <BetaBadge />}
                {item.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}

        {/* Chat History Section */}
        <div className="mt-8">
            {chatHistory.length > 0 && (
                <div className="flex items-center justify-between px-3 mb-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground/70">
                        Chat History
                    </h3>
                </div>
            )}

            {/* New Chat Button */}
            <Link href="/dashboard">
                <div className="mb-3 px-3">
                    <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-white">
                        <MessageSquare className="h-4 w-4" />
                        New Chat
                    </Button>
                </div>
            </Link>
          
          <div className="space-y-1">
            {chatHistory.map((chat) => {
                const isActive = pathname === `/chat/${chat.id}`
                return (
                    <Link
                        key={chat.id}
                        href={`/chat/${chat.id}`}
                        className={cn(
                            "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-primary/5 hover:text-primary",
                            isActive ? "bg-primary/5 text-primary" : "text-muted-foreground"
                        )}
                    >
                        <span className="truncate" title={chat.title}>{chat.title || "New Chat"}</span>
                    </Link>
                )
            })}
          </div>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <ModeToggle />
        </div>
      </div>
    </div>
  )
}
