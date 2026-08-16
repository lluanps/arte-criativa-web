"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const OPCOES = [
  { valor: "light", rotulo: "Claro", icone: "☀️" },
  { valor: "dark", rotulo: "Escuro", icone: "🌙" },
  { valor: "system", rotulo: "Sistema", icone: "🖥️" },
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
    return <div className="h-8 w-[92px] shrink-0" aria-hidden />;
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
      className="flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      title={`Tema: ${atual.rotulo} (clique pra trocar)`}
      aria-label={`Tema atual: ${atual.rotulo}. Clique pra trocar.`}
    >
      <span aria-hidden>{atual.icone}</span>
      {atual.rotulo}
    </button>
  );
}
