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
