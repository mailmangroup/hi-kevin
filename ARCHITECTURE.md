# Architecture & API Documentation

## Overview

This repository contains the **Frontend Application** for Kevin, built with Next.js. It connects to a separate Python (FastAPI) backend service via a secure API Proxy.

The application uses a hybrid architecture:
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS.
- **Backend Service**: External Python FastAPI service.
- **Authentication**: Supabase (Frontend) + Custom Token Injection (Backend).

## Frontend Architecture

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
| | `aiService.localizeContent` | 🔴 Mock | - |
| | `aiService.analyzeCompliance` | 🔴 Mock | - |
| **Leads/Frost** | `frostService.getDashboard` | ✅ Integrated | `GET /frost/dashboard` |
| | `frostService.getNewLeadsCount` | ✅ Integrated | `GET /frost/leads/new-count` |
| | `frostService.searchContacts` | ✅ Integrated | `POST /frost/contacts/search` |
| | `aiService.generateFollowUp` | 🔴 Mock | - |
| **Analytics** | `analyticsService.getAnalyticsData` | ✅ Integrated | `GET /analytics/dashboard` |
| | `aiService.generateReport` | 🔴 Mock | - |
| **Chat** | `aiService.chatStream` | ✅ Integrated | `POST /agent/query` (Streaming SSE) |
| | `aiService.getConversations` | ✅ Integrated | `GET /agent/conversations` |
| | `aiService.getMessages` | ✅ Integrated | `GET /agent/conversations/{id}/messages` |
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
