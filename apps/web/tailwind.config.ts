import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Legal/Professional theme colors (maintained for compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Case status colors
        status: {
          open: "#3b82f6",
          "in-progress": "#f59e0b",
          closed: "#10b981",
          archived: "#6b7280",
        },
        // Premier Design System - "Black Veil Empress" Palette
        premier: {
          // Deep blacks with subtle gradients
          black: {
            DEFAULT: '#0a0a0a',
            light: '#1a1a1a',
            medium: '#0f0f0f',
          },
          // Luxurious golds
          gold: {
            DEFAULT: '#D4AF37',    // Royal gold
            rose: '#B8860B',       // Rose gold
            champagne: '#F7E7CE',  // Champagne
            dark: '#9A7B2F',       // Dark gold
          },
          // Mysterious accents
          mystery: {
            violet: '#4A148C',     // Deep violet
            purple: '#6A1B9A',     // Royal purple
            blue: '#1A237E',       // Midnight blue
            indigo: '#283593',     // Deep indigo
          },
          // Elegant neutrals
          pearl: {
            DEFAULT: '#F5F5F5',    // Pearl white
            gray: '#C0C0C0',       // Silver gray
            cream: '#FAFAF8',      // Cream
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Premier border radius - larger, more elegant
        'premier-sm': '8px',
        'premier-md': '12px',
        'premier-lg': '16px',
        'premier-xl': '20px',
        'premier-2xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Noto Serif TC', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Display sizes
        'display-1': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-2': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        // Elegant hierarchy
        'premier-xl': ['2rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'premier-lg': ['1.5rem', { lineHeight: '1.4' }],
        'premier-md': ['1.125rem', { lineHeight: '1.6' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'premier-dark': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        'premier-gold': 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
        'premier-mystery': 'linear-gradient(135deg, #4A148C 0%, #1A237E 100%)',
        'premier-veil': 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.05) 0%, transparent 70%)',
      },
      boxShadow: {
        // Subtle elevation
        'premier-xs': '0 1px 4px rgba(212,175,55,0.04)',
        'premier-sm': '0 2px 8px rgba(212,175,55,0.06)',
        // Medium elevation with glow
        'premier-md': '0 4px 16px rgba(212,175,55,0.08), 0 2px 8px rgba(212,175,55,0.05)',
        'premier-lg': '0 8px 32px rgba(212,175,55,0.1), 0 4px 16px rgba(212,175,55,0.08)',
        // Dramatic elevation
        'premier-xl': '0 12px 48px rgba(212,175,55,0.12), 0 8px 24px rgba(212,175,55,0.09)',
        'premier-2xl': '0 24px 64px rgba(212,175,55,0.15), 0 12px 32px rgba(212,175,55,0.1)',
        // Glowing effects
        'premier-glow': '0 0 20px rgba(212,175,55,0.15), 0 0 40px rgba(212,175,55,0.08)',
        'premier-glow-lg': '0 0 30px rgba(212,175,55,0.2), 0 0 60px rgba(212,175,55,0.1)',
        // Inner glow for glass effect
        'premier-inner': 'inset 0 1px 2px rgba(255,255,255,0.1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: 'shimmer 2s infinite',
        'gradient-rotate': 'gradient-rotate 3s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
