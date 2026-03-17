"use client"

import { useState, useEffect, type ComponentType } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Bell, Globe, User, Key, CheckCircle, Loader2, Brain } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { ErrorBanner } from "@/components/ui/error-banner"
import { useUserStore } from "@/lib/store/user-store"
import { directApiCall } from "@/lib/api/client"
import { cn } from "@/lib/utils/cn"
import { UserMemorySection } from "@/components/settings/user-memory-section"

type SettingsPageKey = 'general' | 'connection' | 'memory'

const SETTINGS_PAGES: { key: SettingsPageKey; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'general', label: 'General', icon: User },
  { key: 'connection', label: 'Connection', icon: Key },
  { key: 'memory', label: 'Memory', icon: Brain },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const [activePage, setActivePage] = useState<SettingsPageKey>('general')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    kawo_token: '',
    kawo_org_id: '',
    kawo_brand_id: '',
    kawo_api_url: ''
  })
  const [error, setError] = useState<string | null>(null)

  const { profile: storeProfile, setProfile: setStoreProfile } = useUserStore()

  useEffect(() => {
    if (storeProfile) {
      setProfile(prev => ({
        ...prev,
        full_name: storeProfile.full_name || '',
        email: storeProfile.email || prev.email,
      }))
    }
  }, [storeProfile])

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user

        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, kawo_token, kawo_org_id, kawo_brand_id, kawo_api_url')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          if (process.env.NODE_ENV === 'development') console.error('Error loading profile:', error)
          setError('Failed to load settings. Please try refreshing.')
          return
        }

        if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: data.email || user.email || '',
            kawo_token: data.kawo_token || '',
            kawo_org_id: data.kawo_org_id || '',
            kawo_brand_id: data.kawo_brand_id || '',
            kawo_api_url: data.kawo_api_url || ''
          })

          setStoreProfile({
            full_name: data.full_name,
            email: data.email || user.email || null,
            kawo_token: data.kawo_token,
            kawo_org_id: data.kawo_org_id,
            kawo_brand_id: data.kawo_brand_id,
            kawo_api_url: data.kawo_api_url,
          })
        } else {
          setProfile({
            full_name: '',
            email: user.email || '',
            kawo_token: '',
            kawo_org_id: '',
            kawo_brand_id: '',
            kawo_api_url: ''
          })
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.error('Unexpected error:', e)
        setError('An unexpected error occurred.')
      }
    }

    loadProfile()
  }, [setStoreProfile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))

    if (connectionStatus) setConnectionStatus(null)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setConnectionStatus(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to save settings.')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: profile.email || user.email,
          full_name: profile.full_name,
          kawo_token: profile.kawo_token,
          kawo_org_id: profile.kawo_org_id,
          kawo_brand_id: profile.kawo_brand_id,
          kawo_api_url: profile.kawo_api_url,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Settings saved",
        description: "Your profile and KAWO credentials have been updated successfully.",
        type: "success"
      })

      setStoreProfile({
        full_name: profile.full_name,
        email: profile.email || null,
        kawo_token: profile.kawo_token,
        kawo_org_id: profile.kawo_org_id,
        kawo_brand_id: profile.kawo_brand_id,
        kawo_api_url: profile.kawo_api_url,
      })
    } catch (e: any) {
      if (process.env.NODE_ENV === 'development') console.error('Save error:', e)
      setError(e.message || 'Failed to save settings')
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        type: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setConnectionStatus(null)

    try {
      await directApiCall('me')

      setConnectionStatus('success')
      toast({
        title: "Connection successful",
        description: "Successfully connected to KAWO API.",
        type: "success"
      })
    } catch (e: any) {
      if (process.env.NODE_ENV === 'development') console.error('Test connection error:', e)
      setConnectionStatus('error')
      toast({
        title: "Connection failed",
        description: e.message || "Could not connect to KAWO. Check your credentials.",
        type: "error"
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      {error && (
        <ErrorBanner
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <Card className="p-3 h-fit lg:sticky lg:top-6">
          <nav className="space-y-1">
            {SETTINGS_PAGES.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePage(item.key)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors flex items-center gap-2",
                    activePage === item.key
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </Card>

        <div className="space-y-6">
          {activePage === 'general' && (
            <>
              <Card className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Profile</h2>
                    <p className="text-sm text-muted-foreground">Basic account information</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="full_name" className="text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={profile.full_name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={profile.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Button onClick={handleSave} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Profile
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Preferences</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="language" className="text-sm font-medium text-foreground">
                      Language
                    </label>
                    <select
                      id="language"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="timezone" className="text-sm font-medium text-foreground">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      defaultValue="utc"
                    >
                      <option value="utc">UTC</option>
                      <option value="pst">PST (UTC-8)</option>
                      <option value="est">EST (UTC-5)</option>
                      <option value="cst">CST (UTC+8)</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Notifications</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-foreground">
                        Email Notifications
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your account activity
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="border-t border-border" />
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-foreground">
                        Campaign Alerts
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when campaigns are launched or completed
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </Card>
            </>
          )}

          {activePage === 'connection' && (
            <Card className="p-6 border-primary/20 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">KAWO Connection</h2>
                  <p className="text-sm text-muted-foreground">Configure your API credentials for KAWO integration</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="kawo_token" className="text-sm font-medium text-foreground">
                    KAWO User Token
                  </label>
                  <Input
                    id="kawo_token"
                    type="password"
                    placeholder="Enter your KAWO user token"
                    value={profile.kawo_token}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in your KAWO user settings under API Access
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="kawo_org_id" className="text-sm font-medium text-foreground">
                      Organization ID
                    </label>
                    <Input
                      id="kawo_org_id"
                      type="text"
                      placeholder="e.g. 5bbeb8..."
                      value={profile.kawo_org_id}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="kawo_brand_id" className="text-sm font-medium text-foreground">
                      Brand ID
                    </label>
                    <Input
                      id="kawo_brand_id"
                      type="text"
                      placeholder="e.g. 5a9655..."
                      value={profile.kawo_brand_id}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="kawo_api_url" className="text-sm font-medium text-foreground">
                    KAWO API URL
                  </label>
                  <Input
                    id="kawo_api_url"
                    type="text"
                    placeholder="https://api.kawo.com"
                    value={profile.kawo_api_url}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Leave blank to use default.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Button onClick={handleSave} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Connection
                </Button>

                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || loading}
                  className={connectionStatus === 'success' ? "border-green-500 text-green-600 hover:text-green-700 hover:bg-green-50" : ""}
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : connectionStatus === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  {testing ? 'Testing...' : connectionStatus === 'success' ? 'Connected' : 'Test Connection'}
                </Button>
              </div>

              {connectionStatus === 'error' && (
                <p className="text-sm text-destructive mt-3">
                  Connection failed. Please check your credentials and try again. Ensure you save changes before testing.
                </p>
              )}
            </Card>
          )}

          {activePage === 'memory' && <UserMemorySection />}
        </div>
      </div>
    </div>
  )
}
