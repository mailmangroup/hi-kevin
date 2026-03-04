# Kevin - AI Marketing Co-pilot

Kevin is an AI-driven Marketing Co-pilot that helps solo marketers manage entire marketing teams' workloads. 

This repository contains the **Frontend Application** for Kevin, built with Next.js. It connects to a separate Python (FastAPI) backend service via a secure API Proxy.

The application uses a hybrid architecture:
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS.
- **Backend Service**: External Python FastAPI service.
- **Authentication**: Supabase (Frontend) + Custom Token Injection (Backend).

## Overview

Kevin transforms how single marketers handle multiple roles:
- **Data Analyst** - Automated analytics and competitor tracking
- **Content Creator** - AI-powered content generation and localization
- **SDR** - Lead scoring and automated follow-up suggestions
- **PMM** - Campaign management and market insights

### Key Benefits

- **Efficiency**: Compress 8-10 hours of work into 4-5 hours
- **Capability Extension**: One person handles multiple marketing functions
- **Language Bridge**: Manage Chinese social media without fluency

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: 
  - Server: TanStack Query (React Query)
  - Client: Zustand
- **Authentication & User Data**: Supabase
- **Visualizations**: Recharts
- **Forms**: React Hook Form + Zod
- **Internationalization**: next-intl

## Project Structure

```
kevin-demo/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Main application layout & pages
│   │   ├── dashboard/     # Dashboard views (Analytics, Content, Leads, etc.)
│   │   └── chat/          # Chat interface pages
│   ├── api/               # API Routes
│   │   └── proxy/         # Backend API Proxy
│   └── login/             # Authentication page
├── components/
│   ├── analytics/         # Analytics specific components
│   ├── brand-safety/      # Brand Safety components
│   ├── campaigns/         # Campaign management components
│   ├── chat/              # Chat interface components
│   ├── content/           # Content generation & workspace
│   ├── dashboard/         # Main dashboard widgets
│   ├── landing/           # Landing page components
│   ├── layout/            # Sidebar, Header, etc.
│   ├── leads/             # Leads & CRM components
│   └── ui/                # Shared UI components (shadcn/ui)
├── lib/
│   ├── api/               # API clients (Analytics, Frost, Chat)
│   ├── hooks/             # Custom React hooks
│   ├── mock/              # Mock data for demo mode
│   ├── supabase/          # Supabase client configuration
│   └── utils/             # Helper functions
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

#### Using Makefile (Recommended)

```bash
# See all available commands
make help

# Install dependencies
make install

# Run development server
make dev

# Build for production
make build

# Start production server
make start

# Run linter
make lint

# Clean build artifacts
make clean
```

#### Using npm directly

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mock Mode (Set to false to use real backend)
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_FORCE_MOCK=false

# Backend Configuration (Optional if set in user profile)
KAWO_API_URL=your_backend_api_url
```

## Architecture

### 1. API Proxy Pattern
The application implements a secure proxy pattern to handle authentication with the external backend:

1. **Frontend Login**: User logs in via Supabase Auth.
2. **Request Interception**: Frontend requests are sent to Next.js API Proxy (`/api/proxy/...`).
3. **Credential Injection**:
   - The proxy middleware validates the Supabase session.
   - It fetches the user's KAWO credentials (`kawo_token`, `kawo_org_id`, `kawo_brand_id`, `kawo_api_url`) from the Supabase `profiles` table.
   - The `Authorization` header (Bearer token) and `X-KAWO-Org-Id` / `X-KAWO-Brand-Id` headers are injected into the request.
4. **Forwarding**: The request is forwarded to the configured backend API URL.

### 2. State Management & Data Fetching
- **TanStack Query (React Query)**: Manages server state, caching, and polling.
- **Zustand**: Manages global client UI state.
- **Mock vs Real Data**: 
  - `lib/api/client.ts` contains a `USE_MOCK` flag (controlled by `NEXT_PUBLIC_USE_MOCK`).
  - When enabled, it returns mock data immediately.
  - When disabled, it routes requests through `/api/proxy`.

## External Backend Architecture

The external backend service (managed in a separate repository) handles:
- **MongoDB**: Primary operational database (User content, conversations, operational data).
- **PostgreSQL (pgvector)**: Vector store for RAG capabilities.
- **LangChain/LLM Orchestration**: Handling complex AI flows.

## API Migration Status

This section tracks the migration status of API endpoints from Mock Data to Real Backend.

| Feature Category | Feature | Status | Backend Endpoint (via Proxy) |
|-----------------|----------|--------|-----------------|
| **Content** | `aiService.generateContent` | ✅ Integrated | `POST /content/write` |
| | `aiService.localizeContent` | 🟡 Partial | `POST /ai/localize` (with mock fallback) |
| | `aiService.analyzeCompliance` | 🟡 Partial | `POST /ai/compliance` (with mock fallback) |
| **Leads/Frost** | `frostService.getDashboard` | ✅ Integrated | `GET /frost/dashboard` |
| | `frostService.getNewLeadsCount` | ✅ Integrated | `GET /frost/leads/new-count` |
| | `frostService.searchContacts` | ✅ Integrated | `POST /frost/contacts/search` |
| | `aiService.generateFollowUp` | 🟡 Partial | `POST /ai/follow-up` (with mock fallback) |
| **Analytics** | `analyticsService.getAnalyticsData` | ✅ Integrated | `GET /analytics/dashboard` |
| | `aiService.generateReport` | 🟡 Partial | `POST /ai/report` (with mock fallback) |
| **Chat** | `aiService.chatStream` | ✅ Integrated | `POST /agent/query` (Streaming SSE) |
| | `aiService.getConversations` | ✅ Integrated | `GET /agent/conversations` |
| | `aiService.getMessages` | ✅ Integrated | `GET /agent/conversations/{id}/messages` |
| | Deep Agent (within chat) | ✅ Integrated | Embedded in `/agent/query` stream |
| | Artifacts (within chat) | ✅ Integrated | Embedded in `/agent/query` stream |
| **Reports** | `aiService.getReport` | ✅ Integrated | `GET /agent/conversations/{id}/report/{reportId}` |
| | `aiService.updateReportInsights` | ✅ Integrated | `PUT /agent/reports/{reportId}/pages/{page}/sections/{section}/insights` |
| **Dashboard** | `getDashboardData` | 🔴 Mock | - |

## Implementation Details

### Content Generation (Integrated)
- **Frontend Service:** `aiService.generateContent`
- **Backend Endpoint:** `POST /content/write`
- **Payload:** Maps `brief` and `platform` to backend `ContentGenerationRequest`.

### Chat System (Integrated)
- **Frontend Service:** `aiService.chatStream`
- **Backend Endpoint:** `POST /agent/query`
- **Mechanism:** Server-Sent Events (SSE) for streaming responses.
- **Features:** Supports tool usage, web search toggling, and history management.

### Frost / Leads (Integrated)
- **Frontend Service:** `frostService`
- **Backend Endpoint:** `/frost/...`
- **Features:** Dashboard stats, new lead counts, and contact search are fully connected to the backend CRM integration.

### Deep Agent & Artifacts (Integrated via Chat Stream)
- **Feature:** Both deep agent plans and artifacts are embedded in chat streaming responses
- **Backend Endpoint:** `POST /agent/query` (Streaming SSE)
- **Components:**
  - Deep Agent: `deep-agent-display.tsx`, `tool-call-display.tsx`
  - Artifacts: `artifact-display.tsx`, `artifact-panel.tsx`, `artifact-renderers.tsx`
- **How It Works:** Backend streams research progress and generates artifacts within the chat flow, frontend detects and renders them in real-time.

### Reports (Integrated)
- **Report Retrieval:** `aiService.getReport()` → `GET /agent/conversations/{id}/report/{reportId}`
- **Update Insights:** `aiService.updateReportInsights()` → `PUT /agent/reports/{reportId}/pages/{page}/sections/{section}/insights`
- **Components:** `report-content.tsx`, `report-outline-sidebar.tsx`
- **Features:** Editable insights, outline-based navigation, real-time content updates.

