/** Email-safe palette — web fonts won't load in most clients; Georgia is the serif fallback. */
export const colors = {
  background: "#F5F1EA",
  surface: "#FFFFFF",
  accent: "#2F4A3E",
  accentMuted: "#4A6B5C",
  text: "#1C1A17",
  textMuted: "#6B6560",
  border: "#E4DDD3",
} as const;

export const fonts = {
  serif: 'Georgia, "Times New Roman", Times, serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;
