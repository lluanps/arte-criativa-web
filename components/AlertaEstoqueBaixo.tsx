"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { MateriaPrimaResponse, ProdutoResponse } from "@/types/estoque";
import { IconAlertTriangle, IconX } from "@/components/Icon";

const CHAVE_LOCALSTORAGE = "arte-criativa:alerta-estoque";
const VEZES_PARA_OFERECER_SILENCIAR = 3;

interface RegistroItem {
  vezesMostrado: number;
  estoqueAtual: number;
  dispensadoPermanentemente: boolean;
}

interface ItemEstoqueBaixo {
  chave: string;
  tipo: "produto" | "materia-prima";
  id: number;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  unidade: string;
  vezesMostrado: number;
  href: string;
}

function lerRegistros(): Record<string, RegistroItem> {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCALSTORAGE);
    return bruto ? JSON.parse(bruto) : {};
  } catch {
    return {};
  }
}

function salvarRegistros(registros: Record<string, RegistroItem>) {
  try {
    localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(registros));
  } catch {
    // localStorage indisponível (modo privado, quota) — o alerta some ao trocar de
    // página, mas não quebra o app por causa disso.
  }
}

/**
 * Avisa (canto superior direito, em qualquer página) quando algum produto ou
 * matéria-prima está com estoque igual ou abaixo do mínimo cadastrado.
 *
 * "Ok, entendi" só esconde pra sessão atual (volta a aparecer se recarregar a página).
 * Depois de aparecer 3 vezes em sessões diferentes pro mesmo item, sem o estoque
 * mudar, também oferece "não mostrar novamente" — que aí só some quando o estoque
 * daquele item de fato mudar (reposição ou nova baixa).
 */
export function AlertaEstoqueBaixo() {
  const [itens, setItens] = useState<ItemEstoqueBaixo[]>([]);
  const [ocultoNestaSessao, setOcultoNestaSessao] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const [produtos, materiasPrimas] = await Promise.all([
          api.get<ProdutoResponse[]>("/produtos"),
          api.get<MateriaPrimaResponse[]>("/materias-primas"),
        ]);
        if (cancelado) return;

        const baixos: Omit<ItemEstoqueBaixo, "vezesMostrado">[] = [
          ...produtos
            .filter((p) => p.ativo && p.estoqueAtual <= p.estoqueMinimo)
            .map((p) => ({
              chave: `produto:${p.id}`,
              tipo: "produto" as const,
              id: p.id,
              nome: p.nome,
              estoqueAtual: p.estoqueAtual,
              estoqueMinimo: p.estoqueMinimo,
              unidade: "un.",
              href: `/estoque/produtos/${p.id}`,
            })),
          ...materiasPrimas
            .filter((mp) => mp.estoqueAtual <= mp.estoqueMinimo)
            .map((mp) => ({
              chave: `materia-prima:${mp.id}`,
              tipo: "materia-prima" as const,
              id: mp.id,
              nome: mp.nome,
              estoqueAtual: mp.estoqueAtual,
              estoqueMinimo: mp.estoqueMinimo,
              unidade: mp.unidadeMedida,
              href: `/estoque/materias-primas/${mp.id}`,
            })),
        ];

        const registros = lerRegistros();
        const chavesAtuais = new Set(baixos.map((item) => item.chave));
        const visiveis: ItemEstoqueBaixo[] = [];

        for (const item of baixos) {
          const registro = registros[item.chave];
          const estoqueMudou = !registro || registro.estoqueAtual !== item.estoqueAtual;

          if (registro?.dispensadoPermanentemente && !estoqueMudou) {
            continue; // silenciado, e o estoque não mudou desde então
          }

          const novoRegistro: RegistroItem = estoqueMudou
            ? { vezesMostrado: 1, estoqueAtual: item.estoqueAtual, dispensadoPermanentemente: false }
            : { ...registro, vezesMostrado: registro.vezesMostrado + 1, dispensadoPermanentemente: false };

          registros[item.chave] = novoRegistro;
          visiveis.push({ ...item, vezesMostrado: novoRegistro.vezesMostrado });
        }

        // Limpa registros de itens que não estão mais com estoque baixo, pra se
        // voltarem a ficar baixo no futuro começarem a contagem do zero.
        for (const chave of Object.keys(registros)) {
          if (!chavesAtuais.has(chave)) delete registros[chave];
        }

        salvarRegistros(registros);
        setItens(visiveis);
      } catch (e) {
        // Alerta é um "nice to have" — se a API falhar aqui, não vale mostrar erro
        // nenhum, as próprias páginas já cobrem isso.
        if (!(e instanceof ApiError)) throw e;
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  function silenciar(chave: string) {
    const registros = lerRegistros();
    if (registros[chave]) {
      registros[chave] = { ...registros[chave], dispensadoPermanentemente: true };
      salvarRegistros(registros);
    }
    setItens((atual) => atual.filter((item) => item.chave !== chave));
  }

  if (ocultoNestaSessao || itens.length === 0) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[90] sm:inset-x-auto sm:right-4 sm:w-96">
      <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
            <IconAlertTriangle className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-ink">
              {itens.length === 1 ? "1 item com estoque baixo" : `${itens.length} itens com estoque baixo`}
            </h2>
          </div>
          <button
            onClick={() => setOcultoNestaSessao(true)}
            aria-label="Fechar"
            className="shrink-0 text-ink-faint hover:text-ink-secondary"
          >
            <IconX className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <ul className="mt-3 max-h-64 overflow-y-auto">
          {itens.map((item) => (
            <li key={item.chave} className="border-t border-hairline py-2.5 first:border-0 first:pt-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={item.href} className="block truncate font-medium text-ink hover:underline">
                    {item.nome}
                  </Link>
                  <p className="text-sm text-ink-secondary">
                    {item.estoqueAtual} {item.unidade} · mínimo {item.estoqueMinimo} {item.unidade}
                  </p>
                </div>
                {item.vezesMostrado >= VEZES_PARA_OFERECER_SILENCIAR && (
                  <button
                    onClick={() => silenciar(item.chave)}
                    className="shrink-0 text-sm text-ink-faint hover:text-ink-secondary hover:underline"
                  >
                    Não mostrar novamente
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setOcultoNestaSessao(true)}
          className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-accent-ink shadow-sm transition-colors hover:brightness-105"
        >
          Ok, entendi
        </button>
      </div>
    </div>
  );
}
