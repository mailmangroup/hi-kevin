# Kevin Design System

Modern, clean design language for the Kevin AI Marketing Co-pilot platform.

## Design Principles

### 1. Clarity Over Complexity
Every element serves a purpose. Information hierarchy guides users naturally through tasks without overwhelming them.

### 2. AI-Augmented Interaction
AI-generated content is clearly marked with visual cues (✨ sparkle icon, gradient backgrounds) to build trust and understanding.

### 3. Platform Identity
Each Chinese social media platform has distinct visual identity through color coding while maintaining overall brand consistency.

### 4. Responsive Intelligence
Interface adapts seamlessly across devices, with mobile-first considerations for key workflows.

---

## Color System

### Brand Colors

```css
Primary (Indigo/Blue)
--primary: #6366F1           /* Main brand color */
--primary-hover: #5558E3     /* Interactive states */
--primary-light: #EEF2FF     /* Light backgrounds */
--primary-50: #F5F7FF        /* Subtle backgrounds */
```

### Platform Colors

```css
--xiaohongshu: #FF2442       /* 小红书 Red */
--douyin: #000000            /* 抖音 Black */
--weibo: #E6162D             /* 微博 Red */
--wechat: #07C160            /* 微信 Green */
```

### Semantic Colors

```css
Success
--success: #10B981
--success-light: #D1FAE5
--success-dark: #047857

Warning
--warning: #F59E0B
--warning-light: #FEF3C7
--warning-dark: #D97706

Error
--error: #EF4444
--error-light: #FEE2E2
--error-dark: #DC2626

Info
--info: #3B82F6
--info-light: #DBEAFE
--info-dark: #1D4ED8
```

### Priority Indicators

```css
--priority-high: #EF4444     /* Red - Urgent */
--priority-medium: #F59E0B   /* Amber - Important */
--priority-low: #10B981      /* Green - Low priority */
```

### Neutral Palette

```css
--background: #FAFBFC        /* Main background - very light gray */
--surface: #FFFFFF           /* Card/panel backgrounds */
--foreground: #1A1A1A        /* Primary text */
--muted: #6B7280            /* Secondary text */
--muted-foreground: #9CA3AF /* Tertiary text */
--border: #E8EAED           /* Borders - subtle gray */
--border-light: #F3F4F6     /* Lighter borders */
```

---

## Typography

### Font Stack

```css
font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
```

Inter for English text, with PingFang SC and Microsoft YaHei fallbacks for Chinese characters.

### Type Scale

```css
/* Display */
--text-4xl: 36px / 40px, weight: 700
--text-3xl: 30px / 36px, weight: 700

/* Headings */
--text-2xl: 24px / 32px, weight: 600
--text-xl: 20px / 28px, weight: 600
--text-lg: 18px / 28px, weight: 600

/* Body */
--text-base: 16px / 24px, weight: 400
--text-sm: 14px / 20px, weight: 400
--text-xs: 12px / 16px, weight: 400

/* Labels */
--text-label: 14px / 20px, weight: 500
```

---

## Spacing System

4px base grid system:

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
```

---

## Component Specifications

### Cards

**Default Card**
- Border radius: 12px (more rounded)
- Shadow: `0 1px 2px rgba(0, 0, 0, 0.05)` (very subtle)
- Padding: 20px
- Background: white (#FFFFFF)
- Border: 1px solid --border
- Transition: all 200ms ease

**Hover State**
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.08)`
- Transform: translateY(-2px)
- Transition: all 200ms ease

**Stats Card**
- Min height: 140px
- Padding: 24px
- Border radius: 12px
- Icon container: 40px circle with subtle background
- Number size: 32px (--text-3xl), weight: 700
- Label size: 14px (--text-sm), color: --muted
- Description: 13px, color: --muted-foreground
- Background: pure white with subtle shadow

### Buttons

**Primary Button**
- Height: 40px (sm: 36px, lg: 44px)
- Padding: 0 20px
- Border radius: 8px (more rounded)
- Background: --primary (#6366F1)
- Text: white, 14px, weight: 500
- Shadow: none by default
- Hover: --primary-hover + subtle shadow
- Active: slight scale down (0.98)

**Secondary Button (Outline)**
- Border: 1px solid --border
- Background: white
- Text: --foreground
- Border radius: 8px
- Hover: light gray background

**Ghost Button**
- No border, no background
- Text: --muted-foreground
- Border radius: 8px
- Hover: --background (light gray)

**Icon Button**
- Size: 40px square
- Border radius: 8px
- Center-aligned icon (20px)
- Hover: light background

### Inputs

**Text Input**
- Height: 36px
- Padding: 0 12px
- Border: 1px solid --border
- Border radius: 6px
- Focus: 2px ring --primary

**Select**
- Same as text input
- Chevron icon right-aligned

**Textarea**
- Min height: 80px
- Padding: 12px

### Badges

**Status Badge**
- Height: 24px
- Padding: 0 10px
- Border radius: 6px (pill-shaped)
- Font size: 11px
- Weight: 600
- Letter spacing: 0.3px

Colors by type:
- HIGH: #EF4444 background, white text
- MED: #F59E0B background, white text
- LOW: #10B981 background, white text
- Draft: #F3F4F6 background, #6B7280 text
- Scheduled: #D1FAE5 background, #047857 text

**Priority Badge (Pill Style)**
- Compact rounded pill
- Bold, uppercase text
- High contrast colors
- 6px border radius

### Navigation

**Sidebar**
- Width: 240px (expanded), 64px (collapsed)
- Background: --surface
- Border right: 1px solid --border

**Nav Item**
- Height: 40px
- Padding: 0 12px
- Border radius: 6px
- Icon: 20px
- Active state: --primary-light background

**Badge Counter**
- Size: 20px circle
- Background: --error
- Text: white, 12px
- Position: top-right of icon

### AI-Generated Content

**AI Response Container**
- Background: linear-gradient(to-br, from-primary-50 to-primary-100)
- Border: 2px dashed --primary-light
- Border radius: 8px
- Padding: 16px
- Sparkle icon (✨) in top-left

**Loading State**
- Pulsing animation
- "Kevin is thinking..." text
- Animated dots

**Action Buttons**
- [👍] [👎] reaction buttons
- [Regenerate] [Edit] [Apply] action buttons
- Inline, right-aligned

---

## Layout Patterns

### Dashboard Grid

```
┌─────────────────────────────────────────────┐
│ Header (64px fixed)                         │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Main Content Area               │
│ (240px)  │  (fluid, max-width: 1400px)      │
│          │                                  │
│          │  - 24px padding                  │
│          │  - 24px gap between sections     │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### Content Calendar

Grid layout:
- 7 columns (days of week)
- Auto height rows
- 8px gap between cells
- Each cell: min 120px height

### Pipeline Board (Leads)

Kanban layout:
- Columns: flexible width, min 280px
- Gap: 16px
- Cards: full width of column
- Drag & drop enabled

---

## Interactive States

### Hover
- Cursor: pointer
- Scale: 1.01 (for cards)
- Shadow increase
- Transition: 150ms ease

### Active/Press
- Scale: 0.98
- Shadow decrease
- Transition: 100ms ease

### Focus
- Outline: 2px ring --primary
- Offset: 2px

### Disabled
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects

---

## Animations & Transitions

### Standard Transitions
```css
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Loading Spinner
- Size: 20px (sm), 32px (md), 48px (lg)
- Color: --primary
- Animation: smooth rotation

### Skeleton Loader
- Background: linear gradient animation
- Shimmer effect
- Matches content shape

### Toast Notifications
- Slide in from top-right
- Duration: 3s (success), 5s (error)
- Dismiss on click or timer

---

## Iconography

### Icon Library
Using [Lucide Icons](https://lucide.dev/) for consistency.

### Icon Sizes
- sm: 16px
- md: 20px
- lg: 24px
- xl: 32px

### Platform Icons
Custom SVG icons for:
- 小红书 logo
- 抖音 logo
- 微博 logo
- 微信 logo

---

## Data Visualization

### Charts (Recharts)

**Line Chart**
- Stroke width: 2px
- Grid: dashed, --border color
- Tooltip: white card with shadow
- Colors: platform colors or --primary

**Bar Chart**
- Border radius: 4px top
- Gap: 8px
- Hover: increased opacity

**Donut Chart**
- Thickness: 24px
- Inner radius: 60%
- Segment colors: semantic or platform colors

---

## Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile Adaptations

**Sidebar**
- Hidden by default
- Slide-over drawer when opened
- Backdrop overlay

**Tables**
- Stack vertically
- Show critical columns only
- Horizontal scroll for full data

**Cards Grid**
- 1 column on mobile
- 2 columns on tablet
- 3-4 columns on desktop

---

## Accessibility

### Contrast Ratios
- Body text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: clear focus indicators

### Keyboard Navigation
- Tab order follows visual flow
- Enter/Space activates buttons
- Escape closes modals/dropdowns
- Arrow keys in lists/menus

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Status announcements for dynamic content
- Skip navigation links

---

## Dark Mode

(Future consideration - not implemented in demo)

```css
--background: #111827
--surface: #1F2937
--foreground: #F9FAFB
--muted: #9CA3AF
--border: #374151
```

---

## Example Compositions

### Dashboard Header
```
┌────────────────────────────────────────────────┐
│ Good morning, Jeremy 👋          🔔  👤       │
│ Here's what needs your attention today         │
└────────────────────────────────────────────────┘
```
- Greeting: --text-2xl, --foreground
- Subtext: --text-sm, --muted-foreground
- Icons: 24px, --muted-foreground

### Suggestion Card
```
┌────────────────────────────────────────────────┐
│ 🔴 HIGH  Review Xiaohongshu post draft         │
│         Generated 2 hours ago        [Review]  │
└────────────────────────────────────────────────┘
```
- Priority dot: 8px
- Title: --text-base, weight: 500
- Meta: --text-sm, --muted-foreground
- Button: secondary style

### Metric Display
```
┌──────────────┐
│ Total Reach  │
│   125.6K     │
│   ↑ 12%      │
└──────────────┘
```
- Label: --text-sm, --muted-foreground
- Value: --text-2xl, weight: 700
- Change: --text-xs, color-coded

---

**Version**: 1.0
**Last Updated**: 2025-01-20
**Design Team**: Kevin Product
