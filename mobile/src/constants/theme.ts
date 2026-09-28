/**
 * Central design tokens - "Modern Organic + Premium Minimal + Dark Green
 * Signature". Every screen should pull colors/spacing/radius/typography/
 * shadows from here instead of hardcoding values, so the app reads as one
 * consistent system.
 */

export const colors = {
  brandDark: "#1b4332",
  primary: "#2f9e44",
  primaryPressed: "#278a3b",

  bg: "#f9fcf9",
  bgAlt: "#f6fbf6",
  surface: "#ffffff",

  textPrimary: "#1b4332",
  textSecondary: "#5c7a6a",
  textMuted: "#7a8f83",
  textOnDark: "#ffffff",
  textOnDarkMuted: "rgba(255,255,255,0.75)",

  border: "#e6f0e8",
  borderAlt: "#eef5ef",

  noticeText: "#966b1f",
  noticeBg: "#fff7e0",

  attention: "#c2670c",
  attentionBg: "#fff8ee",
  attentionBorder: "#f6d9a8",

  danger: "#c92a2a",

  chipInactiveBg: "#f3f8f4",
  chipInactiveText: "#5c7a6a",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  control: 12,
  button: 14,
  card: 18,
  hero: 22,
  pill: 999,
} as const;

export const shadow = {
  soft: {
    shadowColor: "#0d2818",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  button: {
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

export const type = {
  hero: { fontSize: 28, fontWeight: "800" as const },
  title: { fontSize: 24, fontWeight: "800" as const },
  section: { fontSize: 17, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, fontWeight: "600" as const },
  meta: { fontSize: 13, fontWeight: "600" as const },
  label: { fontSize: 12, fontWeight: "600" as const },
};

export const iconSize = {
  sm: 15,
  md: 18,
  lg: 22,
  xl: 28,
};
