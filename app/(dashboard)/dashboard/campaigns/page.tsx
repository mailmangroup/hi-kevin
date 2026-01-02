import { CampaignList } from "@/components/campaigns/campaign-list"
import { CampaignBuilder } from "@/components/campaigns/campaign-builder"
import { LaunchChecklist } from "@/components/campaigns/launch-checklist"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CampaignsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Plan, execute, and track your marketing campaigns across platforms.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Active Campaigns */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active & Recent</h2>
            </div>
            <CampaignList />
          </section>

          <section>
             <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Campaign Builder</h2>
            </div>
            <CampaignBuilder />
          </section>
        </div>

        {/* Right Column - Utilities */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Launch Readiness</h2>
            <LaunchChecklist />
          </section>
        </div>
      </div>
    </div>
  )
}
