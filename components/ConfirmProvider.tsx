"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconAlertTriangle } from "@/components/Icon";

export interface ConfirmAction {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "danger";
}

export interface ConfirmOptions {
  titulo: string;
  /** Aceita `\n` pra quebra de linha (ex: juntar o motivo do bloqueio com a pergunta). */
  descricao?: string;
  tone?: "default" | "warning" | "danger";
  acoes: ConfirmAction[];
}

type Resolver = (id: string | null) => void;

const ConfirmContext = createContext<((opcoes: ConfirmOptions) => Promise<string | null>) | null>(null);

/**
 * Substitui `window.confirm`/`alert` por um modal no estilo visual do app. Uso:
 *
 *   const perguntar = useConfirm();
 *   const escolha = await perguntar({
 *     titulo: `Excluir "${item.nome}"?`,
 *     tone: "danger",
 *     acoes: [
 *       { id: "cancelar", label: "Cancelar", variant: "secondary" },
 *       { id: "excluir", label: "Excluir", variant: "danger" },
 *     ],
 *   });
 *   if (escolha === "excluir") { ... }
 *
 * Retorna o `id` da ação escolhida, ou `null` se fechado sem escolher (Esc/backdrop).
 */
export function useConfirm() {
  const perguntar = useContext(ConfirmContext);
  if (!perguntar) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>");
  return perguntar;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opcoes, setOpcoes] = useState<ConfirmOptions | null>(null);
  const [visivel, setVisivel] = useState(false);
  const resolverRef = useRef<Resolver | null>(null);

  const perguntar = useCallback((novasOpcoes: ConfirmOptions) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
      setOpcoes(novasOpcoes);
      requestAnimationFrame(() => setVisivel(true));
    });
  }, []);

  const fechar = useCallback((id: string | null) => {
    setVisivel(false);
    resolverRef.current?.(id);
    resolverRef.current = null;
    setTimeout(() => setOpcoes(null), 150);
  }, []);

  useEffect(() => {
    if (!opcoes) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fechar(null);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [opcoes, fechar]);

  const tonCores = {
    default: "bg-surface-hover text-ink-secondary",
    warning: "bg-warning-soft text-warning",
    danger: "bg-critical-soft text-critical",
  } as const;

  const botaoCores = {
    primary: "bg-accent text-accent-ink hover:brightness-105",
    secondary: "border border-hairline text-ink-secondary hover:bg-surface-hover",
    danger: "bg-critical text-white hover:brightness-110",
  } as const;

  return (
    <ConfirmContext.Provider value={perguntar}>
      {children}
      {opcoes && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] transition-opacity duration-150 ${
            visivel ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => fechar(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-titulo"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border border-hairline bg-surface p-6 shadow-2xl transition-all duration-150 ease-out ${
              visivel ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${tonCores[opcoes.tone ?? "default"]}`}
            >
              <IconAlertTriangle className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h2 id="confirm-titulo" className="text-lg font-bold text-ink">
              {opcoes.titulo}
            </h2>
            {opcoes.descricao && (
              <p className="mt-2 whitespace-pre-line text-base text-ink-secondary">{opcoes.descricao}</p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              {opcoes.acoes.map((acao, i) => (
                <button
                  key={acao.id}
                  // Foca a primeira ação (por convenção, a mais segura/"cancelar") —
                  // evita que apertar Enter sem querer dispare a ação destrutiva.
                  autoFocus={i === 0}
                  onClick={() => fechar(acao.id)}
                  className={`rounded-lg px-4 py-2.5 text-base font-semibold shadow-sm transition-colors ${botaoCores[acao.variant ?? "secondary"]}`}
                >
                  {acao.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
