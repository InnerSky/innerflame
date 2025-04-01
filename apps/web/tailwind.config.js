/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  safelist: [
    // Grays / Neutrals
    'bg-slate-50',
    'bg-slate-100',
    'bg-gray-50',
    'bg-gray-100',
    'bg-zinc-50',
    'bg-zinc-100',
    'bg-neutral-50',
    'bg-neutral-100',
    'bg-stone-50',
    'bg-stone-100',

    // Reds
    'bg-red-50',
    'bg-red-100',

    // Oranges
    'bg-orange-50',
    'bg-orange-100',

    // Ambers / Yellows
    'bg-amber-50',
    'bg-amber-100',
    'bg-yellow-50',
    'bg-yellow-100',

    // Limes / Greens
    'bg-lime-50',
    'bg-lime-100',
    'bg-green-50',
    'bg-green-100',
    'bg-emerald-50',
    'bg-emerald-100',

    // Teals / Cyans
    'bg-teal-50',
    'bg-teal-100',
    'bg-cyan-50',
    'bg-cyan-100',

    // Blues / Sky
    'bg-sky-50',
    'bg-sky-100',
    'bg-blue-50',
    'bg-blue-100',

    // Indigos / Violets
    'bg-indigo-50',
    'bg-indigo-100',
    'bg-violet-50',
    'bg-violet-100',

    // Purples / Fuchsias
    'bg-purple-50',
    'bg-purple-100',
    'bg-fuchsia-50',
    'bg-fuchsia-100',

    // Pinks / Roses
    'bg-pink-50',
    'bg-pink-100',
    'bg-rose-50',
    'bg-rose-100',
  ],
  theme: {
    extend: {
      fontSize: {
        // Custom font sizes with line heights
        xs: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        sm: ['1rem', { lineHeight: '1.5rem' }],       // 16px
        base: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        lg: ['1.25rem', { lineHeight: '1.875rem' }],   // 20px
        xl: ['1.375rem', { lineHeight: '2rem' }],      // 22px
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
