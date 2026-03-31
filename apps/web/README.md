# Looper HQ - Web Application

The main web application for Looper HQ legal case management platform, built with Next.js 15, React 19, and TailwindCSS.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

From the root of the monorepo:

```bash
pnpm install
```

### Development

Start the development server:

```bash
# From root
pnpm dev:web

# Or from this directory
pnpm dev
```

The application will be available at [http://localhost:3005](http://localhost:3005).

### Building

Build the application for production:

```bash
pnpm build
```

### Running Production Build

```bash
pnpm start
```

## 📁 Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/       # Dashboard routes
│   │   ├── cases/         # Case management
│   │   ├── clients/       # Client management
│   │   └── search/        # Public case search
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── layout/            # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   ├── dashboard-layout.tsx
│   │   └── auth-layout.tsx
│   └── features/          # Feature-specific components
├── lib/
│   ├── utils.ts           # Utility functions
│   └── constants.ts       # App constants
├── styles/
│   └── globals.css        # Global styles with Tailwind
└── public/                # Static assets
```

## 🎨 UI Components

The application uses a custom component library inspired by shadcn/ui with the following components:

### Base Components
- **Button** - Multiple variants (default, outline, ghost, destructive)
- **Card** - For displaying content containers
- **Input** - Form inputs with validation states
- **Label** - Form labels
- **Badge** - Status and priority indicators
- **Table** - Data tables with sorting
- **Dialog** - Modal dialogs
- **Dropdown Menu** - Context menus
- **Tabs** - Tabbed interfaces

### Layout Components
- **Header** - Main navigation header
- **Sidebar** - Dashboard navigation sidebar
- **Footer** - Page footer
- **DashboardLayout** - Layout wrapper for dashboard pages
- **AuthLayout** - Layout wrapper for authentication pages

## 🎯 Features

- ✅ Next.js 15 with App Router
- ✅ React 19
- ✅ TypeScript with strict mode
- ✅ TailwindCSS with custom theme
- ✅ Dark mode support (class-based)
- ✅ Responsive design (mobile-first)
- ✅ Professional legal theme
- ✅ Hong Kong timezone support
- ✅ Component variants with class-variance-authority

## 🔧 Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local` and update the values:

```bash
cp .env.local.example .env.local
```

Key variables:
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_API_URL` - API endpoint
- `NEXTAUTH_URL` - NextAuth URL (for future auth integration)
- `NEXTAUTH_SECRET` - NextAuth secret
- `DATABASE_URL` - Database connection string

### Tailwind Configuration

The Tailwind configuration (`tailwind.config.ts`) includes:
- Custom color palette for legal/professional theme
- Dark mode support
- Custom utility classes for case statuses
- Responsive breakpoints
- Typography settings

## 📚 Component Usage Examples

### Button

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

### Badge (Case Status)

```tsx
import { Badge } from "@/components/ui/badge"

<Badge className="case-status-open">Open</Badge>
<Badge className="case-status-in-progress">In Progress</Badge>
<Badge className="case-status-closed">Closed</Badge>
```

## 🌐 Routes

- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Dashboard overview
- `/dashboard/cases` - Case management
- `/dashboard/clients` - Client management
- `/dashboard/search` - Public case search

## 🛠️ Development Scripts

```bash
# Development server
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🎨 Design System

### Colors

The application uses a professional legal theme with:
- Primary: Blue tones for trust and professionalism
- Secondary: Gray tones for balance
- Status colors: 
  - Open: Blue
  - In Progress: Amber
  - Closed: Green
  - Archived: Gray

### Typography

- Font: Inter (Google Fonts)
- Headings: Bold, tracking tight
- Body: Regular weight

### Spacing

Following Tailwind's spacing scale (4px base unit)

## 🌍 Internationalization

The application is prepared for i18n support with:
- English (default)
- Traditional Chinese (繁體中文) - Coming in Phase 3

## 📝 Notes

- Authentication will be integrated with NextAuth.js and Keycloak in Phase 3
- Real data integration with backend services coming in future phases
- This is a frontend-only setup with placeholder/mock data

## 🤝 Contributing

When adding new features:
1. Follow the existing component structure
2. Use TypeScript strict mode
3. Maintain responsive design
4. Test in both light and dark modes
5. Ensure Hong Kong legal context is considered

## 📄 License

MIT License - See LICENSE file in the root directory
