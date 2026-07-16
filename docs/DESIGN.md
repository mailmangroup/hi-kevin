# Kevin Design System

Modern, clean design language for the Kevin AI Marketing Co-pilot platform.

## Design Principles

### 1. Aura & Light
The interface uses a "Light Mode Aura" aesthetic. It replaces flat white backgrounds with an active, breathing canvas using soft gradient orbs and glassmorphism.

### 2. Clarity Over Complexity
Every element serves a purpose. Information hierarchy guides users naturally through tasks without overwhelming them.

### 3. AI-Augmented Interaction
AI-generated content is clearly marked with visual cues (✨ sparkle icon, gradient backgrounds) to build trust and understanding.

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

### Aura Palette (Backgrounds)

```css
Background
--background: #F8F9FC        /* Off-white, not pure white */

Aura Orbs
--orb-1: Pale Violet (Purple-300)
--orb-2: Sky Blue (Sky-300)
--orb-3: Soft Peach (Orange-300)
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

Warning
--warning: #F59E0B

Error
--error: #EF4444

Info
--info: #3B82F6
```

### Priority Indicators (Glass Tinted)

```css
--priority-high: rgba(239, 68, 68, 0.1)     /* Red Tint */
--priority-medium: rgba(245, 158, 11, 0.1)   /* Amber Tint */
--priority-low: rgba(16, 185, 129, 0.1)      /* Green Tint */
```

### Neutral Palette

```css
--foreground: #111827        /* Primary text - Dark Navy/Charcoal */
--muted-foreground: #64748B  /* Secondary text - Cool Grey */
--border: rgba(255, 255, 255, 0.5) /* Translucent white border */
```

---

## Typography

### Font Stack

```css
font-family: "Onest", "PingFang SC", "Microsoft YaHei", sans-serif;
```

Onest for English text, with PingFang SC and Microsoft YaHei fallbacks for Chinese characters.

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

4px base grid system.

---

## Border Radius

### Standard Border Radius

```css
--radius-sm: 4px    /* Small interactive elements */
--radius-md: 8px    /* Buttons, inputs, badges, tabs, dropdowns */
--radius-lg: 12px   /* Cards, dialogs, larger containers */
--radius-full: 9999px /* Pills, avatars, full-rounded elements */
```

### Component Specifications

| Component | Border Radius |
|-----------|---------------|
| Buttons | `8px` (`rounded-[8px]`) |
| Inputs | `8px` (`rounded-[8px]`) |
| Badges/Tags | `8px` (`rounded-[8px]`) |
| Tabs | `8px` (`rounded-[8px]`) |
| Dropdown Items | `8px` (`rounded-[8px]`) |
| Tooltips | `8px` (`rounded-[8px]`) |
| Dialog/Sheet | `8px` (`rounded-lg`) |
| Cards | `12px` (via Tailwind `rounded-xl`) |

---

## Component Specifications

### Glass Layers (Cards & Containers)

**Glass Recipe**
- Fill: `bg-white/70` (White with 70% opacity)
- Blur: `backdrop-filter: blur(20px)`
- Border: `1px solid rgba(255,255,255, 0.5)`
- Shadow: `0 10px 40px -10px rgba(0,0,0,0.05)`

**Hover State (Interactive Cards)**
- Lift: `transform: translateY(-2px)`
- Shadow: Increased intensity
- Transition: all 300ms ease

### Sidebar
- Style: Frosted pane on the left
- Border: No hard right border
- Active State: "Glow Pill" on the left + soft gradient background

### Buttons

**Primary Button**
- Background: Gradient or Solid Primary
- Shadow: Subtle shadow
- Border: None

**Secondary/Outline Button**
- Background: Gradient (White to Off-white)
- Border: Translucent white (`border-white/50`)
- Hover: Shadow increase

### Inputs (Search / Think)
- Style: Deep / Recessed
- Shadow: Inner shadow (`inset 0 2px 4px rgba(0,0,0,0.05)`)
- Focus: Glow ring (colored shadow) instead of hard outline

### Badges / Tags
- Style: Tinted Glass
- Background: Transparent with color tint (e.g., `bg-red-500/10`)
- Border: Translucent colored border (e.g., `border-red-500/20`)
- Text: Colored text

---

## Dark Mode

### Color System

Dark mode uses a slate-based palette with the following key values:

```css
/* Background */
--background: hsl(222.2 84% 4.9%)     /* Near-black slate */
--foreground: hsl(210 40% 98%)        /* Off-white text */

/* Cards & Surfaces */
--card: hsl(222.2 84% 4.9%)
--card-foreground: hsl(210 40% 98%)
--border: hsl(217.2 32.6% 17.5%)     /* slate-700 */
--input: hsl(217.2 32.6% 17.5%)

/* Primary */
--primary: hsl(239 84% 67%)           /* Indigo - same as light mode */
--primary-foreground: hsl(0 0% 98%)

/* Muted */
--muted: hsl(217.2 32.6% 17.5%)
--muted-foreground: hsl(215 20.2% 65.1%)  /* slate-400 equivalent */
```

### Glass Utilities

The following CSS utilities support dark mode via `.dark` selector:

```css
.glass              /* bg-white/70, border-white/80 */
.dark .glass        /* bg-slate-900/70, border-slate-700/80 */

.glass-card         /* Cards with hover effects */
.dark .glass-card   /* bg-slate-900/70, border-slate-700/80 */

.glass-premium      /* Premium UI elements */
.dark .glass-premium /* Dark translucent surface */

.glass-input        /* Input backgrounds */
.dark .glass-input  /* bg-slate-900/70, border-slate-700 */
```

### Component Dark Mode Patterns

**Text Colors**
- Primary text: `text-slate-900 dark:text-slate-100`
- Secondary text: `text-slate-500 dark:text-slate-400`
- Muted text: `text-slate-400 dark:text-slate-500`

**Backgrounds**
- Cards: `bg-white/70 dark:bg-slate-800/70`
- Borders: `border-slate-200 dark:border-slate-700`
- Hover states: `hover:bg-slate-50 dark:hover:bg-slate-700/50`

**Colored Badges/Spans**
Use dark variants with opacity:
- `bg-emerald-50 dark:bg-emerald-900/30`
- `text-emerald-600 dark:text-emerald-400`

### Implementation Rules

1. Always pair light/dark classes: `text-slate-900 dark:text-slate-100`
2. Use CSS utility `.dark .glass-*` classes for glassmorphism elements
3. For colored backgrounds, add dark variants with `/30` or `/40` opacity
4. Border colors: replace `slate-100` with `slate-700`, `slate-200` with `slate-600`
5. Avoid hardcoded white backgrounds in components - use `bg-white/70 dark:bg-slate-800/70`
