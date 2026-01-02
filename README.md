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
- **State**: Zustand
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Internationalization**: next-intl

## Project Structure

```
kevin-demo/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application
│   └── api/               # API routes (mock data)
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── layout/            # Layout components
│   ├── dashboard/         # Dashboard components
│   ├── content/           # Content Agent
│   ├── leads/             # Leads Agent
│   ├── analytics/         # Analytics Agent
│   ├── research/          # Research Agent
│   ├── campaigns/         # Campaign Agent
│   └── brand-safety/      # Brand Safety Agent
├── lib/
│   ├── api/               # API client
│   ├── mock/              # Mock data services
│   └── utils/             # Utility functions
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript definitions
└── messages/              # i18n translations
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

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
NEXT_PUBLIC_USE_MOCK=true  # Use mock data (default for demo)
```

## Features

### 🏠 Dashboard
- Today's focus with action items
- Kevin's intelligent suggestions
- Weekly performance overview
- Quick chat interface

### ✍️ Content Agent
- Content calendar management
- AI-powered draft generation
- Multi-platform localization
- Compliance checking
- Asset library

### 🎯 Leads Agent
- Visual pipeline management
- AI-powered lead scoring
- Automated follow-up suggestions
- Activity tracking

### 📊 Analytics Agent
- Cross-platform performance dashboard
- Competitor tracking
- Auto-generated reports
- Trend analysis

### 🔍 Research Agent
- Real-time trend radar
- KOL database and matching
- Market insights
- Competitor intelligence

### 📅 Campaign Agent
- Campaign builder
- Launch checklists
- Progress tracking
- Performance analysis

### 🛡️ Brand Safety Agent
- Content compliance review
- Sensitive date calendar
- Brand guidelines enforcement
- Prohibited word detection

## Project Status

**Current Progress**: Phase 2 (~20% complete)
**Last Updated**: 2026-01-01

See [PROGRESS.md](./PROGRESS.md) for detailed progress tracking and sprint goals.

## Mock Data Strategy

This demo uses mock data that mirrors real API structures. All data services are abstracted through a client layer that can be easily switched to real APIs:

```typescript
// Currently returns mock data
const data = await apiCall('/dashboard')

// Future: Switch to real API by changing environment variable
NEXT_PUBLIC_USE_MOCK=false
```

## Future Roadmap

### AI Integration
- Connect to real AI services (Qwen, GPT, Claude)
- Implement streaming responses
- Add prompt management

### Data Integration
- Connect to KAWO or other social media APIs
- Real-time data synchronization
- Live analytics

### Collaboration Features
- Multi-user permissions
- Approval workflows
- Team collaboration
- Activity logs

### Mobile App
- React Native implementation
- Push notifications
- Mobile-optimized workflows

## Design Language

The UI follows modern SaaS design principles with:
- Clean, minimal interface
- Indigo primary color (#6366F1)
- Platform-specific colors (小红书红, 抖音黑, etc.)
- Card-based layouts with subtle shadows
- Responsive design for all screen sizes

See [DESIGN.md](./DESIGN.md) for detailed design specifications.

## Documentation

- **[README.md](./README.md)** - Project overview, tech stack, and setup (this file)
- **[DESIGN.md](./DESIGN.md)** - Complete design system specifications
- **[PROGRESS.md](./PROGRESS.md)** - Development progress and sprint tracking

## Contributing

This is a demo project. For questions or feedback, please contact the Kevin Product Team.

## License

Proprietary - Kevin Product Team

---

**Version**: 1.0
**Last Updated**: 2026-01-01
**Status**: Demo Development
