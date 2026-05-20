import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        // Paleta oficial Baldecash
        brand: {
          blue: {
            100: '#D6DCED',
            200: '#98A9DF',
            300: '#6873D7',
            400: '#4453A0',
            500: '#31359C',
            600: '#212469',
            700: '#151744',
          },
          aqua: {
            100: '#E0F1F3',
            200: '#BEF7F3',
            300: '#A9DAE6',
            400: '#5CBFBE',
            500: '#36B7B3',
            600: '#00A29B',
            700: '#007974',
          },
          gold: {
            100: '#FFF7E6',
            200: '#FFEABB',
            300: '#FEDD90',
            400: '#FDCA56',
            500: '#D1A646',
            600: '#987933',
            700: '#4D3D1C',
          },
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand':
          'linear-gradient(135deg, #31359C 0%, #00A29B 50%, #FDCA56 100%)',
        'gradient-brand-soft':
          'linear-gradient(135deg, #4453A0 0%, #36B7B3 100%)',
        'gradient-card':
          'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 100%)',
        'gradient-card-dark':
          'linear-gradient(135deg, rgba(33,36,105,0.7) 0%, rgba(21,23,68,0.4) 100%)',
        'mesh-brand':
          'radial-gradient(at 20% 20%, rgba(49,53,156,0.25) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,162,155,0.18) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(253,202,86,0.12) 0px, transparent 50%)',
      },
      boxShadow: {
        // Glows fuertes para hover en cards destacadas
        glow: '0 0 0 1px rgba(49,53,156,0.10), 0 12px 40px -8px rgba(49,53,156,0.30)',
        'glow-aqua':
          '0 0 0 1px rgba(0,162,155,0.10), 0 12px 40px -8px rgba(0,162,155,0.28)',
        'glow-gold':
          '0 0 0 1px rgba(253,202,86,0.10), 0 12px 40px -8px rgba(253,202,86,0.25)',
        soft: '0 4px 30px rgba(0,0,0,0.06)',
        /* Sombras Stripe/Linear-style: capas + tinte azul brand sutil
           - hairline border (0 0 0 1px) muy suave
           - sombra cercana (1-2px)
           - sombra media (8-12px)
           - sombra ambiente (24-40px)
           Todo con tinte hsl(232 52% 14%) (foreground brand) en vez de negro puro */
        card:
          '0 0 0 1px rgba(31,41,82,0.05), 0 1px 2px rgba(31,41,82,0.04), 0 6px 16px -4px rgba(31,41,82,0.06), 0 16px 32px -12px rgba(31,41,82,0.05)',
        'card-hover':
          '0 0 0 1px rgba(49,53,156,0.10), 0 2px 4px rgba(31,41,82,0.05), 0 12px 24px -6px rgba(31,41,82,0.10), 0 24px 48px -12px rgba(31,41,82,0.10)',
        'card-elevated':
          '0 0 0 1px rgba(31,41,82,0.06), 0 4px 8px -2px rgba(31,41,82,0.06), 0 16px 32px -8px rgba(31,41,82,0.08), 0 24px 48px -12px rgba(31,41,82,0.10)',
        /* Glows brand sutiles permanentes (no solo hover) — para cards premium */
        'tint-blue':
          '0 0 0 1px rgba(49,53,156,0.08), 0 1px 2px rgba(31,41,82,0.04), 0 12px 32px -8px rgba(49,53,156,0.18)',
        'tint-aqua':
          '0 0 0 1px rgba(0,162,155,0.08), 0 1px 2px rgba(31,41,82,0.04), 0 12px 32px -8px rgba(0,162,155,0.18)',
        'tint-gold':
          '0 0 0 1px rgba(253,202,86,0.10), 0 1px 2px rgba(31,41,82,0.04), 0 12px 32px -8px rgba(253,202,86,0.20)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
