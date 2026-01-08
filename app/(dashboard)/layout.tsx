import { createClient } from '@/lib/supabase/server'
import { KawoCredentialsModal } from '@/components/onboarding/kawo-credentials-modal'
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let showOnboarding = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('kawo_token, kawo_org_id, kawo_brand_id')
      .eq('id', user.id)
      .maybeSingle()
      
    if (!profile || !profile.kawo_token || !profile.kawo_org_id || !profile.kawo_brand_id) {
        showOnboarding = true
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
      {showOnboarding && <KawoCredentialsModal />}
    </div>
  )
}
