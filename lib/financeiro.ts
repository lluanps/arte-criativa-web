import { api } from "@/lib/api";
import { dataLocalISO, parseDataLocal } from "@/lib/format";
import { ContaResponse, TipoConta } from "@/types/financeiro";

export interface ItemContaAtrasada {
  chave: string;
  id: number;
  tipo: TipoConta;
  descricao: string;
  valor: number;
  vencimento: string;
  diasEmAtraso: number;
  href: string;
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Contas (a pagar ou a receber) com status ATRASADO. O backend já calcula esse status
 * (`getStatusEfetivo()`, comparando vencimento com hoje) — aqui só filtra e adiciona
 * quantos dias de atraso, pra ordenar/exibir. Fonte única da regra — usada pelo alerta
 * flutuante (AlertaContaAtrasada) e por qualquer outra tela que precisar da mesma
 * lista, pra não ter duas definições de "conta atrasada" divergindo.
 */
export async function buscarContasAtrasadas(): Promise<ItemContaAtrasada[]> {
  const contas = await api.get<ContaResponse[]>("/contas");
  const hoje = parseDataLocal(dataLocalISO());

  return contas
    .filter((c) => c.status === "ATRASADO")
    .map((c) => ({
      chave: `conta:${c.id}`,
      id: c.id,
      tipo: c.tipo,
      descricao: c.descricao,
      valor: c.valor,
      vencimento: c.vencimento,
      diasEmAtraso: Math.round((hoje.getTime() - parseDataLocal(c.vencimento).getTime()) / UM_DIA_MS),
      href: "/financeiro/contas",
    }))
    .sort((a, b) => b.diasEmAtraso - a.diasEmAtraso);
}
