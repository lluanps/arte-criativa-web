import { dataLocalISO, parseDataLocal } from "@/lib/format";
import { LancamentoFinanceiroResponse } from "@/types/financeiro";

export interface PontoFluxoCaixa {
  chave: string;
  rotulo: string;
  receitas: number;
  despesas: number;
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;

function diferencaEmDias(inicio: string, fim: string): number {
  return Math.round((parseDataLocal(fim).getTime() - parseDataLocal(inicio).getTime()) / UM_DIA_MS);
}

function inicioDaSemana(data: string): string {
  const d = parseDataLocal(data);
  const diaDaSemana = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - diaDaSemana);
  return dataLocalISO(d);
}

const ROTULO_DIA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/**
 * Agrupa lançamentos em pontos de receita/despesa por dia (períodos curtos) ou por
 * semana (períodos longos, pra não estourar o gráfico de barras com dezenas de
 * colunas ilegíveis). Inclui buckets vazios (0/0) pros dias/semanas sem lançamento,
 * senão o eixo do tempo fica com buracos.
 */
export function agruparFluxoCaixa(
  lancamentos: LancamentoFinanceiroResponse[],
  inicio: string,
  fim: string
): PontoFluxoCaixa[] {
  const totalDias = diferencaEmDias(inicio, fim) + 1;
  const porSemana = totalDias > 40;

  const buckets = new Map<string, PontoFluxoCaixa>();

  if (porSemana) {
    let cursor = inicioDaSemana(inicio);
    const fimSemana = inicioDaSemana(fim);
    while (cursor <= fimSemana) {
      buckets.set(cursor, { chave: cursor, rotulo: ROTULO_DIA.format(parseDataLocal(cursor)), receitas: 0, despesas: 0 });
      const proxima = parseDataLocal(cursor);
      proxima.setDate(proxima.getDate() + 7);
      cursor = dataLocalISO(proxima);
    }
  } else {
    let cursor = inicio;
    while (cursor <= fim) {
      buckets.set(cursor, { chave: cursor, rotulo: ROTULO_DIA.format(parseDataLocal(cursor)), receitas: 0, despesas: 0 });
      const proximo = parseDataLocal(cursor);
      proximo.setDate(proximo.getDate() + 1);
      cursor = dataLocalISO(proximo);
    }
  }

  for (const l of lancamentos) {
    const chave = porSemana ? inicioDaSemana(l.dataLancamento) : l.dataLancamento;
    const bucket = buckets.get(chave);
    if (!bucket) continue; // lançamento fora do período pedido (não deveria acontecer)
    if (l.tipo === "RECEITA") bucket.receitas += l.valor;
    else bucket.despesas += l.valor;
  }

  return Array.from(buckets.values());
}

export interface FatiaCategoria {
  categoria: string;
  valor: number;
}

const LIMITE_CATEGORIAS = 6;

/**
 * Soma DESPESAs por categoria, ordena decrescente e dobra o rabo em "Outras" pra
 * não estourar o teto de séries legíveis num ranking (categoria é texto livre,
 * cardinalidade não tem limite).
 */
export function agruparDespesasPorCategoria(lancamentos: LancamentoFinanceiroResponse[]): FatiaCategoria[] {
  const somaPorCategoria = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.tipo !== "DESPESA") continue;
    somaPorCategoria.set(l.categoria, (somaPorCategoria.get(l.categoria) ?? 0) + l.valor);
  }

  const ordenado = Array.from(somaPorCategoria.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  if (ordenado.length <= LIMITE_CATEGORIAS) return ordenado;

  const principais = ordenado.slice(0, LIMITE_CATEGORIAS);
  const restante = ordenado.slice(LIMITE_CATEGORIAS).reduce((soma, item) => soma + item.valor, 0);
  return [...principais, { categoria: "Outras", valor: restante }];
}
