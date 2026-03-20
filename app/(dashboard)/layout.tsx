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
      <div className="hidden md:block z-20">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden bg-transparent relative z-10">
        <RouteMain>{children}</RouteMain>
      </div>
      <OnboardingCheck />
    </div>
  )
}
