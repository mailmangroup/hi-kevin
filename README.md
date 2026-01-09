# Kevin - AI Marketing Co-pilot

Kevin is an AI-driven Marketing Co-pilot that helps solo marketers manage entire marketing teams' workloads. Designed specifically for international brands managing Chinese social media platforms (小红书, 抖音, 微博, 微信).

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
