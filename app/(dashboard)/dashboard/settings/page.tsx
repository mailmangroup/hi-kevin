"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Bell, Shield, Globe, User, Key, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { ErrorBanner } from "@/components/ui/error-banner"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null)
  const [credentials, setCredentials] = useState({
    kawo_token: '',
    kawo_org_id: '',
    kawo_brand_id: '',
    kawo_api_url: ''
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('kawo_token, kawo_org_id, kawo_brand_id, kawo_api_url')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error loading profile:', error)
          setError('Failed to load settings. Please try refreshing.')
          return
        }

        if (data) {
          setCredentials({
            kawo_token: data.kawo_token || '',
            kawo_org_id: data.kawo_org_id || '',
            kawo_brand_id: data.kawo_brand_id || '',
            kawo_api_url: data.kawo_api_url || ''
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
    setCredentials(prev => ({
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
          email: user.email,
          ...credentials,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Settings saved",
        description: "Your KAWO credentials have been updated successfully.",
        type: "success"
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
      // We use the proxy to call a lightweight endpoint.
      // /api/proxy/me (assuming this endpoint exists in KAWO API or we just check if proxy lets us through)
      const response = await fetch('/api/proxy/users/current') // Using 'users/current' as a common pattern, or 'me'
      
      if (response.ok) {
        setConnectionStatus('success')
        toast({
          title: "Connection successful",
          description: "Successfully connected to KAWO API.",
          type: "success"
        })
      } else {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Connection failed')
      }
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
          
          {/* KAWO Integration */}
          <Card className="p-6 border-primary/20 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-full">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">KAWO Integration</h2>
                <p className="text-sm text-muted-foreground">Configure your connection to KAWO platform</p>
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
                  value={credentials.kawo_token}
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
                    value={credentials.kawo_org_id}
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
                    value={credentials.kawo_brand_id}
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
                  value={credentials.kawo_api_url}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Leave blank to use default.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Credentials
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

          {/* Profile Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Profile</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  defaultValue="Jeremy Dai"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="jeremy@example.com"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium text-foreground">
                  Company
                </label>
                <Input
                  id="company"
                  type="text"
                  defaultValue="Kevin AI"
                  disabled
                />
              </div>
              {/* <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button> */}
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

          {/* Security */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm font-medium text-foreground">
                  Current Password
                </label>
                <Input
                  id="current-password"
                  type="password"
                  disabled
                />
              </div>
              <Button variant="outline" disabled>Update Password</Button>
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

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
