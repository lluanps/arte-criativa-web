"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { buscarContasAtrasadas, ItemContaAtrasada as ItemContaAtrasadaBase } from "@/lib/financeiro";
import { formatarData, formatarMoeda } from "@/lib/format";
import { IconAlertTriangle, IconX } from "@/components/Icon";

const CHAVE_LOCALSTORAGE = "arte-criativa:alerta-conta-atrasada";
const VEZES_PARA_OFERECER_SILENCIAR = 3;

interface RegistroItem {
  vezesMostrado: number;
  valor: number;
  dispensadoPermanentemente: boolean;
}

interface ItemContaAtrasada extends ItemContaAtrasadaBase {
  vezesMostrado: number;
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
 * Avisa quando alguma conta (a pagar ou a receber) está com status ATRASADO.
 * Espelha AlertaEstoqueBaixo — mesma lógica de "quantas vezes já mostrou" e "não
 * mostrar novamente". Renderiza só o cartão — o posicionamento fixo na tela (e o
 * empilhamento com AlertaEstoqueBaixo) é responsabilidade do AppShell.
 *
 * "Ok, entendi" só esconde pra sessão atual (volta a aparecer se recarregar a página).
 * Depois de aparecer 3 vezes em sessões diferentes pra mesma conta, sem o valor
 * mudar, também oferece "não mostrar novamente" — que aí só some quando a conta
 * de fato mudar (editada) ou deixar de estar atrasada (paga).
 */
export function AlertaContaAtrasada() {
  const [itens, setItens] = useState<ItemContaAtrasada[]>([]);
  const [ocultoNestaSessao, setOcultoNestaSessao] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const atrasadas = await buscarContasAtrasadas();
        if (cancelado) return;

        const registros = lerRegistros();
        const chavesAtuais = new Set(atrasadas.map((item) => item.chave));
        const visiveis: ItemContaAtrasada[] = [];

        for (const item of atrasadas) {
          const registro = registros[item.chave];
          const valorMudou = !registro || registro.valor !== item.valor;

          if (registro?.dispensadoPermanentemente && !valorMudou) {
            continue; // silenciada, e o valor não mudou desde então
          }

          const novoRegistro: RegistroItem = valorMudou
            ? { vezesMostrado: 1, valor: item.valor, dispensadoPermanentemente: false }
            : { ...registro, vezesMostrado: registro.vezesMostrado + 1, dispensadoPermanentemente: false };

          registros[item.chave] = novoRegistro;
          visiveis.push({ ...item, vezesMostrado: novoRegistro.vezesMostrado });
        }

        // Limpa registros de contas que não estão mais atrasadas, pra se voltarem a
        // atrasar no futuro começarem a contagem do zero.
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
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-critical-soft text-critical">
          <IconAlertTriangle className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-ink">
            {itens.length === 1 ? "1 conta atrasada" : `${itens.length} contas atrasadas`}
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
                  {item.descricao}
                </Link>
                <p className="text-sm text-ink-secondary">
                  {item.tipo === "PAGAR" ? "A pagar" : "A receber"} · {formatarMoeda(item.valor)} · venceu em{" "}
                  {formatarData(item.vencimento)}
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
        className="mt-3 w-full rounded-lg border border-hairline px-4 py-2.5 text-base font-semibold text-ink-secondary shadow-sm transition-colors hover:bg-surface-hover"
      >
        Ok, entendi
      </button>
    </div>
  );
}
