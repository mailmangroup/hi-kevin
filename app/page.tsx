"use client"

import { HeroSection } from "@/components/landing/hero-section"
import { MarketingFunctions } from "@/components/landing/marketing-functions"
import { AgentMatrix } from "@/components/landing/agent-matrix"
import { WorkflowDemo } from "@/components/landing/workflow-demo"
import { SopLibrary } from "@/components/landing/sop-library"
import { TrustSection } from "@/components/landing/trust-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      <HeroSection />
      <MarketingFunctions />
      <AgentMatrix />
      <WorkflowDemo />
      <SopLibrary />
      <TrustSection />
      <LandingFooter />
    </div>
  )
}
