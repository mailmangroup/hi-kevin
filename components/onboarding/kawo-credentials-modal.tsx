"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/components/ui/toast"

export function KawoCredentialsModal() {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState({
    kawo_token: '',
    kawo_org_id: '',
    kawo_brand_id: '',
    kawo_api_url: ''
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
  }

  const handleSave = async () => {
    if (!credentials.kawo_token || !credentials.kawo_org_id || !credentials.kawo_brand_id) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields to continue.",
        type: "error"
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      // Use getSession instead of getUser to avoid unnecessary network calls
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save credentials.",
          type: "error"
        })
        return
      }

      // Validate that email exists
      if (!user.email) {
        toast({
          title: "Error",
          description: "Your account is missing an email address. Please contact support.",
          type: "error"
        })
        return
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...credentials,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Setup complete",
        description: "Your KAWO credentials have been saved.",
        type: "success"
      })
      
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error('Error saving credentials:', error)

      // Show more specific error message
      const errorMessage = error?.message || error?.details || "Failed to save credentials. Please try again."

      toast({
        title: "Error",
        description: errorMessage,
        type: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to Kevin AI</DialogTitle>
          <DialogDescription>
            To get started, please configure your KAWO credentials. This allows Kevin to access your account data securely.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="kawo_token">KAWO User Token</Label>
            <Input
              id="kawo_token"
              type="password"
              placeholder="Enter your user token"
              value={credentials.kawo_token}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kawo_api_url">KAWO API URL (Optional)</Label>
            <Input
              id="kawo_api_url"
              placeholder="https://api.kawo.com"
              value={credentials.kawo_api_url}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kawo_org_id">Organization ID</Label>
              <Input
                id="kawo_org_id"
                placeholder="e.g. 5bbeb8..."
                value={credentials.kawo_org_id}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kawo_brand_id">Brand ID</Label>
              <Input
                id="kawo_brand_id"
                placeholder="e.g. 5a9655..."
                value={credentials.kawo_brand_id}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Label({ htmlFor, children }: { htmlFor: string, children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>
}
