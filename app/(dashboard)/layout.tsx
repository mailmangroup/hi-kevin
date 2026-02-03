import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { KawoCredentialsModal } from '@/components/onboarding/kawo-credentials-modal'
import { Sidebar } from "@/components/layout/sidebar"
import { RouteMain } from "@/components/layout/route-main"

// Cache the onboarding check for the duration of a request
const getOnboardingStatus = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('kawo_token, kawo_org_id, kawo_brand_id')
    .eq('id', user.id)
    .maybeSingle()

  return !profile || !profile.kawo_token || !profile.kawo_org_id || !profile.kawo_brand_id
})

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const showOnboarding = await getOnboardingStatus()

  return (
    <div className="flex h-screen overflow-hidden bg-transparent relative">
      <div className="hidden md:block z-20">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden bg-transparent relative z-10">
        <RouteMain>{children}</RouteMain>
      </div>
      {showOnboarding && <KawoCredentialsModal />}
    </div>
  )
}
