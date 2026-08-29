import { api } from "@/lib/api";
import { dataLocalISO, parseDataLocal } from "@/lib/format";
import { StatusVenda, VendaResponse } from "@/types/vendas";

export interface ItemEncomendaAtencao {
  chave: string;
  id: number;
  clienteNome: string | null;
  status: StatusVenda;
  entregaAtrasada: boolean;
  dataEntregaPrevista: string;
  valorSaldo: number;
  href: string;
}

const DIAS_PARA_AVISAR_ENTREGA = 3;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Todas as vendas que são encomenda (têm data de entrega combinada) — inclui as já
 * ENTREGUE, pra telas como "/vendas/encomendas" que também mostram o histórico.
 */
export async function buscarEncomendas(): Promise<VendaResponse[]> {
  const vendas = await api.get<VendaResponse[]>("/vendas");
  return vendas.filter((v) => v.dataEntregaPrevista !== null);
}

/**
 * Encomendas em aberto (status != ENTREGUE) atrasadas ou com entrega vencendo nos
 * próximos dias. Fonte única da regra — usada pelo alerta flutuante
 * (AlertaEncomendaAtrasada, que filtra só as atrasadas) e pelo card de atenção da Home,
 * pra não ter duas definições de "encomenda que precisa de atenção" divergindo.
 */
export async function buscarEncomendasEmAtencao(): Promise<ItemEncomendaAtencao[]> {
  const encomendas = await buscarEncomendas();
  const hoje = parseDataLocal(dataLocalISO());

  return encomendas
    .filter((v) => v.status !== "ENTREGUE")
    .filter((v) => {
      const dias = Math.round((parseDataLocal(v.dataEntregaPrevista as string).getTime() - hoje.getTime()) / UM_DIA_MS);
      return v.entregaAtrasada || dias <= DIAS_PARA_AVISAR_ENTREGA;
    })
    .map((v) => ({
      chave: `venda:${v.id}`,
      id: v.id,
      clienteNome: v.clienteNome,
      status: v.status,
      entregaAtrasada: v.entregaAtrasada,
      dataEntregaPrevista: v.dataEntregaPrevista as string,
      valorSaldo: v.valorSaldo,
      href: `/vendas/${v.id}`,
    }))
    .sort((a, b) => parseDataLocal(a.dataEntregaPrevista).getTime() - parseDataLocal(b.dataEntregaPrevista).getTime());
}
