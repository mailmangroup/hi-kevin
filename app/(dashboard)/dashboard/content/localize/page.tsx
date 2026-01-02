import { LocalizationTool } from "@/components/content/localization-tool"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function LocalizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/content">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Localization</h1>
          <p className="text-muted-foreground">
            Adapt your global marketing content for Chinese social media platforms.
          </p>
        </div>
      </div>

      <LocalizationTool />

      <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li><strong>Xiaohongshu (Red):</strong> Focuses on emotional connection, emojis, and &quot;sharing&quot; tone.</li>
          <li><strong>Douyin:</strong> Short, punchy scripts with strong hooks and clear calls-to-action.</li>
          <li><strong>Weibo:</strong> News-like or micro-blogging style, suitable for official announcements.</li>
        </ul>
      </div>
    </div>
  )
}
