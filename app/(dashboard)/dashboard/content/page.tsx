import { CalendarView } from "@/components/content/calendar-view"
import { DraftWorkspace } from "@/components/content/draft-workspace"
import { AIContentGenerator } from "@/components/content/ai-generator"
import { ComplianceChecker } from "@/components/content/compliance-checker"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import Link from "next/link"

export default function ContentPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Agent</h1>
          <p className="text-muted-foreground mt-2">
            Manage your content calendar, create new posts, and track performance.
          </p>
        </div>
        <Link href="/dashboard/content/localize">
          <Button variant="outline" className="gap-2">
            <Globe className="h-4 w-4" />
            Localization Tool
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Calendar (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Content Calendar</h2>
            </div>
            <CalendarView />
          </section>

          <section>
            <DraftWorkspace />
          </section>
        </div>

        {/* Right Column - AI Tools */}
        <div className="space-y-8">
          <AIContentGenerator />
          
          {/* Quick Stats or Tips could go here */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="font-semibold text-lg mb-2">Weekly Goal</h3>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-bold">12</span>
              <span className="text-white/80 mb-1">/ 15 posts</span>
            </div>
            <div className="w-full bg-white/30 h-2 rounded-full mt-2">
              <div className="bg-white h-full rounded-full w-[80%]" />
            </div>
            <p className="text-sm mt-4 text-white/90">
              You&apos;re on track! 3 more posts needed to hit your weekly target across all platforms.
            </p>
          </div>

          <ComplianceChecker />
        </div>
      </div>
    </div>
  )
}
