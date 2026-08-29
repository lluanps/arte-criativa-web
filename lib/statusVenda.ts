import { StatusVenda, VendaResponse } from "@/types/vendas";

type ToneBadge = "default" | "success" | "danger" | "warning";

const LABEL: Record<StatusVenda, string> = {
  PENDENTE: "Pendente",
  EM_PRODUCAO: "Em produção",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
};

const TONE: Record<StatusVenda, ToneBadge> = {
  PENDENTE: "warning",
  EM_PRODUCAO: "warning",
  PRONTO: "default",
  ENTREGUE: "success",
};

const ORDEM: StatusVenda[] = ["PENDENTE", "EM_PRODUCAO", "PRONTO", "ENTREGUE"];

type VendaComStatus = Pick<VendaResponse, "status" | "entregaAtrasada">;

/**
 * Centralizado de propósito — diferente do padrão hoje usado pra StatusConta (cor/label
 * duplicados em cada tela que precisa). StatusVenda aparece em 5 lugares desde o
 * início (lista, detalhe, página de encomendas, card da Home, alerta flutuante) e
 * depende de uma regra derivada (`entregaAtrasada`, que sobrepõe o rótulo/cor normal
 * do status pra "Atrasada"/danger) fácil de esquecer numa cópia. Não é um convite pra
 * migrar StatusConta pro mesmo padrão — isso fica fora de escopo daqui.
 */
export function labelDoStatusVenda(venda: VendaComStatus): string {
  if (venda.entregaAtrasada) return "Atrasada";
  return LABEL[venda.status];
}

export function corDoStatusVenda(venda: VendaComStatus): ToneBadge {
  if (venda.entregaAtrasada) return "danger";
  return TONE[venda.status];
}

/** Próximo estágio sequencial (mesma ordem do enum StatusVenda no backend), ou null se
 * já ENTREGUE (não tem próximo). */
export function proximoStatusVenda(status: StatusVenda): StatusVenda | null {
  const indiceAtual = ORDEM.indexOf(status);
  return indiceAtual === ORDEM.length - 1 ? null : ORDEM[indiceAtual + 1];
}
