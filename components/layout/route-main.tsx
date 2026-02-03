"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"

export function RouteMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/")

  return (
    <main
      className={cn(
        "flex-1 bg-transparent relative z-10",
        isChatRoute ? "overflow-hidden" : "overflow-y-auto"
      )}
    >
      <div
        className={cn(
          isChatRoute ? "h-full w-full" : "container mx-auto max-w-7xl p-6 md:p-8"
        )}
      >
        {children}
      </div>
    </main>
  )
}
