export type TipoLancamento = "RECEITA" | "DESPESA";
export type OrigemLancamento = "VENDA" | "COMPRA" | "CONTA" | "MANUAL";
export type TipoConta = "PAGAR" | "RECEBER";
export type StatusConta = "PENDENTE" | "PAGO" | "ATRASADO";

export interface LancamentoFinanceiroRequest {
  tipo: TipoLancamento;
  categoria: string;
  valor: number;
  descricao?: string | null;
  dataLancamento: string;
}

export interface LancamentoFinanceiroResponse {
  id: number;
  tipo: TipoLancamento;
  categoria: string;
  valor: number;
  descricao: string | null;
  origem: OrigemLancamento;
  origemId: number | null;
  dataLancamento: string;
  criadoEm: string;
}

/** Um item de matéria-prima comprado dentro de uma conta a pagar (ver
 * ItemMateriaPrimaCompra no backend). `materiaPrimaNome` só vem preenchido no
 * Response — no Request só o id importa, o backend resolve o nome sozinho. */
export interface ItemMateriaPrimaCompra {
  materiaPrimaId: number;
  materiaPrimaNome?: string;
  quantidade: number;
  valor: number;
}

export interface ContaRequest {
  tipo: TipoConta;
  descricao: string;
  valor: number;
  vencimento: string;
  /** Só em contas PAGAR: marca a conta como "compra de matéria-prima" e já dá
   * entrada no estoque de cada item. A soma dos itens + custosExtras precisa bater
   * com `valor` (o backend rejeita com 422 se não bater) — o front calcula `valor`
   * sozinho a partir desses dois, então na prática nunca diverge. */
  itensMateriaPrima?: ItemMateriaPrimaCompra[];
  /** Custo da compra que não é de nenhuma matéria-prima específica (frete, taxas,
   * etc.) — opcional, soma no `valor` calculado junto com os itens. */
  custosExtras?: number;
}

/** Registra uma conta parcelada de uma vez: o backend gera `quantidadeParcelas`
 * contas independentes, uma por mês a partir de `primeiroVencimento`, cada uma já
 * paga/editável/excluível sozinha dali em diante — ver ContaService.criarParcelada. */
export interface ContaParceladaRequest {
  tipo: TipoConta;
  descricao: string;
  valorTotal: number;
  quantidadeParcelas: number;
  primeiroVencimento: string;
  /** Ver ContaRequest.itensMateriaPrima — soma dos itens + custosExtras compara
   * contra `valorTotal`. */
  itensMateriaPrima?: ItemMateriaPrimaCompra[];
  /** Ver ContaRequest.custosExtras. */
  custosExtras?: number;
}

export interface ContaResponse {
  id: number;
  tipo: TipoConta;
  descricao: string;
  valor: number;
  vencimento: string;
  status: StatusConta;
  pagoEm: string | null;
  /** Nulos = conta avulsa (não veio de um parcelamento). */
  grupoParcelamentoId: string | null;
  numeroParcela: number | null;
  totalParcelas: number | null;
  criadoEm: string;
  /** Vazio = conta comum. Não vazio = essa conta é uma compra de matéria-prima (já deu
   * entrada no estoque); não dá pra editar o valor dessas contas depois. Numa conta
   * parcelada, o mesmo item aparece igual em todas as parcelas do grupo. */
  itensMateriaPrima: ItemMateriaPrimaCompra[];
  /** Ver ContaRequest.custosExtras. Ausente/0 = sem custo extra. */
  custosExtras?: number;
}

export interface DashboardFinanceiroResponse {
  periodoInicio: string;
  periodoFim: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalContasPagarPendentes: number;
  totalContasReceberPendentes: number;
  contasAtrasadas: number;
}
