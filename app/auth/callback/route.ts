import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Handles the Google OAuth redirect: exchanges the code for a session cookie,
// then sends the user into the app.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
