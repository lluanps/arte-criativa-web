import type { Config } from "tailwindcss";

const config: Config = {
  // Sem "dark:" em lugar nenhum do código — o tema é resolvido inteiramente pelas CSS
  // custom properties em globals.css (ver ThemeProvider.tsx, attribute="data-theme").
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens do design system do ateliê — cada um aponta pra uma CSS custom
        // property definida em globals.css, que troca de valor entre os temas claro/
        // escuro sozinha (sem precisar de `dark:` espalhado pelo código).
        sidebar: "var(--sidebar)",
        "sidebar-raised": "var(--sidebar-raised)",
        "sidebar-ink": "var(--sidebar-ink)",
        "sidebar-ink-muted": "var(--sidebar-ink-muted)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-faint": "var(--ink-faint)",
        hairline: "var(--hairline)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        good: "var(--good)",
        "good-soft": "var(--good-soft)",
        warning: "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        critical: "var(--critical)",
        "critical-soft": "var(--critical-soft)",
      },
    },
  },
  plugins: [],
};

export default config;
