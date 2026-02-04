"use client"

import { useEffect } from "react"
import { SuggestionsList } from "@/components/dashboard/suggestions-list"
import { ChatInput } from "@/components/dashboard/chat-input"

export default function DashboardPage() {
  useEffect(() => {
    // Notify sidebar to refresh chat history when dashboard loads
    window.dispatchEvent(new Event('dashboard-loaded'))
  }, [])

  return (
    <div className="space-y-10">
      {/* Chat Input Section */}
      <ChatInput />

      {/* Kevin's Suggestions */}
      <SuggestionsList suggestions={[]} />
    </div>
  )
}
