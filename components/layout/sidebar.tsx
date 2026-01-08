"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Search,
  Megaphone,
  Shield,
  Settings
} from "lucide-react"
import { BetaBadge } from "@/components/ui/beta-badge"
import { frostService } from "@/lib/api/frost"

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
    isBeta: true,
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

  useEffect(() => {
    const fetchLeadsCount = async () => {
      try {
        const response = await frostService.getNewLeadsCount()
        const count = response.count

        setNavItems(prev => prev.map(item => {
          if (item.title === "Leads") {
            return { ...item, badge: count > 0 ? count : undefined }
          }
          return item
        }))
      } catch (error) {
        console.error("Failed to fetch new leads count:", error)
      }
    }

    fetchLeadsCount()
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
      <nav className="flex-1 space-y-1 p-4">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 flex items-center gap-2">
                {item.title}
                {item.isBeta && <BetaBadge />}
              </span>
              {item.badge && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Settings at bottom */}
        <div className="pt-4">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/dashboard/settings"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Settings className="h-5 w-5" />
            <span className="flex-1">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User profile */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
            J
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Jeremy</p>
            <p className="text-xs text-sidebar-foreground/60">jeremy@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
