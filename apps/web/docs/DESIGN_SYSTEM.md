# Premier Design System Documentation

## 👑 Black Veil Empress Aesthetic

A luxury design system for Looper HQ that radiates sophistication and exclusivity.

---

## Color Palette

### Deep Blacks
- `premier-black` (#0a0a0a) - Primary background
- `premier-black-light` (#1a1a1a) - Card backgrounds
- `premier-black-medium` (#0f0f0f) - Subtle variations

### Luxurious Golds
- `premier-gold` (#D4AF37) - Royal gold, primary accent
- `premier-gold-rose` (#B8860B) - Rose gold
- `premier-gold-champagne` (#F7E7CE) - Champagne
- `premier-gold-dark` (#9A7B2F) - Dark gold

### Mysterious Accents
- `premier-mystery-violet` (#4A148C) - Deep violet
- `premier-mystery-purple` (#6A1B9A) - Royal purple
- `premier-mystery-blue` (#1A237E) - Midnight blue
- `premier-mystery-indigo` (#283593) - Deep indigo

### Elegant Neutrals
- `premier-pearl` (#F5F5F5) - Pearl white
- `premier-pearl-gray` (#C0C0C0) - Silver gray
- `premier-pearl-cream` (#FAFAF8) - Cream

---

## Components

### GlassCard
Glassmorphism card with backdrop blur and gold accents.

**Variants:**
- `default` - Standard glass effect
- `gold` - Gold gradient accent
- `mystery` - Purple/violet gradient
- `frosted` - Frosted glass effect

**Usage:**
```tsx
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'

<GlassCard variant="gold" glow>
  <GlassCardHeader>
    <GlassCardTitle>Title</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    Content here
  </GlassCardContent>
</GlassCard>
```

### StatCard
Dashboard statistics card with animated counters and trend indicators.

**Usage:**
```tsx
import { StatCard } from '@/components/ui/stat-card'
import { Briefcase } from 'lucide-react'

<StatCard
  title="Total Cases"
  value={42}
  change={{ value: 12, trend: 'up', label: 'from last month' }}
  icon={Briefcase}
/>
```

### PremierButton
Luxury action button with multiple variants.

**Variants:**
- `primary` - Gold gradient with glow
- `secondary` - Glass with gold border
- `ghost` - Transparent with gold text
- `outline` - Gold border with hover fill
- `mystery` - Purple gradient

**Usage:**
```tsx
import { PremierButton } from '@/components/ui/premier-button'
import { Plus } from 'lucide-react'

<PremierButton variant="primary" icon={Plus}>
  New Case
</PremierButton>
```

### ProgressRing
Circular progress chart for visualizing distributions.

**Usage:**
```tsx
import { ProgressRing } from '@/components/ui/progress-ring'

<ProgressRing
  segments={[
    { label: 'Active', value: 15, color: '#D4AF37' },
    { label: 'Pending', value: 8, color: '#4A148C' },
  ]}
/>
```

### ActivityTimeline
Recent activity feed with avatars and timestamps.

**Usage:**
```tsx
import { ActivityTimeline } from '@/components/ui/activity-timeline'

<ActivityTimeline
  activities={[
    {
      id: '1',
      user: { name: 'John Doe', initials: 'JD' },
      action: 'created',
      description: 'New case filed',
      timestamp: new Date(),
    }
  ]}
/>
```

### ParticleBackground
Ambient floating particles effect.

**Usage:**
```tsx
import { ParticleBackground } from '@/components/effects/particle-background'

<ParticleBackground particleCount={30} />
```

### GradientBorder
Animated rotating gradient border.

**Usage:**
```tsx
import { GradientBorder } from '@/components/effects/gradient-border'

<GradientBorder speed={3} glowIntensity="medium">
  <div className="p-6">Content</div>
</GradientBorder>
```

---

## Shadows

- `shadow-premier-xs` - Subtle elevation
- `shadow-premier-sm` - Small elevation
- `shadow-premier-md` - Medium elevation with glow
- `shadow-premier-lg` - Large elevation with glow
- `shadow-premier-xl` - Extra large elevation
- `shadow-premier-2xl` - Dramatic elevation
- `shadow-premier-glow` - Glowing effect
- `shadow-premier-glow-lg` - Large glow
- `shadow-premier-inner` - Inner glow for glass

---

## Border Radius

- `rounded-premier-sm` - 8px
- `rounded-premier-md` - 12px
- `rounded-premier-lg` - 16px
- `rounded-premier-xl` - 20px
- `rounded-premier-2xl` - 24px

---

## Typography

### Font Families
- **Sans:** Inter, Noto Sans TC
- **Serif:** Playfair Display, Noto Serif TC (for headings)
- **Mono:** JetBrains Mono

### Sizes
- `text-display-1` - 4.5rem (72px)
- `text-display-2` - 3.5rem (56px)
- `text-premier-xl` - 2rem (32px)
- `text-premier-lg` - 1.5rem (24px)
- `text-premier-md` - 1.125rem (18px)

### Gradients
- `text-gradient-gold` - Gold gradient text
- `text-gradient-mystery` - Purple gradient text

---

## Animations

### Framer Motion Presets

Import from `@/lib/animations`:

- `pageVariants` - Page transitions
- `containerVariants` - Stagger children
- `itemVariants` - Individual items
- `cardHoverVariants` - Card hover effects
- `buttonHoverVariants` - Button interactions

**Example:**
```tsx
import { motion } from 'framer-motion'
import { pageVariants, pageTransition } from '@/lib/animations'

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={pageTransition}
>
  Content
</motion.div>
```

---

## CSS Utilities

### Glassmorphism Classes

- `.glass-card` - Standard glass effect
- `.glass-gold` - Gold gradient glass
- `.glass-mystery` - Purple gradient glass
- `.glass-frosted` - Frosted glass

---

## Design Principles

1. **Exclusivity** - Every element should feel premium
2. **Authority** - Inspire confidence and trust
3. **Mystery** - Subtle, not obvious
4. **Sophistication** - Refined and elegant
5. **Elegance** - Graceful animations and transitions

---

## Performance Best Practices

1. Use `backdrop-filter` sparingly (GPU intensive)
2. Limit particles to 30-50 for smooth 60fps
3. Use `will-change` CSS property for animated elements
4. Optimize images and use WebP format
5. Lazy load non-critical components

---

## Accessibility

- All interactive elements have proper focus states
- Color contrasts meet WCAG AA standards
- Animations respect `prefers-reduced-motion`
- All components support keyboard navigation
- Proper ARIA labels on all interactive elements

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with backdrop-filter support

---

## Inspiration

Visual references:
- Luxury automotive dashboards (Rolls-Royce, Bentley)
- Premium financial platforms (Goldman Sachs, BlackRock)
- High-end hospitality systems
- Exclusive membership clubs

---

*Premier Design System v1.0 - Crafted for distinguished legal professionals*
