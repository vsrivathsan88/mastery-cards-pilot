# Simili Design System

## Overview

Simili uses a **neobrutalist/clean design system** that creates a warm, kid-friendly, and accessible learning environment. The design emphasizes clarity, playfulness, and reduced cognitive load through bold shapes, thick borders, and warm colors.

---

## Core Principles

1. **Thick Borders & Offset Shadows** - Clear visual boundaries that feel solid and tactile
2. **Warm Color Palette** - Inviting colors that create a cozy atmosphere
3. **High Contrast** - Excellent readability for young learners
4. **Rounded Corners** - Friendly, approachable shapes
5. **Bold Typography** - Clear, readable text with strong weight

---

## Color Palette

### Primary Colors

```css
--bg-primary: #F5F1E8;      /* Warm cream background */
--bg-card: #FFFFFF;          /* Pure white for cards */
--border-primary: #1A1D2E;   /* Dark blue-black borders */
--accent-primary: #FFB84D;   /* Warm orange/yellow */
--text-primary: #1A1D2E;     /* Dark text */
--text-secondary: #6B6560;   /* Muted brown-gray */
```

### Semantic Colors

```css
--success: #7DCCB8;  /* Mint green for positive feedback */
--danger: #FF6B6B;   /* Coral red for alerts */
--warning: #FFB84D;  /* Warm orange for cautions */
```

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Rounded", system-ui, sans-serif;
```

### Weights
- **800** - Headings and primary buttons
- **700** - Subheadings and labels
- **600** - Body text and secondary buttons
- **500** - Captions and hints

### Letter Spacing
- Headings: `-0.02em` (tight for readability)
- Body: `-0.01em` (slightly condensed)
- Labels: `0.3px - 0.5px` (expanded for clarity)

---

## Borders & Shadows

### Border Widths
```css
--border-width-thin: 3px;
--border-width-thick: 4px;
```

### Border Radius
```css
--border-radius-sm: 12px;
--border-radius-md: 16px;
--border-radius-lg: 24px;
```

### Offset Shadows
```css
--shadow-sm: 4px 4px 0;
--shadow-md: 6px 6px 0;
--shadow-lg: 8px 8px 0;
--shadow-xl: 10px 10px 0;
```

All shadows use `var(--border-primary)` for consistent color.

---

## Components

### Buttons

**Primary Button**
```css
.clean-button-primary {
  padding: 12px 28px;
  font-size: 16px;
  font-weight: 800;
  background: var(--accent-primary);
  color: var(--text-primary);
  border: var(--border-width-thick) solid var(--border-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm) var(--border-primary);
}

.clean-button-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md) var(--border-primary);
}

.clean-button-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--border-primary);
}
```

**Secondary Button**
```css
.clean-button {
  background: var(--bg-card);
  /* Same structure as primary */
}
```

### Cards

```css
.clean-card {
  background: var(--bg-card);
  border: var(--border-width-thick) solid var(--border-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg) var(--border-primary);
  transition: all 0.2s ease;
}

.clean-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-xl) var(--border-primary);
}
```

### Badges

```css
.clean-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--border-radius-sm);
  border: var(--border-width-thin) solid var(--border-primary);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.3px;
  box-shadow: var(--shadow-sm) var(--border-primary);
}
```

### Input Fields

```css
.clean-input {
  width: 100%;
  padding: 14px 18px;
  font-size: 16px;
  border: var(--border-width-thin) solid var(--border-primary);
  border-radius: var(--border-radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-weight: 600;
}

.clean-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-primary);
}
```

### Avatars

```css
.clean-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: var(--border-width-thick) solid var(--border-primary);
  overflow: hidden;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm) var(--border-primary);
}

.clean-avatar.speaking {
  animation: speakPulse 0.6s ease-in-out infinite;
}

@keyframes speakPulse {
  0%, 100% {
    box-shadow: var(--shadow-sm) var(--border-primary);
  }
  50% {
    box-shadow: 0 0 0 4px var(--accent-primary), var(--shadow-sm) var(--border-primary);
  }
}
```

---

## Layout Components

### Workspace

```css
.clean-workspace {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: var(--bg-primary);
  padding: 0 16px 16px 16px;
  gap: 12px;
  overflow: hidden;
}
```

### Panels with Headers

```css
.clean-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: hidden;
}

.clean-panel-content {
  flex: 1;
  background: var(--bg-card);
  border: var(--border-width-thick) solid var(--border-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md) var(--border-primary);
}
```

---

## Interactive States

### Hover Effects

All interactive elements should:
- Translate upward/leftward: `translate(-2px, -2px)`
- Increase shadow depth
- Smooth transition: `transition: all 0.2s ease`

### Active/Pressed States

All clickable elements should:
- Translate downward/rightward: `translate(2px, 2px)`
- Reduce shadow to `2px 2px 0`
- Create tactile "press" feeling

### Focus States

Interactive elements should show clear focus:
- Outline: `box-shadow: 0 0 0 3px var(--accent-primary)`
- Never use default browser outline

---

## Animations

### Celebration Particles

**Star Burst** (for milestone completions)
```css
.cozy-encouragement-particle {
  font-size: 48px;
  animation: starBurst 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
}

@keyframes starBurst {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(0deg);
  }
  10% {
    opacity: 1;
    transform: scale(1.2) rotate(45deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.5) rotate(360deg) translateY(-100px);
  }
}
```

**Micro Sparkle** (for good attempts)
```css
.cozy-micro-particle {
  font-size: 28px;
  animation: microSparkle 2s ease-out forwards;
}

@keyframes microSparkle {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(0);
  }
  20% {
    opacity: 0.8;
    transform: scale(1) translateY(-10px);
  }
  100% {
    opacity: 0;
    transform: scale(0.7) translateY(-50px);
  }
}
```

---

## Accessibility

### Contrast Ratios
- Body text: **7.2:1** (AAA)
- Large text: **4.8:1** (AAA)
- Interactive elements: **4.5:1** minimum (AA)

### Touch Targets
- Minimum: **44x44px** (WCAG AAA)
- Preferred: **48x48px**
- Spacing: **8px minimum** between interactive elements

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Clear focus indicators required
- Logical tab order

### Screen Readers
- Semantic HTML structure
- ARIA labels where needed
- Descriptive button text (avoid "click here")

---

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  /* Reduce padding and gaps */
  /* Stack grid layouts vertically */
  /* Smaller font sizes */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Balanced layout */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full grid layouts */
  /* Maximum content width: 1400px */
}
```

---

## Design Tokens Reference

### Spacing Scale
```
4px   - Tiny gaps between inline elements
8px   - Small gaps (badges, small cards)
12px  - Default gap (buttons, cards)
16px  - Medium gap (sections)
20px  - Large gap (major sections)
24px  - Extra large gap (page sections)
```

### Font Sizes
```
10px  - Tiny labels (uppercase)
11px  - Small captions
12px  - Body small
13px  - Body default
14px  - Body large
15px  - Subheadings
16px  - Headings small
18px  - Headings default
20px  - Headings large
24px  - Major headings
```

---

## Implementation Files

- **Core**: `/apps/tutor-app/styles/cozy-theme.css`
- **Onboarding**: `/apps/tutor-app/styles/onboarding.css`
- **Teacher Panel**: `/apps/tutor-app/components/teacher-panel/TeacherPanel.css`

---

## Usage Guidelines

### DO ✅
- Use design system classes (`.clean-*`)
- Apply consistent spacing from the scale
- Use semantic color variables
- Add hover and active states to all interactive elements
- Test on mobile and desktop

### DON'T ❌
- Use inline styles for design system properties
- Mix design systems (no Material Design or Bootstrap)
- Use thin borders (less than 3px)
- Use box-shadow blur (use offset shadows only)
- Forget accessibility requirements

---

## Future Enhancements

- [ ] Dark mode support
- [ ] Additional semantic colors for edge cases
- [ ] Animation library for common transitions
- [ ] Component library (Storybook)
- [ ] Design tokens as JSON for cross-platform use
