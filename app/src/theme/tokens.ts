/**
 * Aegis design tokens — "Calm Clinical · Light Luxury" (elevated).
 *
 * Premium, editorial, trustworthy. Warm ivory base (not cold grey), deep emerald
 * accent, warm ink, a disciplined brass micro-accent. Type pairs a serif display
 * (Fraunces) with a clean grotesk (Inter). With custom fonts, the family encodes
 * weight — set `fontFamily`, not `fontWeight`.
 */

export const palette = {
  // Warm paper surfaces — ivory, not grey. Cards are warm-white and lift off it.
  bg: "#F5F1E8",
  bgWarmTop: "#F8F4EC", // subtle top-of-screen wash for gradient atmosphere
  surface: "#FFFDF8",
  surfaceSunken: "#ECE6D8",
  surfaceInk: "#13201C", // deep warm green-black for hero/contrast cards

  // Warm ink hierarchy.
  ink: "#1B1813",
  inkSecondary: "#574F45",
  inkTertiary: "#6B6358", // darkened for WCAG AA at 11–14px on ivory/surface
  inkOnDark: "#F4F1E8",
  inkOnDarkDim: "#9DB0A7",
  inkOnAccent: "#FFFFFF",

  // Accent — deep emerald: luxurious, clinical, trustworthy.
  accent: "#0E5C54",
  accentDeep: "#0A413B",
  accentSoft: "#DCEAE5",
  accentRing: "#4FA39A",

  // Brass micro-accent — used sparingly for premium detail (hairlines, marks).
  brass: "#B0894F",
  brassSoft: "#EFE6D4",

  // Semantic flags — muted/sophisticated, warm-tinted softs.
  high: "#9A4824", // darkened for WCAG AA on highSoft at 12px
  highSoft: "#F6E3D6",
  low: "#2E5AAC",
  lowSoft: "#DFE6F4",
  normal: "#2E6B4A",
  normalSoft: "#DCEBDE",

  // Lines & shadow (warm).
  hairline: "#E7E0D2",
  hairlineStrong: "#D6CDBA",
  shadow: "#2B2415",
} as const;

// Font family names match the @expo-google-fonts exports loaded in App.tsx.
export const font = {
  display: "Fraunces_600SemiBold",
  displayItalic: "Fraunces_700Bold_Italic",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const type = {
  // Serif display carries the editorial/premium character.
  hero: { fontFamily: font.display, fontSize: 46, lineHeight: 48, letterSpacing: -1 },
  display: { fontFamily: font.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.6 },
  h1: { fontFamily: font.semibold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  h2: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  h3: { fontFamily: font.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 25 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  smallStrong: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 },
  // Eyebrow / labels — tracked Inter for a refined editorial tag.
  caption: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 1.2 },
  // Numeric lab values — Fraunces gives them weight + character.
  mono: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22 },
  numeral: { fontFamily: font.display, fontSize: 30, lineHeight: 32, letterSpacing: -0.5 },
} as const;

// Soft, warm, layered elevation.
export const shadow = {
  card: {
    shadowColor: palette.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  raised: {
    shadowColor: palette.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  soft: {
    shadowColor: palette.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
} as const;

