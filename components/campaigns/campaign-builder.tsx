"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, Calendar, Wallet, Users, ArrowRight } from "lucide-react"

const STEPS = [
  { id: 1, title: "Objective", icon: Target },
  { id: 2, title: "Audience", icon: Users },
  { id: 3, title: "Budget", icon: Wallet },
  { id: 4, title: "Schedule", icon: Calendar },
]

export function CampaignBuilder() {
  const [currentStep, setCurrentStep] = useState(1)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold">Create New Campaign</h2>
        <Badge variant="outline">Draft</Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-12 px-4 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10" />
        {STEPS.map((step) => {
          const Icon = step.icon
          const isActive = currentStep >= step.id
          const isCurrent = currentStep === step.id

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
              <div 
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center transition-all
                  ${isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}
                  ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                `}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step Content Placeholder */}
      <div className="min-h-[200px] border-2 border-dashed border-slate-100 rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 mb-8">
        <p>Campaign Builder Form Steps</p>
        <p className="text-sm opacity-60 mt-1">Step {currentStep}: {STEPS[currentStep-1].title} Configuration</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        <Button 
          onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
          className="gap-2"
        >
          {currentStep === 4 ? 'Launch Campaign' : 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
