"use client"

import { useState, useEffect } from "react"
import { ComplianceAlertCards } from "@/components/brand-safety/compliance-alert-cards"
import { SensitiveDateCalendar } from "@/components/brand-safety/sensitive-date-calendar"
import { BrandGuidelinesChecker } from "@/components/brand-safety/brand-guidelines-checker"
import { getComplianceAlerts, updateAlertStatus, type ComplianceAlert } from "@/lib/mock"

export default function BrandSafetyPage() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAlerts() {
      const data = await getComplianceAlerts()
      setAlerts(data)
      setLoading(false)
    }
    loadAlerts()
  }, [])

  const handleUpdateAlert = async (alertId: string, status: "pending" | "resolved" | "ignored") => {
    await updateAlertStatus(alertId, status)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Brand Safety</h1>
        <p className="text-muted-foreground mt-2">
          Monitor compliance, review content, and ensure brand consistency across all platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column - Compliance Alerts (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Compliance Alerts</h2>
            </div>
            <ComplianceAlertCards
              alerts={alerts}
              loading={loading}
              onUpdateStatus={handleUpdateAlert}
            />
          </section>
        </div>

        {/* Right Column - Tools (Takes 1 column) */}
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Sensitive Date Calendar</h2>
            </div>
            <SensitiveDateCalendar />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Brand Guidelines</h2>
            </div>
            <BrandGuidelinesChecker />
          </section>
        </div>
      </div>
    </div>
  )
}


