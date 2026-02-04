import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { KawoCredentialsModal } from '@/components/onboarding/kawo-credentials-modal'

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

export async function OnboardingCheck() {
  const showOnboarding = await getOnboardingStatus()

  if (!showOnboarding) return null

  return <KawoCredentialsModal />
}
