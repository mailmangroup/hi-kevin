import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handle GET, POST, PUT, DELETE, etc.
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path)
}

async function handleProxy(request: NextRequest, pathSegments: string[]) {
  // 1. Check Authentication
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let token: string | null = null
  let orgId: string | null = null
  let brandId: string | null = null
  let apiUrl: string | null = null

  if (!user) {
     if (process.env.NODE_ENV === 'development') {
        // Dev bypass
        token = process.env.VITE_TEST_USER_TOKEN || '1d655514-6cf4-4657-a08d-a3e35dd7dc50'
        orgId = process.env.VITE_TEST_ORG_ID || '5bbeb89b746706598113c33a'
        brandId = process.env.VITE_TEST_BRAND_ID || '5a96553fe4b03ac3f944278a'
        apiUrl = process.env.KAWO_API_URL || 'http://localhost:8000'
     } else {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
     }
  } else {
      // 2. Fetch Profile & Credentials
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('kawo_token, kawo_org_id, kawo_brand_id, kawo_api_url')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        return NextResponse.json(
          { error: 'Failed to load profile', code: 'PROFILE_FETCH_FAILED' },
          { status: 500 }
        )
      }

      // Check if credentials configured
      if (!profile || !profile.kawo_token || !profile.kawo_org_id || !profile.kawo_brand_id) {
        return NextResponse.json(
          { 
            error: 'KAWO credentials not configured. Please complete setup.', 
            code: 'CREDENTIALS_MISSING', 
            redirect: '/dashboard/settings' 
          },
          { status: 403 }
        )
      } else {
          token = profile.kawo_token
          orgId = profile.kawo_org_id
          brandId = profile.kawo_brand_id
          apiUrl = profile.kawo_api_url || 'http://localhost:8005'
      }
  }

  // 3. Construct Target URL
  const path = pathSegments.join('/')
  const baseUrl = apiUrl || 'http://localhost:8005'
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/${path}${request.nextUrl.search}`

  // 4. Prepare Headers
  const headers = new Headers(request.headers)
  
  // Remove host to avoid confusion
  headers.delete('host')
  headers.delete('connection')

  // Use user-specific credentials
  headers.set('Authorization', `Bearer ${token}`)
  if (orgId) headers.set('X-KAWO-Org-Id', orgId)
  if (brandId) headers.set('X-KAWO-Brand-Id', brandId)

  // 4. Forward Request
  try {
    const body = request.method !== 'GET' && request.method !== 'HEAD' 
      ? await request.blob() 
      : null

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      // @ts-ignore
      duplex: 'half', // Required for streaming bodies in some Next.js versions/Node
    })

    // Log errors for debugging
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend API Error:', {
        url: targetUrl,
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })

      // Return the error response
      return new NextResponse(errorText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }

    // 5. Return Response
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })

  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json(
      { error: 'Failed to communicate with backend' }, 
      { status: 502 }
    )
  }
}
