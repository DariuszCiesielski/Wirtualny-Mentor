/**
 * Theme metadata for the theme switcher UI.
 * CSS variables for each theme are defined in globals.css.
 */

export const themeOptions = [
  {
    id: "light",
    name: "Klasyczny",
    description: "Jasny motyw",
    colors: ["#171717", "#ffffff", "#f5f5f5"],
  },
  {
    id: "dark",
    name: "Ciemny",
    description: "Elegancki ciemny",
    colors: ["#fafafa", "#0a0a0a", "#171717"],
  },
  {
    id: "glass",
    name: "Szkło",
    description: "Glassmorphism",
    colors: ["#3b82f6", "#0f172a", "#1e293b"],
  },
  {
    id: "minimal",
    name: "Minimalistyczny",
    description: "Stonowany, indigo",
    colors: ["#6366f1", "#fafafa", "#ffffff"],
  },
  {
    id: "gradient",
    name: "Gradientowy",
    description: "Purple gradienty",
    colors: ["#8b5cf6", "#0f0a1a", "#1a1030"],
  },
  {
    id: "corporate",
    name: "Korporacyjny",
    description: "Profesjonalny, teal",
    colors: ["#0d9488", "#fafffe", "#ffffff"],
  },
] as const;

export type ThemeId = (typeof themeOptions)[number]["id"];

export const THEME_IDS = themeOptions.map((t) => t.id);
