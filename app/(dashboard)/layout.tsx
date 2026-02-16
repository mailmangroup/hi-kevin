import { Suspense } from 'react'
import { Sidebar } from "@/components/layout/sidebar"
import { RouteMain } from "@/components/layout/route-main"
import { OnboardingCheck } from "@/components/onboarding/onboarding-check"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent relative">
      <Suspense fallback={<div className="hidden md:block w-[280px] bg-background border-r" />}>
        <div className="hidden md:block z-20">
          <Sidebar />
        </div>
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden bg-transparent relative z-10">
        <RouteMain>{children}</RouteMain>
      </div>
      {/* Onboarding check is now non-blocking - renders in parallel */}
      <Suspense fallback={null}>
        <OnboardingCheck />
      </Suspense>
    </div>
  )
}
