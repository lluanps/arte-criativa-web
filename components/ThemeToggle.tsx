"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMonitor, IconMoon, IconSun } from "@/components/Icon";

const OPCOES = [
  { valor: "light", rotulo: "Claro", Icone: IconSun },
  { valor: "dark", rotulo: "Escuro", Icone: IconMoon },
  { valor: "system", rotulo: "Sistema", Icone: IconMonitor },
] as const;

/**
 * Alterna entre claro / escuro / sistema. Só renderiza depois de montar no
 * client — antes disso o tema resolvido é desconhecido (evita mismatch de
 * hidratação entre server e client).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  if (!montado) {
    return <div className="h-8 w-full shrink-0" aria-hidden />;
  }

  const atual = OPCOES.find((o) => o.valor === theme) ?? OPCOES[2];

  function proximo() {
    const indiceAtual = OPCOES.findIndex((o) => o.valor === atual.valor);
    setTheme(OPCOES[(indiceAtual + 1) % OPCOES.length].valor);
  }

  return (
    <button
      type="button"
      onClick={proximo}
      className="flex w-full items-center gap-2 rounded-lg bg-sidebar-raised px-3 py-2 text-xs font-medium text-sidebar-ink-muted transition-colors hover:text-sidebar-ink"
      title={`Tema: ${atual.rotulo} (clique pra trocar)`}
      aria-label={`Tema atual: ${atual.rotulo}. Clique pra trocar.`}
    >
      <atual.Icone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {atual.rotulo}
    </button>
  );
}
