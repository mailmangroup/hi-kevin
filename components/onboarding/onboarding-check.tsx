"use client"

import { useUserStore } from "@/lib/store/user-store"
import { KawoCredentialsModal } from "@/components/onboarding/kawo-credentials-modal"

export function OnboardingCheck() {
  const profile = useUserStore((state) => state.profile)
  const isLoading = useUserStore((state) => state.isLoading)

  // Don't show anything while profile is loading or not yet fetched
  if (isLoading || !profile) return null

  // Show onboarding if credentials are missing
  const needsOnboarding = !profile.kawo_token || !profile.kawo_org_id || !profile.kawo_brand_id

  if (!needsOnboarding) return null

  return <KawoCredentialsModal />
}
