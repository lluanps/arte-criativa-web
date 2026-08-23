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

export interface ContaRequest {
  tipo: TipoConta;
  descricao: string;
  valor: number;
  vencimento: string;
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
