# Architecture & API Documentation

## Overview

The application uses a hybrid architecture with a Next.js frontend and a Python (FastAPI) backend. Data is persisted across multiple stores depending on the use case.

## Database Architecture

### 1. MongoDB (Primary Operational Database)
Used for storing application state, user content, conversations, and operational data.

- **Connection**: `motor.motor_asyncio.AsyncIOMotorClient` (Async driver)
- **Database Name**: `kevin_db` (Default)
- **Configuration**:
  - `DB_KEVIN_MONGOURI`: Connection string (Default: `mongodb://localhost:27017`)
  - `DB_KEVIN_DBNAME`: Database name (Default: `kevin_db`)

### 2. PostgreSQL (Vector Store)
Used for RAG (Retrieval-Augmented Generation) capabilities, storing embeddings for efficient similarity search.

- **Configuration**: `VECTOR_POSTGRES_DSN`

### 3. Supabase (Frontend Auth & User Data)
Used by the frontend for user authentication and storing user profiles containing KAWO credentials.

- **Tables**: `profiles` (Links Supabase User ID to KAWO Token/Org/Brand)

## Authorization Flow

The application implements a secure proxy pattern to handle authentication:

1. **Frontend Login**: User logs in via Supabase Auth.
2. **Request Interception**: Frontend requests are sent to Next.js API Proxy (`/api/proxy/...`).
3. **Credential Injection**:
   - The proxy middleware validates the Supabase session.
   - It fetches the user's KAWO credentials (`kawo_token`, `kawo_org_id`, `kawo_brand_id`, `kawo_api_url`) from the `profiles` table.
   - The `Authorization` header (Bearer token) and `X-KAWO-Org-Id` / `X-KAWO-Brand-Id` headers are injected into the request.
4. **Backend Validation**:
   - The Python backend receives the request with the injected token.
   - **Dependency**: `core.dependencies.get_current_user` verifies the token.
   - **Verification Logic**:
      1. Checks `auth_cache` collection in MongoDB for the token.
      2. If missing, calls KAWO API (`/me`) to validate and get user info.
      3. Caches the result in `auth_cache` to optimize future requests.

### Authentication Requirements
Authentication is always required for API proxy requests:
- Users must be authenticated via Supabase Auth
- KAWO credentials must be configured in the user's profile
- API URL is configured via `kawo_api_url` in profile, falling back to `KAWO_API_URL` environment variable if not set

## Frontend Caching (Local)
We use **TanStack Query (React Query)** to manage server state on the client.

- **Purpose**: Minimizes network requests, handles loading/error states, and ensures data freshness.
- **Implementation**:
  - `QueryClientProvider` wraps the application in `app/layout.tsx`.
  - Custom hooks (e.g., `useDashboardData`) encapsulate data fetching logic.
  - `staleTime` is configured (default 5 mins) to prevent immediate refetching.

## API Migration Status

This section tracks the migration status of API endpoints from Mock Data to Real Backend.

| Feature Category | Endpoint | Status | Backend Service |
|-----------------|----------|--------|-----------------|
| **Content** | `aiService.generateContent` | ✅ Integrated | `POST /content/write` |
| | `aiService.localizeContent` | 🔴 Mock | `POST /content/write` (with edit/polish) |
| | `aiService.analyzeCompliance` | 🔴 Mock | TBD |
| **Leads/Frost** | `frostService.getDashboard` | ✅ Integrated | `GET /frost/dashboard` |
| | `frostService.getNewLeadsCount` | ✅ Integrated | `GET /frost/leads/new-count` (returns count + contacts) |
| | `frostService.searchContacts` | ✅ Available | `POST /frost/contacts/search` |
| | `aiService.generateFollowUp` | 🔴 Mock | TBD |
| **Analytics** | `aiService.generateReport` | 🔴 Mock | TBD |
| **Chat** | `aiService.chat` | ✅ Integrated | `POST /agent/query` (streaming) |
| | `aiService.getConversations` | ✅ Integrated | `GET /agent/conversations` |
| | `aiService.getMessages` | ✅ Integrated | `GET /agent/conversations/{id}/messages` |
| **Dashboard** | `getDashboardData` | 🔴 Mock | `/kawo/stats` (likely) |

## Implementation Details

### Content Generation (Integrated)

**Frontend Service:** `aiService.generateContent`  
**Backend Endpoint:** `POST /content/write`

**Payload Mapping:**
- Frontend: `brief` (string), `platform` (string)
- Backend: `ContentGenerationRequest`
  - `query`: `brief` (required, non-empty)
  - `network`: `mapPlatformToNetwork(platform)` - Maps to backend network keys
  - `action`: `"generate"` (must be ActionType.GENERATE)
  - `target_field`: `"content"` (or "title")
  - `original_text`: `"<title></title><content></content>"` (required, empty structure for generation mode)
  - `content_type`: `"post"` (default) or "video_script"

**Valid Network Keys:**
- Chinese: `sweibo`, `wechat`, `douyin`, `kuaishou`, `bilibili`, `xhs`, `sph`
- International: `instagram`, `facebook`, `x`, `linkedin`, `youtube`, `tiktok`

**Platform Name Mapping:**
The frontend includes `mapPlatformToNetwork()` to convert user-friendly names to backend keys:
- "Xiaohongshu" / "RED" / "xhs" → "xhs"
- "Weibo" → "sweibo"
- "Twitter" / "X" → "x"
- "WeChat Channels" / "Channels" / "sph" → "sph"
- etc.

**Implementation Pattern:**
```typescript
// Frontend: lib/api/client.ts
aiService.generateContent(brief, platform)
  ↓
apiCall('proxy/content/write', { method: 'POST', body: payload })
  ↓
// Next.js Proxy: app/api/proxy/[...path]/route.ts
1. Authenticate via Supabase
2. Fetch KAWO credentials from profiles table
3. Forward to backend API (configured via kawo_api_url in profile or KAWO_API_URL env var)
  ↓
// Backend: Python FastAPI endpoint
POST /content/write
```

### Chat/Agent (Integrated)

**Frontend Service:** `aiService.chatStream`, `aiService.getConversations`, `aiService.getMessages`  
**Backend Endpoints:** 
- `POST /agent/query` (streaming)
- `GET /agent/conversations`
- `GET /agent/conversations/{id}`
- `GET /agent/conversations/{id}/messages`

**Streaming Implementation:**
- Uses Server-Sent Events (SSE) for real-time streaming
- Payload includes: `query`, `conversation_id`, `org_id`, `brand_id`, `stream: true`, `model`, `include_web_search`, `thinking_enabled`, `tool_selection_enabled`
- Response format: `data: {json}\n\n` chunks, ending with `data: [DONE]`

### Frost/HubSpot Leads Dashboard (Integrated)

**Frontend Service:** `frostService.getDashboard`  
**Backend Endpoint:** `GET /frost/dashboard`

**Implementation Pattern:**
```typescript
// Frontend: lib/api/frost.ts
frostService.getDashboard(period, limit)
  ↓
apiCall('proxy/frost/dashboard?period=current_week&limit=100')
  ↓
// Next.js Proxy: app/api/proxy/[...path]/route.ts
1. Authenticate via Supabase
2. Fetch KAWO credentials from profiles table
3. Forward to backend API (configured via kawo_api_url in profile or KAWO_API_URL env var)
  ↓
// Backend: app/controllers/frost_router.py
@router.get("/dashboard")
async def get_dashboard(period, limit, current_user)
  ↓
// Backend: app/services/frost_service.py
async def get_dashboard_data(period, limit):
  - Fetches leads from HubSpot (uses HUBSPOT_KEY from backend env)
  - Groups by source and stage
  - Calculates counts and percentages
  - Returns structured dashboard data
```

**Query Parameters:**
- `period` (default: 'current_week'): 'current_week' or 'last_week'
- `limit` (default: 100, max: 100): Maximum leads to fetch

**Response Structure:**
```typescript
{
  date_range: {
    start: "2024-01-01T00:00:00",
    end: "2024-01-08T00:00:00",
    days: 7
  },
  total_leads: 50,
  stages: ["new", "contacted", "qualified", "negotiation", "won", "lost"],
  sources: {
    "ORGANIC_SEARCH": {
      total: 25,
      percentage: 50.0,
      stages: {
        "new": { count: 10, percentage: 40.0 },
        "contacted": { count: 8, percentage: 32.0 },
        "qualified": { count: 5, percentage: 20.0 },
        ...
      }
    },
    ...
  },
  stage_totals: {
    "new": 20,
    "contacted": 15,
    "qualified": 10,
    ...
  },
  leads: [...] // Array of lead objects
}
```

**HubSpot Field Mappings:**
- **Lead Source:** `hs_analytics_source` or `hs_latest_source`
- **Lead Status:** `hs_lead_status` (mapped to frontend stages)
- **Score:** `hubspotscore`
- **Lifecycle Stage:** `lifecyclestage` (filters: lead, marketingqualifiedlead, salesqualifiedlead)
- **Created Date:** `createdate` (used for date filtering)

**Status Stage Mapping:**
The backend maps HubSpot's `hs_lead_status` to frontend stages:
- `new` ← new, open, new_lead
- `contacted` ← contacted, in_progress, attempting_contact
- `qualified` ← qualified, connected, meeting_scheduled
- `negotiation` ← negotiation, presentation_scheduled, decision_maker_bought_in
- `won` ← won, closed_won
- `lost` ← lost, closed_lost, unqualified

**Frontend Implementation:**
- **Component:** `app/(dashboard)/dashboard/leads/page.tsx`
- **Features:**
  - Date range selector (Current Week, Last Week)
  - Table view with sources as rows, stages as columns
  - Displays counts and percentages
  - Total row with stage summaries
  - Loading and error states
  - Automatic refresh on date range change

**Authentication Flow:**
Same as Content Generation - uses Supabase auth + KAWO credentials from profiles table.

**Backend Configuration:**
The backend requires `HUBSPOT_KEY` in its environment variables. This is the HubSpot Private App Access Token configured in the Kevin backend's `.env` file.

**HubSpot API Gotchas:**
- For `IN` operator in filters, use `"values"` (plural), not `"value"`
- For other operators (GTE, LTE, EQ, etc.), use `"value"` (singular)
- Example:
  ```python
  # Correct for IN operator
  {"propertyName": "lifecyclestage", "operator": "IN", "values": ["lead", "mql"]}

  # Correct for GTE operator
  {"propertyName": "createdate", "operator": "GTE", "value": "1704067200000"}
  ```

## Supabase Profiles Table Schema

**Table:** `profiles`

**Columns:**
- `id` (UUID, PRIMARY KEY): References `auth.users(id)`
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `kawo_token` (TEXT): KAWO authentication token
- `kawo_org_id` (TEXT): KAWO organization ID
- `kawo_brand_id` (TEXT): KAWO brand ID
- `kawo_user_id` (TEXT): KAWO user ID (optional)
- `kawo_api_url` (TEXT): Custom KAWO API URL (optional, falls back to `KAWO_API_URL` environment variable)
- `onboarding_completed` (BOOLEAN, DEFAULT false)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Row Level Security (RLS):**
- Users can only view their own profile
- Users can only update their own profile

**Auto-creation:**
A trigger automatically creates a profile when a new user signs up via Supabase Auth.

**SQL Setup:**
```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,

  -- KAWO Credentials
  kawo_token TEXT,
  kawo_org_id TEXT,
  kawo_brand_id TEXT,
  kawo_user_id TEXT,
  kawo_api_url TEXT,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Error Handling

**Error Codes:**
- `CREDENTIALS_MISSING`: KAWO credentials not configured in user profile
- `PROFILE_FETCH_FAILED`: Failed to load user profile from Supabase
- `AUTH_REQUIRED`: User not authenticated

**Error Handling Flow:**
1. API proxy returns error with `code` and optional `redirect` field
2. Frontend `apiCall()` function catches errors
3. If `code === 'CREDENTIALS_MISSING'` and `redirect` is set, automatically redirects user
4. Error messages are displayed via toast notifications or error banners

**Implementation:**
- `lib/api/error-handler.ts`: Error type definitions and message mappings
- `lib/api/client.ts`: Error handling in `apiCall()` function
- `components/ui/error-banner.tsx`: Reusable error banner component

## Settings UI

**File:** `app/(dashboard)/dashboard/settings/page.tsx`

**Features:**
- Loads KAWO credentials from Supabase `profiles` table on mount
- Input fields: KAWO Token (password), Org ID, Brand ID, API URL (optional)
- Save handler updates Supabase profile
- "Test Connection" button validates credentials by calling `/api/proxy/me`
- Success/error feedback via toast notifications

**Onboarding Modal:**
- `components/onboarding/kawo-credentials-modal.tsx`
- Modal shown for first-time users who haven't configured KAWO credentials
- Checks `onboarding_completed` flag in profile

## Next Steps

1. ✅ Content Generation - Integrated
2. ✅ Frost Leads Dashboard - Integrated
3. ✅ Chat/Agent endpoints - Integrated
4. 🔴 Map Dashboard Analytics (`/kawo/stats`)
5. 🔴 Add Lead Follow-up AI generation
6. 🔴 Implement Content Localization endpoint
7. 🔴 Implement Compliance Checker endpoint
8. 🔴 Implement Analytics Report generation
