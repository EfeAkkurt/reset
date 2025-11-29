/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./wallet/**/*.{ts,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    container: { center: true },
    extend: {
      fontFamily: {
        sans: ["var(--font-display)"],
        display: ["var(--font-display)"],
        mono: ["'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"],
      },
      colors: {
        // Core background and text
        bg: "var(--bg)",
        'bg-soft': "var(--bg-soft)",
        text: "var(--text)",
        'text-2': "var(--text-2)",

        // Gold palette
        gold: {
          50: "var(--gold-50)",
          100: "var(--gold-100)",
          200: "var(--gold-200)",
          300: "var(--gold-300)",
          400: "var(--gold-400)",
          500: "var(--gold-500)",
          600: "var(--gold-600)",
          700: "var(--gold-700)",
          800: "var(--gold-800)",
          900: "var(--gold-900)",
        },

        // Neutral palette
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
          black: "var(--bg)",
          'black-soft': "var(--bg-soft)",
        },

        // Semantic colors
        success: "#27C281",
        warning: "#F5B638",
        danger: "#FF5C5C",
        info: "#7AA7FF",

        // Alpha channels
        'alpha': {
          'white-8': "var(--alpha-white-8)",
          'white-12': "var(--alpha-white-12)",
          'black-20': "var(--alpha-black-20)",
          'black-40': "var(--alpha-black-40)",
          'gold-16': "var(--alpha-gold-16)",
        },

        // Legacy Tailwind colors (mapped to new system)
        border: "var(--neutral-800)",
        input: "var(--neutral-700)",
        ring: "var(--gold-500)",
        background: "var(--bg)",
        foreground: "var(--text)",
        primary: {
          DEFAULT: "var(--gold-500)",
          foreground: "var(--bg)",
        },
        secondary: {
          DEFAULT: "var(--bg-soft)",
          foreground: "var(--text)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "var(--text)",
        },
        muted: {
          DEFAULT: "var(--neutral-800)",
          foreground: "var(--text-2)",
        },
        accent: {
          DEFAULT: "var(--gold-400)",
          foreground: "var(--bg)",
        },
        popover: {
          DEFAULT: "var(--bg-soft)",
          foreground: "var(--text)",
        },
        card: {
          DEFAULT: "var(--bg-soft)",
          foreground: "var(--text)",
        },
      },
      backgroundImage: {
        'hero-glow': "var(--hero-glow)",
        'btn-grad': "var(--btn-grad)",
        'card-aura': "var(--card-aura)",
      },
      boxShadow: {
        'gold-soft': "var(--shadow-gold-soft)",
        'gold-strong': "var(--shadow-gold-strong)",
        'black-lg': "var(--shadow-black-lg)",
      },
      borderRadius: {
        'sm': "var(--radius-sm)",
        'md': "var(--radius-md)",
        'lg': "var(--radius-lg)",
        'xl': "var(--radius-xl)",
        'pill': "var(--radius-pill)",
      },
      animation: {
        'marquee': 'marquee 28s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'marquee-rev': 'marquee-rev 32s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'breathe': 'breathe-rotate 12s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-rev': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'breathe-rotate': {
          '0%': { transform: 'rotate(0deg) scale(1.05)', opacity: '0.95' },
          '100%': { transform: 'rotate(360deg) scale(1.05)', opacity: '0.95' },
        },
      },
    },
  },
  plugins: [
    require("daisyui"),
    // Custom plugin for graph backgrounds
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.graph-bg': {
          position: 'relative',
          backgroundColor: 'var(--gp-bg)',
          '--chart-step-h': 'calc(var(--gp-unit) * var(--gp-scale) * 2)',
          '--chart-step-v': 'calc(var(--gp-unit) * var(--gp-scale) * 1.5)',
          '--chart-major-h': 'calc(var(--chart-step-h) * 4)',
          '--chart-major-v': 'calc(var(--chart-step-v) * 6)',
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent calc(var(--chart-major-h) - 1px), var(--gp-10th) calc(var(--chart-major-h) - 1px), var(--gp-10th) calc(var(--chart-major-h) + 1px), transparent calc(var(--chart-major-h) + 1px)),
            repeating-linear-gradient(0deg, var(--gp-line), var(--gp-line) 0.5px, transparent 0.5px, transparent var(--chart-step-h)),
            repeating-linear-gradient(90deg, var(--gp-5th), var(--gp-5th) 0.5px, transparent 0.5px, transparent var(--chart-major-v)),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03) 0.5px, transparent 0.5px, transparent var(--chart-step-v))
          `,
        },
        '.graph-density-tight': { '--gp-scale': '0.75' },
        '.graph-density-normal': { '--gp-scale': '1' },
        '.graph-density-loose': { '--gp-scale': '1.4' },
      };
      addUtilities(newUtilities);
    },
  ],
};