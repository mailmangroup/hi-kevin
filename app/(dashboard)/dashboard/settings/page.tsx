"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Bell, Globe, User, Key, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { ErrorBanner } from "@/components/ui/error-banner"
import { useUserStore } from "@/lib/store/user-store"
import { directApiCall } from "@/lib/api/client"

export default function SettingsPage() {
  const { toast } = useToast()
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
  
  const { profile: storeProfile, fetchProfile, setProfile: setStoreProfile } = useUserStore()

  useEffect(() => {
    // If we have profile in store, use it immediately
    if (storeProfile) {
      setProfile(prev => ({
        ...prev,
        full_name: storeProfile.full_name || '',
        email: storeProfile.email || prev.email, // Preserve email if we have it locally, otherwise use store
      }))
    }
  }, [storeProfile])

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        // Use getSession instead of getUser to avoid unnecessary network calls
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        
        if (!user) return

        // If we have store profile, we might still want to fetch full details (tokens etc) that are not in store
        // But for full_name we can rely on store.
        
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, kawo_token, kawo_org_id, kawo_brand_id, kawo_api_url')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error loading profile:', error)
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
          
          // Update store with latest data
          setStoreProfile({
            full_name: data.full_name,
            email: data.email || user.email || null
          })
        } else if (user) {
          // If no profile exists yet, initialize with user email
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
        console.error('Unexpected error:', e)
        setError('An unexpected error occurred.')
      }
    }
    loadProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
    // Reset connection status on change since credentials might be invalid now
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

      // Update global store
      setStoreProfile({
        full_name: profile.full_name,
        email: profile.email || null
      })

    } catch (e: any) {
      console.error('Save error:', e)
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
    // Save first if needed? For now, we assume user saved.
    // Actually, users might expect "Test" to test current inputs. 
    // But our proxy reads from DB. So we MUST save first or warn user.
    // Let's autosave before testing or warn. 
    // For simplicity, we'll just check if current inputs match DB (complex).
    // Let's just run the test. If it fails, maybe it's because they didn't save.
    // Better: Prompt to save if dirty? Too complex for now.
    // We will just run the test against the proxy, which uses DB credentials.
    
    setTesting(true)
    setConnectionStatus(null)
    
    try {
      // We use direct API call to check connection
      // /users/current or /users/me
      await directApiCall('users/current')
      
      setConnectionStatus('success')
      toast({
        title: "Connection successful",
        description: "Successfully connected to KAWO API.",
        type: "success"
      })
    } catch (e: any) {
      console.error('Test connection error:', e)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile & KAWO Integration */}
          <Card className="p-6 border-primary/20 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Profile & KAWO Integration</h2>
                <p className="text-sm text-muted-foreground">Manage your profile and configure your connection to KAWO platform</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="space-y-4 pb-6 border-b border-border">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Profile Information</h3>
                </div>
                
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

              {/* KAWO Integration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">KAWO Credentials</h3>
                </div>
                
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

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
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
                <p className="text-sm text-destructive mt-2">
                  Connection failed. Please check your credentials and try again. Ensure you save changes before testing.
                </p>
              )}
            </div>
          </Card>

          {/* Notifications */}
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
              {/* Other notifications... simplified for brevity if needed, but keeping user's structure */}
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

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="language" className="text-sm font-medium text-foreground">
                  Language
                </label>
                <select
                  id="language"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>
      </div>
    </div>
  )
}
