"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Envolve o app com next-themes: aplica `data-theme="light"|"dark"` na `<html>`
 * quando o usuário escolhe manualmente (é isso que os seletores `[data-theme="dark"]`
 * em globals.css esperam — "class" e "data-theme" são estratégias diferentes do
 * next-themes, não podem ser misturadas). Sem escolha explícita ("sistema"), nenhum
 * atributo é gravado e quem decide é só o `prefers-color-scheme` do SO. Um script
 * bloqueante evita piscar o tema errado no primeiro paint (via `suppressHydrationWarning`
 * na `<html>`).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
