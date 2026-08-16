"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Envolve o app com next-themes: aplica a classe `dark` na `<html>` (Tailwind
 * `darkMode: "class"`), respeita a preferência do sistema por padrão, e injeta um
 * script bloqueante antes da hidratação pra não piscar o tema errado no primeiro
 * paint (o próprio next-themes cuida disso via `suppressHydrationWarning` na `<html>`).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
