// Reset — Gold/Black design tokens (single source of truth)
// Export these for use in React components, charts, or any JS that needs dynamic colors

export const colors = {
  // --- Core brand ---
  brand: {
    gold: {
      50: "#FFF5E5",
      100: "#FFE7C2",
      200: "#FFD18A",
      300: "#FFB648", // primary gold (buttons/accents)
      400: "#F3A233",
      500: "#E0912C", // hover/darker edge
      600: "#C77E25",
      700: "#A4681E",
      800: "#7F5016",
      900: "#5C3A10",
    },
    // warm amber "core glow" used in gradients
    amber: "#FFB648",
  },

  // --- Neutrals (UI surfaces) ---
  neutral: {
    // pure blacks for deep background
    white: "#FFFFFF",
    black: "#0A0A0A",
    blackSoft: "#0F0F10",
    // layered greys for cards/lines
    900: "#121214",
    800: "#1A1B1E",
    700: "#222326",
    600: "#2B2C30",
    500: "#34363B",
    400: "#4A4D55",
    300: "#6C707A",
    200: "#8B909B",
    100: "#B7BCC7",
    50: "#E3E6EC",
  },

  // --- Text ---
  text: {
    primary: "#FFFFFF",
    secondary: "#D8D9DE",
    muted: "#A7ABB4",
    onGold: "#1A1A1A",
  },

  // --- Semantic (optional hooks) ---
  success: "#27C281",
  warning: "#F5B638",
  danger: "#FF5C5C",
  info: "#7AA7FF",

  // --- Overlays / alpha ---
  alpha: {
    white8: "rgba(255,255,255,0.08)",
    white12: "rgba(255,255,255,0.12)",
    black20: "rgba(0,0,0,0.20)",
    black40: "rgba(0,0,0,0.40)",
    gold16: "rgba(255,182,72,0.16)",
  },

  // --- Gradients (from the reference shots) ---
  gradients: {
    // hero background glow (top-right warm burst → bottom-left dark)
    heroGlow: "radial-gradient(1200px 600px at 75% 15%, #FFB648 0%, rgba(255,182,72,0.25) 35%, rgba(0,0,0,0) 60%), linear-gradient(180deg, #0A0A0A 0%, #121214 100%)",

    // button fill (subtle inner-light)
    button: "linear-gradient(180deg, #FFB648 0%, #E0912C 100%)",

    // card edge glow used behind logos/badges
    cardAura: "radial-gradient(400px 240px at 50% 10%, rgba(255,182,72,0.35) 0%, rgba(255,182,72,0.08) 40%, rgba(0,0,0,0) 70%)",
  },

  // --- Shadows / "neon" glow ---
  shadows: {
    goldSoft: "0 8px 24px rgba(255,182,72,0.22)",
    goldStrong: "0 12px 36px rgba(255,182,72,0.32)",
    blackLg: "0 10px 30px rgba(0,0,0,0.6)",
  },

  // --- Radii (UI consistency) ---
  radius: {
    sm: "10px",
    md: "16px",
    lg: "22px",
    xl: "28px",
    pill: "999px",
  },
} as const;

// Helper functions for common use cases
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: unknown = colors;

  for (const key of keys) {
    if (typeof value === 'object' && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      console.warn(`Color path "${path}" not found`);
      return '#000000';
    }
  }

  if (typeof value !== 'string') {
     console.warn(`Color path "${path}" did not resolve to a string`);
     return '#000000';
  }

  return value;
};

// Common color combinations
export const themes = {
  light: {
    bg: colors.neutral.white,
    text: colors.neutral.black,
    primary: colors.brand.gold[500],
  },
  dark: {
    bg: colors.neutral.black,
    text: colors.text.primary,
    primary: colors.brand.gold[300],
  },
} as const;

// Export types for TypeScript support
export type OIColors = typeof colors;
export type ColorPath = string;
export type Theme = keyof typeof themes;